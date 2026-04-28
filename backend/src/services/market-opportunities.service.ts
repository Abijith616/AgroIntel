import axios from 'axios';
import { MarketType } from './market-data';
import { MarketService, MarketPrice } from './market.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketOpportunity {
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
    distance: number;          // km from farmer
    price: number;             // ₹/quintal today
    minPrice: number;
    maxPrice: number;
    trend: number;             // % vs yesterday
    volume: number;            // tonnes/day
    priceGap: number;          // price - localPrice (₹/qt)
    priceGapPercent: number;   // % above local
    transportCost: number;     // estimated ₹/qt
    netGain: number;           // priceGap - transportCost
    profitPotential: 'High' | 'Medium' | 'Low';
    marketType: MarketType;
    priceSource: 'agmarknet' | 'estimated' | 'osm_estimated';
}

export interface MarketOpportunitiesResult {
    crop: string;
    localMarket: {
        name: string;
        district: string;
        state: string;
        address?: string | null;
        phone?: string | null;
        website?: string | null;
        email?: string | null;
        sourceUrls?: string[];
        price: number;
        trend: number;
        marketType: MarketType;
        priceSource: 'agmarknet' | 'estimated' | 'osm_estimated';
    };
    topOpportunities: MarketOpportunity[];
    bestOpportunity: MarketOpportunity | null;
    aiInsight: string;
    lastUpdated: string;
    source: string;
}

// ─── Groq AI ──────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(messages: { role: string; content: string }[], attempt = 0): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');
    const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192'];
    const model = models[Math.min(attempt, models.length - 1)];
    try {
        const res = await axios.post(GROQ_API_URL, {
            model,
            messages,
            temperature: 0.4,
            max_tokens: 600,
        }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        return res.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
        if (err?.response?.status === 429 && attempt < models.length) {
            const wait = Math.min(parseInt(err.response?.headers?.['retry-after'] ?? '5', 10) * 1000, 10000);
            await new Promise(r => setTimeout(r, wait));
            return callGroq(messages, attempt + 1);
        }
        throw err;
    }
}

async function generateAIInsight(
    cropName: string,
    farmerState: string,
    localPrice: number,
    top3: MarketOpportunity[]
): Promise<string> {
    const oppLines = top3.map((o, i) => {
        const typeLabel = o.marketType === 'vegetable' ? '(Vegetable Market)' :
            o.marketType === 'local_estimate' ? '(Local Market Est.)' : '(APMC)';
        const sourceLabel = o.priceSource === 'agmarknet' ? '[LIVE PRICE]' : '[ESTIMATED]';
        return `${i + 1}. ${o.name} ${typeLabel}, ${o.state}: ₹${o.price}/qt ${sourceLabel} (+${o.priceGapPercent}% vs local, net gain ~₹${o.netGain}/qt after transport)`;
    }).join('\n');

    const system = `You are AgroIntel AI, an expert Indian agricultural market advisor. Give a SHORT, plain-language insight (3–5 sentences max) for a farmer about their market selling opportunities. Write simply, like you're advising an Indian farmer directly. Be specific with numbers. No bullet points — just flowing advice. When mentioning local vegetable markets or estimated prices, note that they are estimates based on nearby tracked markets.`;

    const user = `Farmer grows ${cropName} in ${farmerState}. Current local market price: ₹${localPrice}/quintal.

Top alternative markets with higher prices:
${oppLines}

Give a concise 3-5 sentence insight: which market is best, whether it's worth the distance, any timing advice, and one risk to watch.`;

    try {
        return await callGroq([{ role: 'system', content: system }, { role: 'user', content: user }]);
    } catch {
        // Fallback if AI fails
        if (top3.length === 0) return `Your local market offers the best prices right now. Monitor other markets daily for emerging opportunities.`;
        const best = top3[0];
        return `${best.name} in ${best.state} is showing the strongest opportunity at ₹${best.price}/quintal — that's ${best.priceGapPercent}% above your local price. After estimated transport costs, you could net around ₹${best.netGain} extra per quintal. Factor in the ${best.distance}km distance and consider selling in batches to reduce risk.`;
    }
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class MarketOpportunitiesService {
    static async getOpportunities(
        cropName: string,
        farmerLat: number,
        farmerLon: number,
        farmerState: string,
        farmerDistrict?: string,
        farmerPlace?: string
    ): Promise<MarketOpportunitiesResult> {
        // Re-use the powerful logic from MarketService that merges curated & live data
        const { nearestMarket: local, alternativeMarkets } = await MarketService.getMarketPrices(
            cropName, farmerLat, farmerLon, farmerState, farmerDistrict, farmerPlace
        );

        const localPrice = local.price;

        // Build opportunity list
        const opportunities: MarketOpportunity[] = alternativeMarkets.map(m => {
            const priceGap = m.price - localPrice;
            const priceGapPercent = parseFloat(((priceGap / localPrice) * 100).toFixed(1));
            
            // Rough transport cost: ₹1.5/km/quintal (truck avg)
            const transportCost = Math.round(m.distance * 1.5);
            const netGain = priceGap - transportCost;
            
            let profitPotential: 'High' | 'Medium' | 'Low' = 'Medium';
            if (netGain > 200) profitPotential = 'High';
            else if (netGain < 0) profitPotential = 'Low';
            
            return {
                name: m.name,
                district: m.district,
                state: m.state,
                address: m.address,
                phone: m.phone,
                website: m.website,
                email: m.email,
                sourceUrls: m.sourceUrls,
                lat: m.lat,
                lon: m.lon,
                distance: m.distance,
                price: m.price,
                minPrice: m.minPrice,
                maxPrice: m.maxPrice,
                trend: m.trend,
                volume: m.volume,
                priceGap,
                priceGapPercent,
                transportCost,
                netGain,
                profitPotential,
                marketType: m.marketType,
                priceSource: m.priceSource,
            };
        });

        // Rank by net gain descending
        opportunities.sort((a, b) => b.netGain - a.netGain);

        // Show all opportunities, sorted by net gain
        const top3ForAI = opportunities.filter(o => o.netGain > 0).slice(0, 3);
        const bestOpportunity = opportunities[0] ?? null;

        const aiInsight = await generateAIInsight(cropName, farmerState, localPrice, top3ForAI);

        return {
            crop: cropName,
            localMarket: {
                name: local.name,
                district: local.district,
                state: local.state,
                address: local.address,
                phone: local.phone,
                website: local.website,
                email: local.email,
                sourceUrls: local.sourceUrls,
                price: localPrice,
                trend: local.trend,
                marketType: local.marketType,
                priceSource: local.priceSource,
            },
            topOpportunities: opportunities,
            bestOpportunity,
            aiInsight,
            lastUpdated: new Date().toISOString(),
            source: 'OpenStreetMap + Agmarknet API + Curated Estimates + Groq AI',
        };
    }
}
