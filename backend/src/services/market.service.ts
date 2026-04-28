import {
    MarketData, MarketType, getMarketsForCrop,
    getBaseMSP, seededRandom, getDistance,
    getRealisticPriceEstimate
} from './market-data';
import { GeminiMarketService } from './gemini-market.service';
import { ApiMarketPrice, MarketApiService, OsmMarket } from './market-api.service';

export interface MarketPrice {
    name: string;
    district: string;
    state: string;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    email?: string | null;
    sourceUrls?: string[];
    lat: number;
    lon: number;
    distance: number;
    price: number;
    minPrice: number;
    maxPrice: number;
    trend: number;
    volume: number;
    profitPotential: 'High' | 'Medium' | 'Low';
    marketType: MarketType;
    priceSource: 'agmarknet' | 'estimated' | 'osm_estimated';
    discoverySource: 'osm' | 'gemini' | 'hardcoded';
    confidence: 'high' | 'medium' | 'low';
}

export interface TrendPoint {
    date: string;
    localPrice: number | null;
    nationalAvg: number | null;
    msp: number;
}

type CandidateMarket = Omit<MarketPrice, 'price' | 'minPrice' | 'maxPrice' | 'trend' | 'volume' | 'profitPotential' | 'priceSource'> & {
    volumeBase: number;
};

const marketCache: Record<string, { timestamp: number; data: { nearestMarket: MarketPrice; alternativeMarkets: MarketPrice[] } }> = {};
const MARKET_CACHE_TTL = 15 * 60 * 1000;

function buildFallbackTrend(cropName: string, state: string, days: number, msp: number): TrendPoint[] {
    const today = new Date();
    const points: TrendPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const localSeed = `${cropName}-local-${state}-${dateStr}`;
        const natSeed = `${cropName}-national-${dateStr}`;

        const statePremium = (seededRandom(`premium-state-${state}-${cropName}`) - 0.5) * 0.15;
        const localVariation = (seededRandom(localSeed) - 0.5) * 0.08;
        const natVariation = (seededRandom(natSeed) - 0.5) * 0.06;
        const trendFactor = 1 + (days - i) / days * 0.05;

        const localPrice = Math.round(msp * (1 + statePremium) * (1 + localVariation) * trendFactor);
        const nationalAvg = Math.round(msp * (1 + natVariation) * trendFactor);

        points.push({
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            localPrice,
            nationalAvg,
            msp,
        });
    }
    return points;
}

const normalizeName = (value: string): string =>
    value
        .toLowerCase()
        .replace(/\b(apmc|market|market complex|market yard|vegetable|wholesale|sabji|bazaar|krishi business kendra)\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const overlapRatio = (left: string, right: string): number => {
    const leftTokens = new Set(normalizeName(left).split(' ').filter(Boolean));
    const rightTokens = new Set(normalizeName(right).split(' ').filter(Boolean));
    if (leftTokens.size === 0 || rightTokens.size === 0) {
        return 0;
    }

    let overlap = 0;
    for (const token of leftTokens) {
        if (rightTokens.has(token)) {
            overlap += 1;
        }
    }

    return overlap / Math.max(leftTokens.size, rightTokens.size);
};

const isValidCoordinate = (lat: number, lon: number): boolean =>
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !(lat === 0 && lon === 0);

const mapOsmTypeToMarketType = (osmType: string): MarketType => {
    switch (osmType) {
        case 'wholesale':
            return 'apmc';
        case 'marketplace':
        case 'greengrocer':
        case 'vegetables':
        case 'farm_shop':
        case 'supermarket':
        default:
            return 'vegetable';
    }
};

const mapGeminiTypeToMarketType = (marketType: string): MarketType => {
    if (marketType === 'apmc' || marketType === 'wholesale') {
        return 'apmc';
    }
    if (marketType === 'vegetable' || marketType === 'marketplace') {
        return 'vegetable';
    }
    return 'local_estimate';
};

const discoveryPriority: Record<CandidateMarket['discoverySource'], number> = {
    osm: 3,
    gemini: 2,
    hardcoded: 1
};

const confidencePriority: Record<CandidateMarket['confidence'], number> = {
    high: 3,
    medium: 2,
    low: 1
};

const mergeCandidateMarkets = (markets: CandidateMarket[]): CandidateMarket[] => {
    const merged: CandidateMarket[] = [];

    for (const market of markets) {
        const duplicate = merged.find((existing) => {
            const closeBy = getDistance(existing.lat, existing.lon, market.lat, market.lon) <= 1.2;
            const nameMatch = overlapRatio(existing.name, market.name) >= 0.55;
            return closeBy || (nameMatch && closeBy);
        });

        if (!duplicate) {
            merged.push(market);
            continue;
        }

        const currentScore = discoveryPriority[duplicate.discoverySource] * 10 + confidencePriority[duplicate.confidence];
        const incomingScore = discoveryPriority[market.discoverySource] * 10 + confidencePriority[market.confidence];

        if (incomingScore > currentScore) {
            duplicate.name = market.name;
            duplicate.marketType = market.marketType;
            duplicate.discoverySource = market.discoverySource;
            duplicate.confidence = market.confidence;
            duplicate.lat = market.lat;
            duplicate.lon = market.lon;
            duplicate.distance = market.distance;
            duplicate.volumeBase = market.volumeBase;
        }

        duplicate.address = duplicate.address || market.address || null;
        duplicate.district = duplicate.district || market.district;
        duplicate.state = duplicate.state || market.state;
        duplicate.phone = duplicate.phone || market.phone || null;
        duplicate.website = duplicate.website || market.website || null;
        duplicate.email = duplicate.email || market.email || null;
        duplicate.sourceUrls = Array.from(new Set([...(duplicate.sourceUrls || []), ...(market.sourceUrls || [])]));
    }

    return merged.sort((a, b) => a.distance - b.distance);
};

const findBestAgmarknetMatch = (market: CandidateMarket, liveApiData: ApiMarketPrice[]): ApiMarketPrice | null => {
    let best: { score: number; record: ApiMarketPrice } | null = null;

    for (const record of liveApiData) {
        let score = overlapRatio(market.name, record.market) * 100;
        if (market.district && record.district && market.district.toLowerCase() === record.district.toLowerCase()) {
            score += 20;
        }
        if (market.state && record.state && market.state.toLowerCase() === record.state.toLowerCase()) {
            score += 10;
        }
        if (score >= 55 && (!best || score > best.score)) {
            best = { score, record };
        }
    }

    return best?.record ?? null;
};

const buildEstimatedPrice = (
    market: CandidateMarket,
    cropName: string,
    todayStr: string,
    yestStr: string,
    matchedLiveMarket: ApiMarketPrice | null,
    referencePrices: number[]
): Pick<MarketPrice, 'price' | 'minPrice' | 'maxPrice' | 'trend' | 'volume' | 'priceSource'> => {
    if (matchedLiveMarket) {
        const modal = matchedLiveMarket.modal_price || getBaseMSP(cropName);
        const min = matchedLiveMarket.min_price || Math.round(modal * 0.93);
        const max = matchedLiveMarket.max_price || Math.round(modal * 1.07);

        return {
            price: modal,
            minPrice: min,
            maxPrice: max,
            trend: parseFloat((((seededRandom(`${market.name}-${todayStr}`) - 0.5) * 6)).toFixed(2)),
            volume: Math.max(market.volumeBase, 150),
            priceSource: 'agmarknet'
        };
    }

    const baseMarket: MarketData = {
        name: market.name,
        district: market.district,
        state: market.state,
        lat: market.lat,
        lon: market.lon,
        volumeBase: market.volumeBase,
        marketType: market.marketType
    };

    let baseMspOverride: number | undefined;
    if (referencePrices.length > 0) {
        baseMspOverride = Math.round(referencePrices.reduce((sum, price) => sum + price, 0) / referencePrices.length);
    }

    const estimate = getRealisticPriceEstimate(baseMarket, cropName, todayStr, yestStr, baseMspOverride);

    return {
        price: estimate.price,
        minPrice: Math.round(estimate.price * 0.93),
        maxPrice: Math.round(estimate.price * 1.07),
        trend: estimate.trend,
        volume: estimate.volume,
        priceSource: market.discoverySource === 'osm' ? 'osm_estimated' : 'estimated'
    };
};

export class MarketService {
    static async getMarketPrices(
        cropName: string,
        farmerLat: number,
        farmerLon: number,
        stateName: string = 'Kerala',
        districtName?: string,
        placeName?: string
    ): Promise<{ nearestMarket: MarketPrice; alternativeMarkets: MarketPrice[] }> {
        const cacheKey = [
            cropName.toLowerCase(),
            farmerLat.toFixed(3),
            farmerLon.toFixed(3),
            stateName.toLowerCase(),
            (districtName || '').toLowerCase(),
            (placeName || '').toLowerCase()
        ].join(':');

        const cached = marketCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < MARKET_CACHE_TTL) {
            return cached.data;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const yestStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const [osmMarkets, liveApiData, geminiMarkets] = await Promise.all([
            MarketApiService.fetchNearbyMarkets(farmerLat, farmerLon, 40),
            MarketApiService.fetchLiveMarkets(cropName, stateName),
            GeminiMarketService.findNearbyMarkets({
                cropName,
                lat: farmerLat,
                lon: farmerLon,
                state: stateName,
                district: districtName,
                place: placeName
            })
        ]);

        const hardcodedMarkets = getMarketsForCrop(cropName)
            .filter((market) => getDistance(farmerLat, farmerLon, market.lat, market.lon) <= 150);

        const candidateMarkets: CandidateMarket[] = [
            ...osmMarkets
                .filter((market) => isValidCoordinate(market.lat, market.lon))
                .map((market): CandidateMarket => ({
                    name: market.name,
                    district: market.district || districtName || '',
                    state: market.state || stateName,
                    address: market.address || null,
                    phone: market.phone || null,
                    website: market.website || null,
                    email: market.email || null,
                    sourceUrls: [],
                    lat: market.lat,
                    lon: market.lon,
                    distance: Math.round(getDistance(farmerLat, farmerLon, market.lat, market.lon) * 10) / 10,
                    marketType: mapOsmTypeToMarketType(market.type),
                    discoverySource: 'osm',
                    confidence: 'high',
                    volumeBase: market.type === 'wholesale' ? 500 : market.type === 'marketplace' ? 300 : 180
                })),
            ...geminiMarkets
                .filter((market) => isValidCoordinate(market.approximateLat, market.approximateLon))
                .map((market): CandidateMarket => ({
                    name: market.name,
                    district: market.district || districtName || '',
                    state: market.state || stateName,
                    address: market.address || null,
                    phone: market.phone || null,
                    website: market.website || null,
                    email: market.email || null,
                    sourceUrls: market.sourceUrls,
                    lat: market.approximateLat,
                    lon: market.approximateLon,
                    distance: Math.round(getDistance(farmerLat, farmerLon, market.approximateLat, market.approximateLon) * 10) / 10,
                    marketType: mapGeminiTypeToMarketType(market.marketType),
                    discoverySource: 'gemini',
                    confidence: market.confidence,
                    volumeBase: market.marketType === 'wholesale' || market.marketType === 'apmc' ? 450 : 220
                })),
            ...hardcodedMarkets
                .filter((market) => isValidCoordinate(market.lat, market.lon))
                .map((market): CandidateMarket => ({
                    name: market.name,
                    district: market.district,
                    state: market.state,
                    address: null,
                    phone: null,
                    website: null,
                    email: null,
                    sourceUrls: [],
                    lat: market.lat,
                    lon: market.lon,
                    distance: Math.round(getDistance(farmerLat, farmerLon, market.lat, market.lon) * 10) / 10,
                    marketType: market.marketType,
                    discoverySource: 'hardcoded',
                    confidence: 'medium',
                    volumeBase: market.volumeBase
                }))
        ];

        const deduped = mergeCandidateMarkets(candidateMarkets).slice(0, 40);

        const matchedLiveRecords = deduped.map((market) => findBestAgmarknetMatch(market, liveApiData));
        const referencePrices = matchedLiveRecords.filter(Boolean).map((record) => (record as ApiMarketPrice).modal_price).filter((price) => price > 0);

        const pricedMarkets: MarketPrice[] = deduped.map((market, index) => {
            const priceMeta = buildEstimatedPrice(market, cropName, todayStr, yestStr, matchedLiveRecords[index], referencePrices);

            return {
                ...market,
                ...priceMeta,
                profitPotential: 'Medium'
            };
        });

        const validPrices = pricedMarkets.map((market) => market.price).filter((price) => price > 0);
        const maxPrice = Math.max(...validPrices);
        const minPrice = Math.min(...validPrices);
        const priceRange = maxPrice - minPrice || 1;

        const rankedMarkets = pricedMarkets
            .map((market) => {
                const score = (market.price - minPrice) / priceRange;
                let profitPotential: MarketPrice['profitPotential'] = 'Medium';
                if (score >= 0.65) {
                    profitPotential = 'High';
                } else if (score <= 0.35) {
                    profitPotential = 'Low';
                }
                return { ...market, profitPotential };
            })
            .sort((left, right) => left.distance - right.distance);

        const nearestMarket = rankedMarkets[0] || {
            name: `${placeName || stateName} Local Market`,
            district: districtName || 'Unknown',
            state: stateName,
            address: null,
            phone: null,
            website: null,
            email: null,
            sourceUrls: [],
            lat: farmerLat,
            lon: farmerLon,
            distance: 0,
            price: getBaseMSP(cropName),
            minPrice: Math.round(getBaseMSP(cropName) * 0.93),
            maxPrice: Math.round(getBaseMSP(cropName) * 1.07),
            trend: 0,
            volume: 100,
            profitPotential: 'Medium' as const,
            marketType: 'local_estimate' as const,
            priceSource: 'estimated' as const,
            discoverySource: 'hardcoded' as const,
            confidence: 'low' as const,
        };

        const alternativeMarkets = rankedMarkets.slice(1);
        const result = { nearestMarket, alternativeMarkets };
        marketCache[cacheKey] = { timestamp: Date.now(), data: result };
        return result;
    }

    static async getTrendHistory(
        cropName: string,
        state: string,
        days = 30
    ): Promise<{ trend: TrendPoint[]; source: 'real' | 'simulated' }> {
        const msp = getBaseMSP(cropName);

        // Try fetching real historical data from AGMARKNET
        try {
            const historicalRecords = await MarketApiService.fetchHistoricalPrices(cropName, state, days);

            if (historicalRecords.length >= 5) {
                // Group records by date and compute daily averages
                const dateMap = new Map<string, { localPrices: number[]; allPrices: number[] }>();

                for (const record of historicalRecords) {
                    // Parse dd/mm/yyyy → yyyy-mm-dd
                    const parts = record.arrival_date.split('/');
                    if (parts.length !== 3) continue;
                    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

                    if (!dateMap.has(isoDate)) {
                        dateMap.set(isoDate, { localPrices: [], allPrices: [] });
                    }
                    const entry = dateMap.get(isoDate)!;
                    entry.allPrices.push(record.modal_price);

                    // If the record is from the target state, it's a "local" price
                    if (record.state.toLowerCase() === state.toLowerCase()) {
                        entry.localPrices.push(record.modal_price);
                    }
                }

                // Also fetch national data (all states) for national average line
                let nationalRecords: typeof historicalRecords = [];
                try {
                    // Fetch without state filter by passing a broad state
                    // We'll use the allPrices from the state-filtered query as proxy for national
                    // since the AGMARKNET API doesn't easily support no-state filter
                    nationalRecords = historicalRecords; // Use same dataset as baseline
                } catch { /* silent */ }

                // Build sorted trend points
                const sortedDates = Array.from(dateMap.keys()).sort();
                const trend: TrendPoint[] = sortedDates.map(isoDate => {
                    const entry = dateMap.get(isoDate)!;
                    const d = new Date(isoDate);
                    const dateLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                    const localAvg = entry.localPrices.length > 0
                        ? Math.round(entry.localPrices.reduce((s, p) => s + p, 0) / entry.localPrices.length)
                        : null;

                    const nationalAvg = entry.allPrices.length > 0
                        ? Math.round(entry.allPrices.reduce((s, p) => s + p, 0) / entry.allPrices.length)
                        : null;

                    return {
                        date: dateLabel,
                        localPrice: localAvg,
                        nationalAvg: nationalAvg,
                        msp,
                    };
                });

                // Only use real data if we have enough points with local prices
                const realLocalPoints = trend.filter(t => t.localPrice !== null);
                if (realLocalPoints.length >= 5) {
                    console.log(`[TREND] Real data: ${realLocalPoints.length} points for ${cropName} in ${state}`);
                    return { trend, source: 'real' };
                }
            }
        } catch (error) {
            console.error('[TREND] Real data fetch failed, falling back to simulation:', (error as any)?.message);
        }

        // Fallback to simulation
        const trend = buildFallbackTrend(cropName, state, days, msp);
        return { trend, source: 'simulated' };
    }
}
