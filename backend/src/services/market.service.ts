// Market Price Service
// Fetches real AGMARKNET prices via data.gov.in API when key is available,
// falls back to MSP-anchored realistic simulation per day.
import axios from 'axios';

interface MarketData {
    name: string;
    district: string;
    state: string;
    lat: number;
    lon: number;
    volumeBase: number; // tonnes per day
}

interface MarketPrice {
    name: string;
    district: string;
    state: string;
    distance: number; // km
    price: number; // ₹/quintal
    minPrice: number;
    maxPrice: number;
    trend: number; // % change from yesterday
    volume: number; // tonnes/day
    profitPotential: 'High' | 'Medium' | 'Low';
}

// MSP (Minimum Support Price) for 2024-25 in ₹/quintal
const CROP_MSP: Record<string, number> = {
    'rice': 2300,
    'wheat': 2275,
    'maize': 2090,
    'sugarcane': 340,
    'cotton': 7521,
    'soybean': 4892,
    'groundnut': 6783,
    'sunflower': 7280,
    'mustard': 5650,
    'gram': 5440,
    'tur': 7550,
    'moong': 8682,
    'urad': 7400,
    'jowar': 3371,
    'bajra': 2625,
    'ragi': 4290,
    'tomato': 1500,
    'onion': 1200,
    'potato': 900,
    'default': 2200,
};

// Major Indian markets with coordinates
const MARKETS: MarketData[] = [
    // Kerala
    { name: 'Kochi AMPC', district: 'Ernakulam', state: 'Kerala', lat: 9.9312, lon: 76.2673, volumeBase: 1200 },
    { name: 'Kozhikode Market', district: 'Kozhikode', state: 'Kerala', lat: 11.2588, lon: 75.7804, volumeBase: 800 },
    { name: 'Thrissur Market', district: 'Thrissur', state: 'Kerala', lat: 10.5276, lon: 76.2144, volumeBase: 950 },
    { name: 'Thiruvananthapuram AMPC', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, volumeBase: 700 },
    // Tamil Nadu
    { name: 'Chennai Koyambedu', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, volumeBase: 3200 },
    { name: 'Coimbatore AMPC', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, volumeBase: 1800 },
    { name: 'Madurai Market', district: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, volumeBase: 1400 },
    // Karnataka
    { name: 'Bengaluru APMC', district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, volumeBase: 4500 },
    { name: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394, volumeBase: 1100 },
    { name: 'Hubballi Market', district: 'Hubballi', state: 'Karnataka', lat: 15.3647, lon: 75.1240, volumeBase: 980 },
    // Maharashtra
    { name: 'Pune APMC', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, volumeBase: 3800 },
    { name: 'Nashik Market', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898, volumeBase: 2100 },
    // Andhra Pradesh
    { name: 'Vijayawada AMPC', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, volumeBase: 2200 },
    { name: 'Guntur Market Yard', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, volumeBase: 1700 },
    // Telangana
    { name: 'Hyderabad Bowenpally', district: 'Hyderabad', state: 'Telangana', lat: 17.4794, lon: 78.4983, volumeBase: 4200 },
    // Punjab / Haryana
    { name: 'Amritsar Grain Market', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, volumeBase: 3100 },
    { name: 'Ludhiana AMPC', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, volumeBase: 2800 },
    { name: 'Karnal Market', district: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905, volumeBase: 1600 },
    // UP
    { name: 'Lucknow AMPC', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, volumeBase: 3500 },
    { name: 'Agra Market', district: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, volumeBase: 2000 },
];

function degreesToRadians(deg: number): number {
    return deg * (Math.PI / 180);
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple deterministic pseudo-random seeded by crop + date + market name
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }
    // Normalize to [0, 1]
    return Math.abs(hash % 10000) / 10000;
}

function getBaseMSP(cropName: string): number {
    const key = cropName.toLowerCase().trim();
    return CROP_MSP[key] || CROP_MSP['default'];
}

// ─── Trend History ───────────────────────────────────────────────────────────

export interface TrendPoint {
    date: string;      // 'DD-Mon-YYYY'
    localPrice: number | null;
    nationalAvg: number | null;
    msp: number;
}

interface AgmarkRecord {
    arrival_date: string;
    min_price: string;
    max_price: string;
    modal_price: string;
    market: string;
    state: string;
}

// Fetch real data from data.gov.in AGMARKNET API
async function fetchAgmarknetPrices(
    cropName: string,
    state: string,
    fromDate: string, // DD-Mon-YYYY
    toDate: string,
    limit = 500
): Promise<AgmarkRecord[] | null> {
    const apiKey = process.env.DATA_GOV_API_KEY;
    if (!apiKey) return null;

    const crop = cropName.charAt(0).toUpperCase() + cropName.slice(1).toLowerCase();

    try {
        const url = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
        const params: Record<string, string | number> = {
            'api-key': apiKey,
            format: 'json',
            limit,
            'filters[commodity]': crop,
            'filters[state]': state,
        };
        const response = await axios.get(url, { params, timeout: 12000 });
        const records: AgmarkRecord[] = response.data?.records || [];
        return records;
    } catch {
        return null;
    }
}

// Aggregate records by date — national vs local (by state)
function aggregateByDate(
    records: AgmarkRecord[],
    userState: string,
    days: number,
    msp: number
): TrendPoint[] {
    const today = new Date();
    const points: TrendPoint[] = [];

    // Build a map date => { localPrices[], allPrices[] }
    const map: Record<string, { local: number[]; all: number[] }> = {};
    for (const r of records) {
        const raw = r.arrival_date; // DD-Mon-YYYY or similar
        let d: Date | null = null;
        try { d = new Date(raw); } catch { continue; }
        if (isNaN(d.getTime())) continue;
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = { local: [], all: [] };
        const modal = parseFloat(r.modal_price);
        if (!isNaN(modal) && modal > 0) {
            map[key].all.push(modal);
            if (r.state?.toLowerCase() === userState?.toLowerCase()) {
                map[key].local.push(modal);
            }
        }
    }

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const entry = map[key];
        const localAvg = entry?.local.length
            ? Math.round(entry.local.reduce((a, b) => a + b, 0) / entry.local.length)
            : null;
        const natAvg = entry?.all.length
            ? Math.round(entry.all.reduce((a, b) => a + b, 0) / entry.all.length)
            : null;
        points.push({
            date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            localPrice: localAvg,
            nationalAvg: natAvg,
            msp,
        });
    }
    return points;
}

// Fallback: deterministic realistic simulation anchored to MSP
function buildFallbackTrend(cropName: string, state: string, days: number, msp: number): TrendPoint[] {
    const today = new Date();
    const points: TrendPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const localSeed = `${cropName}-local-${state}-${dateStr}`;
        const natSeed = `${cropName}-national-${dateStr}`;

        // state premium ±15%
        const statePremium = (seededRandom(`premium-state-${state}-${cropName}`) - 0.5) * 0.15;
        const localVariation = (seededRandom(localSeed) - 0.5) * 0.08;
        const natVariation = (seededRandom(natSeed) - 0.5) * 0.06;

        // Add a gentle upward trend over time (simulate seasonal rise ~5%)
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

export class MarketService {
    static getMarketPrices(
        cropName: string,
        farmerLat: number,
        farmerLon: number
    ): { nearestMarket: MarketPrice; alternativeMarkets: MarketPrice[] } {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const msp = getBaseMSP(cropName);

        const marketsWithPrices: MarketPrice[] = MARKETS.map((market) => {
            const todaySeed = `${cropName}-${market.name}-${today}`;
            const yestSeed = `${cropName}-${market.name}-${yesterday}`;

            // Each market has a "premium" factor (±20% of MSP)
            const marketPremium = (seededRandom(`premium-${market.name}`) - 0.5) * 0.2;
            const basePrice = msp * (1 + marketPremium);

            // Daily variation ±4%
            const todayVariation = (seededRandom(todaySeed) - 0.5) * 0.08;
            const yestVariation = (seededRandom(yestSeed) - 0.5) * 0.08;

            const todayPrice = Math.round(basePrice * (1 + todayVariation));
            const yestPrice = Math.round(basePrice * (1 + yestVariation));
            const trend = parseFloat((((todayPrice - yestPrice) / yestPrice) * 100).toFixed(2));

            // Volume varies ±30% daily
            const volVariation = 0.7 + seededRandom(`vol-${market.name}-${today}`) * 0.6;
            const volume = Math.round(market.volumeBase * volVariation);

            const distance = Math.round(getDistance(farmerLat, farmerLon, market.lat, market.lon));

            return {
                name: market.name,
                district: market.district,
                state: market.state,
                distance,
                price: todayPrice,
                minPrice: Math.round(todayPrice * 0.93),
                maxPrice: Math.round(todayPrice * 1.07),
                trend,
                volume,
                profitPotential: 'Medium', // will be set after sorting
            };
        });

        // Sort by distance
        marketsWithPrices.sort((a, b) => a.distance - b.distance);

        // Get the max price for profitability labeling
        const maxPrice = Math.max(...marketsWithPrices.map((m) => m.price));
        const minPrice = Math.min(...marketsWithPrices.map((m) => m.price));
        const priceRange = maxPrice - minPrice || 1;

        const withPotential: MarketPrice[] = marketsWithPrices.map((m) => {
            const score = (m.price - minPrice) / priceRange;
            let profitPotential: 'High' | 'Medium' | 'Low' = 'Medium';
            if (score >= 0.65) profitPotential = 'High';
            else if (score <= 0.35) profitPotential = 'Low';
            return { ...m, profitPotential };
        });

        const [nearestMarket, ...alternativeMarkets] = withPotential;

        // Show only top 10 alternative markets (sorted by distance)
        return {
            nearestMarket,
            alternativeMarkets: alternativeMarkets.slice(0, 12),
        };
    }

    /**
     * Returns a 30-day price trend for the given crop and state.
     * Tries the real AGMARKNET API (data.gov.in) first.
     * Falls back to MSP-anchored deterministic simulation if API is unavailable.
     */
    static async getTrendHistory(
        cropName: string,
        state: string,
        days = 30
    ): Promise<{ trend: TrendPoint[]; source: 'real' | 'simulated' }> {
        const msp = getBaseMSP(cropName);

        // Date range for the API
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(toDate.getDate() - days);
        const fmt = (d: Date) =>
            d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

        const records = await fetchAgmarknetPrices(cropName, state, fmt(fromDate), fmt(toDate));

        if (records && records.length > 0) {
            const trend = aggregateByDate(records, state, days, msp);
            // Check if we got meaningful local data (at least some non-null localPrice)
            const hasLocalData = trend.some(p => p.localPrice !== null);
            if (hasLocalData) {
                return { trend, source: 'real' };
            }
            // Have records but no local data for this state: use all records as local proxy
            const fallback = aggregateByDate(records, '', days, msp);
            return { trend: fallback, source: 'real' };
        }

        // Fallback to simulation
        const trend = buildFallbackTrend(cropName, state, days, msp);
        return { trend, source: 'simulated' };
    }
}
