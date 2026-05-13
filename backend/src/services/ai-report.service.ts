import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CropInput {
    name: string;
    phase: string;
    landVolume: number;
    landUnit: string;
    state: string;
    district: string;
    place: string;
}

export interface MarketSnapshotInput {
    cropName: string;
    localPrice: number;
    nationalAvg: number;
    msp: number;
    trend: number;
    profitPotential: string;
}

export interface AIReportRequest {
    crops: CropInput[];
    marketSnapshots: MarketSnapshotInput[];
    farmerState: string;
    farmerDistrict: string;
    currentDate: string;
}

export interface CropVerdict {
    cropName: string;
    action: 'Sell Now' | 'Hold' | 'Process & Sell' | 'Monitor';
    actionColor: 'green' | 'orange' | 'blue' | 'yellow';
    localPrice: number;
    msp: number;
    priceDiffFromMSP: string;
    reasoning: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    bestTimeToSell: string;
}

export interface SwitchCrop {
    name: string;
    why: string;
    expectedReturn: string;
    season: string;
    difficulty: 'Easy' | 'Moderate' | 'Expert';
    msp: string;
    demandTrend: 'Rising' | 'Stable' | 'Declining';
}

export interface AIReport {
    overallVerdict: 'Excellent' | 'Good' | 'Caution' | 'Act Now';
    overallVerdictColor: 'green' | 'blue' | 'orange' | 'red';
    executiveSummary: string;
    cropVerdicts: CropVerdict[];
    topCropsToSwitch: SwitchCrop[];
    globalMarketInsight: string;
    localMarketInsight: string;
    immediateActions: string[];
    keyRisks: string[];
    weatherAdvisory: string;
    generatedAt: string;
    dataSource: string;
}

const CROP_STORAGE_GUIDANCE: Record<string, string> = {
    tomato: 'Highly perishable. Usually should be sold quickly after harvest unless immediate processing or cold-chain storage is available. Long holding is risky.',
    banana: 'Highly perishable. Short selling window after harvest. Holding too long increases spoilage risk.',
    papaya: 'Highly perishable. Should be sold fast once harvest starts. Extended holding is risky.',
    watermelon: 'Perishable. Can hold briefly if handled well, but not for long market timing waits.',
    pineapple: 'Perishable. Moderate short holding may be possible, but long delays are risky.',
    guava: 'Highly perishable. Quick sale is usually safer than extended holding.',
    mango: 'Perishable. Holding window is limited and depends on ripeness; long holds are risky.',
    cucumber: 'Highly perishable. Best sold quickly after harvest.',
    cabbage: 'Moderately perishable. Short holding may be possible, but not long speculative waits.',
    cauliflower: 'Moderately to highly perishable. Long holding is risky.',
    brinjal: 'Highly perishable. Best sold early after harvest.',
    chilli: 'Fresh chilli is perishable; dry chilli can be stored much longer. The advice should depend on whether the crop is fresh or dried.',
    beans: 'Highly perishable. Long holding is risky.',
    carrot: 'Moderately perishable. Short holding may be possible if handled well.',
    pumpkin: 'Relatively durable versus soft vegetables. Moderate holding may be possible.',
    'ladies finger': 'Highly perishable. Sell quickly after harvest.',
    okra: 'Highly perishable. Sell quickly after harvest.',
    capsicum: 'Perishable. Holding window is limited.',
    'green peas': 'Perishable. Short selling window unless cold storage exists.',
    'bitter gourd': 'Perishable. Long holding is risky.',
    drumstick: 'Perishable. Best sold quickly after harvest.',
    beetroot: 'Moderately perishable. Some short holding may be possible.',
    coriander: 'Highly perishable leafy crop. Sell very quickly after harvest.',
    spinach: 'Highly perishable leafy crop. Quick sale is safer than holding.',
    onion: 'Semi-storable. Can be held for some time if cured and stored properly.',
    potato: 'Semi-storable. Holding may be possible for a moderate period if storage is available.',
    garlic: 'Storable. Can usually be held longer than fresh vegetables if properly dried and stored.',
    ginger: 'Moderately storable depending on condition and storage.',
    lemon: 'Moderately perishable. Short-to-moderate holding may be possible.',
    rice: 'Storable grain. Holding for market timing can be reasonable if already harvested and stored safely.',
    wheat: 'Storable grain. Holding can be reasonable if harvested stock is dry and stored safely.',
    maize: 'Storable grain if dried properly. Holding may be reasonable.',
    pepper: 'Dried pepper is storable and can often be held longer; fresh green pepper is more perishable. Assume stored dried pepper unless context says otherwise.',
    cotton: 'Non-perishable compared with fruits and vegetables. Holding may be feasible.',
    sugarcane: 'Not ideal for long post-harvest holding; quality loss can happen after cutting, so avoid long waits.',
    soybean: 'Storable if dried well. Holding may be feasible.',
    groundnut: 'Storable if dried and stored properly.',
    sunflower: 'Storable seed crop if dried properly.',
    mustard: 'Storable seed crop if dried properly.',
    gram: 'Storable pulse if dried properly.',
    tur: 'Storable pulse if dried properly.',
    moong: 'Storable pulse if dried properly.',
    urad: 'Storable pulse if dried properly.',
    jowar: 'Storable grain if dried properly.',
    bajra: 'Storable grain if dried properly.',
    ragi: 'Storable grain if dried properly.',
};

function getCropStorageGuidance(cropName: string): string {
    return CROP_STORAGE_GUIDANCE[cropName.toLowerCase().trim()] ||
        'Estimate whether this crop is perishable, semi-storable, or storable before recommending a long hold window.';
}

// ─── Groq call with retry on 429 ──────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// We use llama-3.3-70b-versatile as it has a large context limit 
const MODELS = ['llama-3.3-70b-versatile'];

async function callGroq(
    messages: { role: string; content: string }[],
    maxTokens = 1500, // Reduced from 3000 to avoid "Request Entity Too Large" errors
    attempt = 0
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');

    const model = MODELS[Math.min(attempt, MODELS.length - 1)];

    try {
        const res = await axios.post(GROQ_API_URL, {
            model,
            messages,
            temperature: 0.35,
            max_tokens: maxTokens,
        }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 90000,
        });
        return res.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
        const status = err?.response?.status;
        // 429 = rate limit → wait then retry with next model
        if (status === 429 && attempt < MODELS.length) {
            const retryAfter = parseInt(err.response?.headers?.['retry-after'] ?? '5', 10);
            const waitMs = Math.min((retryAfter || 5) * 1000, 12000);
            await new Promise(r => setTimeout(r, waitMs));
            return callGroq(messages, maxTokens, attempt + 1);
        }
        throw err;
    }
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildMessages(req: AIReportRequest): { role: string; content: string }[] {
    const cropLines = req.crops.map(c =>
        `${c.name}: ${c.landVolume}${c.landUnit}, phase=${c.phase}, location=${c.district} ${c.state}, storage_guidance=${getCropStorageGuidance(c.name)}`
    ).join(' | ');

    const mktLines = req.marketSnapshots.map(m =>
        `${m.cropName}: local=₹${m.localPrice} natAvg=₹${m.nationalAvg} msp=₹${m.msp} trend=${m.trend > 0 ? '+' : ''}${m.trend}% potential=${m.profitPotential}`
    ).join(' | ');

    const system = `You are AgroIntel AI — an expert Indian agricultural market advisor. Use web search to get CURRENT March 2026 crop price trends in India, global commodity updates, and weather/monsoon outlook. Then generate a precise, farmer-friendly JSON report.

Rules:
- Simple language — farmer may be uneducated
- Keep the tone respectful, calm, and supportive. Never sound harsh, blunt, or dismissive. Avoid phrasing like "prices are low, sell now" without explanation.
- Be specific with numbers & dates
- Use web search for: "India crop prices March 2026", "Indian agriculture market trends 2026", "Rabi harvest 2026 India", "global rice wheat prices 2026"
- You MUST consider the crop phase. If the crop is still growing / vegetative / not yet harvested, do not act like the farmer has ready stock to sell today; give planning-oriented market advice unless the crop context clearly implies ready stock.
- You MUST consider perishability and storage life. Some crops can be held safely for market timing, while some crops rot quickly after harvest.
- If a crop is highly perishable, do NOT automatically recommend selling immediately just because it can rot. First estimate whether the better-price window is very near and realistically reachable.
- For highly perishable crops like tomato or banana, a short hold can still be valid if the likely wait is brief, such as tomorrow or within a few days, and the reasoning should say that the hold window is still safe.
- Only avoid "Hold" when the likely wait is too long for that crop's spoilage risk. In that case prefer "Sell Now" or "Process & Sell".
- If you recommend holding a perishable crop, the reasoning must briefly justify why the hold window is still safe and short enough.
- If rot or spoilage risk is important, explicitly mention it in the reasoning in plain language.
- In reasoning, prefer polite phrasing such as "Even though the current price is soft, this crop is highly perishable, so..." or "Because this crop can spoil quickly, a shorter selling window is safer unless..."
- Return ONLY valid JSON — no markdown fences, no text outside JSON

JSON schema:
{
  "overallVerdict": "Excellent|Good|Caution|Act Now",
  "overallVerdictColor": "green|blue|orange|red",
  "executiveSummary": "2-3 short sentences for farmer",
  "cropVerdicts": [{
    "cropName": "",
    "action": "Sell Now|Hold|Process & Sell|Monitor",
    "actionColor": "green|orange|blue|yellow",
    "localPrice": 0,
    "msp": 0,
    "priceDiffFromMSP": "+X% above MSP",
    "reasoning": "1-2 simple sentences",
    "riskLevel": "Low|Medium|High",
    "bestTimeToSell": "e.g. This week, After Holi, Wait till May"
  }],
  "topCropsToSwitch": [{
    "name": "",
    "why": "1-2 simple sentences why good for this farmer's region",
    "expectedReturn": "₹XX,000–XX,000/acre",
    "season": "Kharif 2026 (Jun–Oct)",
    "difficulty": "Easy|Moderate|Expert",
    "msp": "₹X,XXX/qt",
    "demandTrend": "Rising|Stable|Declining"
  }],
  "globalMarketInsight": "1-2 sentences about global commodity trends affecting Indian farmer",
  "localMarketInsight": "1-2 sentences about Indian/state-level market right now",
  "immediateActions": ["action 1", "action 2", "action 3"],
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "weatherAdvisory": "Short weather/climate note for their region this season",
  "generatedAt": "",
  "dataSource": "Groq AI (LLaMA 3.3 70B)"
}`;

    const user = `FARMER: ${req.farmerDistrict}, ${req.farmerState} | Date: ${req.currentDate}
CROPS: ${cropLines}
MARKET: ${mktLines}

Search the web for current Indian market prices and trends, then generate the JSON report.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateAIReport(req: AIReportRequest): Promise<AIReport> {
    const messages = buildMessages(req);
    const raw = await callGroq(messages, 1500);

    // Strip markdown fences if model wrapped in them
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);

    const report: AIReport = JSON.parse(jsonMatch[0]);
    report.generatedAt = new Date().toISOString();
    if (!report.dataSource || !report.dataSource.includes('Groq')) {
        report.dataSource = 'Groq AI (LLaMA 3.3 70B) + Market Knowledge';
    }
    return report;
}
