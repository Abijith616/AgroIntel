import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketOpportunity {
    name: string;
    district: string;
    state: string;
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
}

export interface MarketOpportunitiesResult {
    crop: string;
    localMarket: {
        name: string;
        district: string;
        state: string;
        price: number;
        trend: number;
    };
    topOpportunities: MarketOpportunity[];
    bestOpportunity: MarketOpportunity | null;
    aiInsight: string;
    lastUpdated: string;
    source: string;
}

// ─── Market Data (mirrors market.service.ts) ──────────────────────────────────

interface MarketData {
    name: string;
    district: string;
    state: string;
    lat: number;
    lon: number;
    volumeBase: number;
}

const CROP_MSP: Record<string, number> = {
    'rice': 2300, 'wheat': 2275, 'maize': 2090, 'sugarcane': 340,
    'cotton': 7521, 'soybean': 4892, 'groundnut': 6783, 'sunflower': 7280,
    'mustard': 5650, 'gram': 5440, 'tur': 7550, 'moong': 8682,
    'urad': 7400, 'jowar': 3371, 'bajra': 2625, 'ragi': 4290,
    'tomato': 1500, 'onion': 1200, 'potato': 900, 'default': 2200,
};

const MARKETS: MarketData[] = [
    { name: 'Kochi AMPC', district: 'Ernakulam', state: 'Kerala', lat: 9.9312, lon: 76.2673, volumeBase: 1200 },
    { name: 'Kozhikode Market', district: 'Kozhikode', state: 'Kerala', lat: 11.2588, lon: 75.7804, volumeBase: 800 },
    { name: 'Thrissur Market', district: 'Thrissur', state: 'Kerala', lat: 10.5276, lon: 76.2144, volumeBase: 950 },
    { name: 'Thiruvananthapuram APMC', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, volumeBase: 700 },
    { name: 'Chennai Koyambedu', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, volumeBase: 3200 },
    { name: 'Coimbatore APMC', district: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, volumeBase: 1800 },
    { name: 'Madurai Market', district: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, volumeBase: 1400 },
    { name: 'Salem APMC', district: 'Salem', state: 'Tamil Nadu', lat: 11.6640, lon: 78.1460, volumeBase: 1100 },
    { name: 'Bengaluru APMC', district: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, volumeBase: 4500 },
    { name: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394, volumeBase: 1100 },
    { name: 'Hubballi Market', district: 'Hubballi', state: 'Karnataka', lat: 15.3647, lon: 75.1240, volumeBase: 980 },
    { name: 'Mangaluru APMC', district: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lon: 74.8560, volumeBase: 870 },
    { name: 'Pune APMC', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, volumeBase: 3800 },
    { name: 'Nashik Market', district: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898, volumeBase: 2100 },
    { name: 'Mumbai APMC', district: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, volumeBase: 5000 },
    { name: 'Vijayawada AMPC', district: 'Krishna', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, volumeBase: 2200 },
    { name: 'Guntur Market Yard', district: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, volumeBase: 1700 },
    { name: 'Hyderabad Bowenpally', district: 'Hyderabad', state: 'Telangana', lat: 17.4794, lon: 78.4983, volumeBase: 4200 },
    { name: 'Amritsar Grain Market', district: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, volumeBase: 3100 },
    { name: 'Ludhiana APMC', district: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, volumeBase: 2800 },
    { name: 'Karnal Market', district: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905, volumeBase: 1600 },
    { name: 'Lucknow APMC', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, volumeBase: 3500 },
    { name: 'Delhi Azadpur', district: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025, volumeBase: 6000 },
    { name: 'Jaipur APMC', district: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, volumeBase: 2400 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deg2rad(deg: number) { return deg * (Math.PI / 180); }

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const c = seed.charCodeAt(i);
        hash = (hash << 5) - hash + c;
        hash &= hash;
    }
    return Math.abs(hash % 10000) / 10000;
}

function getBaseMSP(cropName: string): number {
    return CROP_MSP[cropName.toLowerCase().trim()] ?? CROP_MSP['default'];
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
    const oppLines = top3.map((o, i) =>
        `${i + 1}. ${o.name}, ${o.state}: ₹${o.price}/qt (+${o.priceGapPercent}% vs local, net gain ~₹${o.netGain}/qt after transport)`
    ).join('\n');

    const system = `You are AgroIntel AI, an expert Indian agricultural market advisor. Give a SHORT, plain-language insight (3–5 sentences max) for a farmer about their market selling opportunities. Write simply, like you're advising an Indian farmer directly. Be specific with numbers. No bullet points — just flowing advice.`;

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
        farmerState: string
    ): Promise<MarketOpportunitiesResult> {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const msp = getBaseMSP(cropName);

        // Price all markets
        const priced = MARKETS.map(m => {
            const marketPremium = (seededRandom(`premium-${m.name}`) - 0.5) * 0.2;
            const base = msp * (1 + marketPremium);
            const todayVar = (seededRandom(`${cropName}-${m.name}-${today}`) - 0.5) * 0.08;
            const yestVar = (seededRandom(`${cropName}-${m.name}-${yesterday}`) - 0.5) * 0.08;
            const price = Math.round(base * (1 + todayVar));
            const yestPrice = Math.round(base * (1 + yestVar));
            const trend = parseFloat((((price - yestPrice) / yestPrice) * 100).toFixed(2));
            const volVar = 0.7 + seededRandom(`vol-${m.name}-${today}`) * 0.6;
            const volume = Math.round(m.volumeBase * volVar);
            const distance = Math.round(getDistance(farmerLat, farmerLon, m.lat, m.lon));
            return { ...m, price, yestPrice, trend, volume, distance, minPrice: Math.round(price * 0.93), maxPrice: Math.round(price * 1.07) };
        });

        // Sort by distance; nearest = local market
        priced.sort((a, b) => a.distance - b.distance);
        const local = priced[0];
        const localPrice = local.price;

        // Build opportunity list — all except the local market
        const opportunities: MarketOpportunity[] = priced.slice(1).map(m => {
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
            };
        });

        // Rank by net gain descending
        opportunities.sort((a, b) => b.netGain - a.netGain);

        const top10 = opportunities.slice(0, 10);
        const top3ForAI = opportunities.filter(o => o.netGain > 0).slice(0, 3);
        const bestOpportunity = top10[0] ?? null;

        const aiInsight = await generateAIInsight(cropName, farmerState, localPrice, top3ForAI);

        return {
            crop: cropName,
            localMarket: {
                name: local.name,
                district: local.district,
                state: local.state,
                price: localPrice,
                trend: local.trend,
            },
            topOpportunities: top10,
            bestOpportunity,
            aiInsight,
            lastUpdated: new Date().toISOString(),
            source: 'MSP-anchored simulation + Groq AI insight',
        };
    }
}
