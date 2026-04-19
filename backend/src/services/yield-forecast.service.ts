import axios from 'axios';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';

// ── MSP data (₹/quintal) ─────────────────────────────────────────────────────
const CROP_MSP: Record<string, number> = {
    rice: 2300, wheat: 2275, maize: 2090, sugarcane: 340,
    cotton: 7521, soybean: 4892, groundnut: 6783, sunflower: 7280,
    mustard: 5650, gram: 5440, tur: 7550, moong: 8682,
    urad: 7400, jowar: 3371, bajra: 2625, ragi: 4290,
    tomato: 1500, onion: 1200, potato: 900, default: 2200,
};

// ── Market catalogue ─────────────────────────────────────────────────────────
export const MARKET_CATALOGUE = [
    // Local / Domestic
    { id: 'kochi-ampc', name: 'Kochi AMPC', type: 'local', state: 'Kerala', avgPriceMultiplier: 1.02, transportPerKm: 1.5 },
    { id: 'thrissur-market', name: 'Thrissur Market', type: 'local', state: 'Kerala', avgPriceMultiplier: 0.98, transportPerKm: 1.5 },
    { id: 'chennai-koyambedu', name: 'Chennai Koyambedu', type: 'local', state: 'Tamil Nadu', avgPriceMultiplier: 1.08, transportPerKm: 1.5 },
    { id: 'bengaluru-apmc', name: 'Bengaluru APMC', type: 'local', state: 'Karnataka', avgPriceMultiplier: 1.10, transportPerKm: 1.5 },
    { id: 'pune-apmc', name: 'Pune APMC', type: 'local', state: 'Maharashtra', avgPriceMultiplier: 1.06, transportPerKm: 1.5 },
    { id: 'hyderabad-bowenpally', name: 'Hyderabad Bowenpally', type: 'local', state: 'Telangana', avgPriceMultiplier: 1.12, transportPerKm: 1.5 },
    { id: 'amritsar-grain', name: 'Amritsar Grain Market', type: 'local', state: 'Punjab', avgPriceMultiplier: 1.04, transportPerKm: 1.5 },
    { id: 'lucknow-ampc', name: 'Lucknow AMPC', type: 'local', state: 'Uttar Pradesh', avgPriceMultiplier: 1.00, transportPerKm: 1.5 },
    // Export / International
    { id: 'nhava-sheva', name: 'Nhava Sheva Port (Mumbai)', type: 'export', country: 'India (Export Hub)', avgPriceMultiplier: 1.30, transportPerKm: 2.0 },
    { id: 'chennai-port', name: 'Chennai Port', type: 'export', country: 'India (Export Hub)', avgPriceMultiplier: 1.28, transportPerKm: 2.0 },
    { id: 'cochin-port', name: 'Cochin Port', type: 'export', country: 'India (Export Hub)', avgPriceMultiplier: 1.25, transportPerKm: 2.0 },
    { id: 'dubai-central', name: 'Dubai Central Market (UAE)', type: 'export', country: 'UAE', avgPriceMultiplier: 1.55, transportPerKm: 2.5 },
    { id: 'singapore-wholesale', name: 'Singapore Wholesale Hub', type: 'export', country: 'Singapore', avgPriceMultiplier: 1.60, transportPerKm: 2.8 },
    { id: 'uk-import', name: 'UK Fresh Produce Importers', type: 'export', country: 'United Kingdom', avgPriceMultiplier: 1.70, transportPerKm: 3.0 },
    { id: 'us-organic', name: 'US Organic Market (East Coast)', type: 'export', country: 'USA', avgPriceMultiplier: 1.80, transportPerKm: 3.2 },
    { id: 'malaysia-mmpo', name: 'Malaysia Palm Oil Board', type: 'export', country: 'Malaysia', avgPriceMultiplier: 1.45, transportPerKm: 2.6 },
];

// ─────────────────────────────────────────────────────────────────────────────

export interface YieldForecastInput {
    crops: Array<{
        name: string;
        quantity: number; // quintals
        landArea: number; // cent or acres
        landUnit: string;
        phase: string;
    }>;
    totalInvestment: number;
    investmentCurrency: string;
    selectedMarketId: string;
    farmerState: string;
    farmerDistrict: string;
}

export interface CropYieldBreakdown {
    cropName: string;
    quantity: number;
    marketPrice: number;       // ₹/quintal
    grossRevenue: number;      // ₹
    transportCost: number;     // ₹ total
    brokerFee: number;         // ₹ (if export)
    netRevenue: number;        // ₹
    roi: number;               // %
}

export interface YieldForecastResult {
    totalGrossRevenue: number;
    totalTransportCost: number;
    totalBrokerFees: number;
    totalNetRevenue: number;
    totalROI: number;
    investmentINR: number;
    cropBreakdown: CropYieldBreakdown[];
    marketName: string;
    marketType: string;
    aiReasoning: string;
    strategy: string;
}

// Rough INR conversion
const CURRENCY_TO_INR: Record<string, number> = {
    INR: 1, USD: 83.5, EUR: 90, GBP: 105, AED: 22.7,
    SGD: 62, MYR: 17.8, GBP_: 105,
};

function toINR(amount: number, currency: string): number {
    const rate = CURRENCY_TO_INR[currency.toUpperCase().trim()] ?? 1;
    return Math.round(amount * rate);
}

function getMSP(cropName: string): number {
    return CROP_MSP[cropName.toLowerCase().trim()] ?? CROP_MSP['default'];
}

// Deterministic pseudo-random (seed-based, same as market service)
function seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }
    return Math.abs(hash % 10000) / 10000;
}

export async function computeYieldForecast(input: YieldForecastInput): Promise<YieldForecastResult> {
    const market = MARKET_CATALOGUE.find(m => m.id === input.selectedMarketId)
        ?? MARKET_CATALOGUE[0];

    const isExport = market.type === 'export';
    // Export broker fee is typically 5–10% of gross
    const BROKER_FEE_RATE = isExport ? 0.07 : 0;

    const investmentINR = toINR(input.totalInvestment, input.investmentCurrency);
    const today = new Date().toISOString().split('T')[0];

    const cropBreakdown: CropYieldBreakdown[] = input.crops.map(crop => {
        const msp = getMSP(crop.name);
        // Market price = MSP × multiplier ± small daily variation
        const variation = (seededRandom(`${crop.name}-${market.id}-${today}`) - 0.5) * 0.06;
        const marketPrice = Math.round(msp * market.avgPriceMultiplier * (1 + variation));

        const grossRevenue = marketPrice * crop.quantity;

        // Transport: estimate avg 200km for local, 600km for export port, then shipping costs factored in via multiplier
        const estimatedKm = isExport ? 600 : 200;
        const transportCost = Math.round(market.transportPerKm * estimatedKm * crop.quantity);

        const brokerFee = Math.round(grossRevenue * BROKER_FEE_RATE);
        const netRevenue = grossRevenue - transportCost - brokerFee;

        return {
            cropName: crop.name,
            quantity: crop.quantity,
            marketPrice,
            grossRevenue,
            transportCost,
            brokerFee,
            netRevenue,
            roi: 0, // calculated after totals
        };
    });

    const totalGross = cropBreakdown.reduce((s, c) => s + c.grossRevenue, 0);
    const totalTransport = cropBreakdown.reduce((s, c) => s + c.transportCost, 0);
    const totalBroker = cropBreakdown.reduce((s, c) => s + c.brokerFee, 0);
    const totalNet = cropBreakdown.reduce((s, c) => s + c.netRevenue, 0);

    // Assign per-crop ROI proportionally
    cropBreakdown.forEach(c => {
        const cropShare = c.netRevenue / (totalNet || 1);
        const cropInvestment = investmentINR * cropShare;
        c.roi = cropInvestment > 0 ? parseFloat(((c.netRevenue - cropInvestment) / cropInvestment * 100).toFixed(1)) : 0;
    });

    const totalROI = investmentINR > 0
        ? parseFloat(((totalNet - investmentINR) / investmentINR * 100).toFixed(1))
        : 0;

    const strategy = isExport ? `Export via ${market.name}` : `Domestic sale at ${market.name}`;

    // Build AI reasoning
    const prompt = `You are AgroIntel's yield advisor. A farmer wants to sell crops via the following strategy:
  
Market: ${market.name} (${isExport ? 'Export' : 'Domestic'}) in ${market.type === 'export' ? (market as any).country ?? 'International' : (market as any).state ?? 'India'}
Crops & Quantities:
${input.crops.map(c => `  - ${c.name}: ${c.quantity} quintals (Stage: ${c.phase}, Area: ${c.landArea} ${c.landUnit})`).join('\n')}
Total Investment: ${input.investmentCurrency} ${input.totalInvestment.toLocaleString()} (≈ ₹${investmentINR.toLocaleString()})
Farmer Location: ${input.farmerDistrict}, ${input.farmerState}

Computed Financials:
Total Gross Revenue: ₹${totalGross.toLocaleString()}
Total Transport Cost: ₹${totalTransport.toLocaleString()} (est. ${isExport ? '600km' : '200km'} @ ₹${market.transportPerKm}/km/quintal)
${isExport ? `Broker/Export Fees (7%): ₹${totalBroker.toLocaleString()}` : ''}
Net Revenue after deductions: ₹${totalNet.toLocaleString()}
Overall ROI: ${totalROI}%

Per-crop breakdown:
${cropBreakdown.map(c => `  ${c.cropName}: ₹${c.marketPrice}/qt × ${c.quantity}qt = ₹${c.grossRevenue.toLocaleString()} gross → ₹${c.netRevenue.toLocaleString()} net`).join('\n')}

Write a clear, concise reasoning (3–5 sentences) explaining:
1. How you arrived at the yield/revenue prediction (MSP, current market multiplier, quantity)
2. Why this market was chosen / key cost drivers (transport, broker fees if applicable)
3. Any risks or tips for the farmer (e.g., crop stage readiness, timing, negotiation)

Be specific with numbers. Use ₹ for rupees. Keep it factual and helpful.`;

    let aiReasoning = '';
    try {
        const chat = await axios.post(
            GROQ_API_URL,
            { model: GROQ_MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.4 },
            { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
        );
        aiReasoning = chat.data?.choices?.[0]?.message?.content?.trim() ?? '';
    } catch {
        aiReasoning = `Revenue is computed using current MSP-anchored market price of ₹${cropBreakdown[0]?.marketPrice ?? 0}/quintal at ${market.name}. Transport estimated at ${isExport ? '600km' : '200km'} × ₹${market.transportPerKm}/km/quintal.${isExport ? ` Export broker fees of 7% (₹${totalBroker.toLocaleString()}) apply.` : ''} Net ROI of ${totalROI}% is based on your stated investment of ₹${investmentINR.toLocaleString()}.`;
    }

    return {
        totalGrossRevenue: totalGross,
        totalTransportCost: totalTransport,
        totalBrokerFees: totalBroker,
        totalNetRevenue: totalNet,
        totalROI,
        investmentINR,
        cropBreakdown,
        marketName: market.name,
        marketType: market.type,
        aiReasoning,
        strategy,
    };
}
