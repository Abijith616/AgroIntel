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
        `${c.name}: ${c.landVolume}${c.landUnit}, ${c.phase}, ${c.district} ${c.state}`
    ).join(' | ');

    const mktLines = req.marketSnapshots.map(m =>
        `${m.cropName}: local=₹${m.localPrice} natAvg=₹${m.nationalAvg} msp=₹${m.msp} trend=${m.trend > 0 ? '+' : ''}${m.trend}% potential=${m.profitPotential}`
    ).join(' | ');

    const system = `You are AgroIntel AI — an expert Indian agricultural market advisor. Use web search to get CURRENT March 2026 crop price trends in India, global commodity updates, and weather/monsoon outlook. Then generate a precise, farmer-friendly JSON report.

Rules:
- Simple language — farmer may be uneducated
- Be specific with numbers & dates
- Use web search for: "India crop prices March 2026", "Indian agriculture market trends 2026", "Rabi harvest 2026 India", "global rice wheat prices 2026"
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
