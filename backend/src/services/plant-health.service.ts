import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlantHealthRequest {
    cropName: string;
    phase: string;
    landVolume: number;
    landUnit: string;
    state: string;
    district: string;
    place: string;
    weather: {
        temperature: number;
        humidity: number;
        rain: number;
        maxTemp: number;
        minTemp: number;
        forecast: { date: string; maxTemp: number; minTemp: number; rain: number }[];
    };
}

export interface HealthTip {
    title: string;
    tip: string;
    urgency: 'High' | 'Medium' | 'Low';
    category: 'Watering' | 'Fertilisation' | 'Pest Control' | 'Soil' | 'Harvest' | 'General';
    icon: string; // emoji or icon keyword
}

export interface PlantHealthReport {
    overallStatus: 'Healthy' | 'Needs Attention' | 'Critical';
    statusColor: 'green' | 'orange' | 'red';
    summary: string;
    tips: HealthTip[];
    weatherNote: string;
    nextInspectionDate: string;
    generatedAt: string;
}

// ─── Groq call (reuses same pattern as ai-report.service) ─────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama3-70b-8192'];

async function callGroq(
    messages: { role: string; content: string }[],
    maxTokens = 2000,
    attempt = 0
): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');

    const model = MODELS[Math.min(attempt, MODELS.length - 1)];

    try {
        const res = await axios.post(GROQ_API_URL, {
            model,
            messages,
            temperature: 0.4,
            max_tokens: maxTokens,
        }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 60000,
        });
        return res.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429 && attempt < MODELS.length) {
            const retryAfter = parseInt(err.response?.headers?.['retry-after'] ?? '5', 10);
            await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 10000)));
            return callGroq(messages, maxTokens, attempt + 1);
        }
        throw err;
    }
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildMessages(req: PlantHealthRequest): { role: string; content: string }[] {
    const forecastLines = req.weather.forecast.slice(0, 5).map(f =>
        `${f.date}: max ${f.maxTemp}°C min ${f.minTemp}°C rain ${f.rain}mm`
    ).join(', ');

    const system = `You are AgroIntel — an expert Indian agronomist. Given real-time weather data and crop details, generate practical, targeted plant health tips for the farmer. Tips must be grounded in the actual current weather conditions provided.

Rules:
- Simple language (farmer may have limited education)
- Be very specific — mention actual numbers from the weather data
- Each tip must be actionable and directly related to the crop's current growth phase
- Return ONLY valid JSON — no markdown, no text outside JSON

JSON schema:
{
  "overallStatus": "Healthy | Needs Attention | Critical",
  "statusColor": "green | orange | red",
  "summary": "2 sentences describing the crop health situation right now",
  "tips": [
    {
      "title": "Short title (3-5 words)",
      "tip": "Practical advice in 2-3 simple sentences. Mention actual numbers.",
      "urgency": "High | Medium | Low",
      "category": "Watering | Fertilisation | Pest Control | Soil | Harvest | General",
      "icon": "💧 or 🌿 or 🐛 or 🌱 or 🌾 or ⚠️"
    }
  ],
  "weatherNote": "1 sentence about current weather impact on this crop",
  "nextInspectionDate": "e.g. In 3 days or After the rains clear"
}`;

    const user = `CROP: ${req.cropName} | Phase: ${req.phase} | Area: ${req.landVolume} ${req.landUnit}
LOCATION: ${req.place}, ${req.district}, ${req.state}
CURRENT WEATHER: Temp ${req.weather.temperature}°C | Humidity ${req.weather.humidity}% | Rain today ${req.weather.rain}mm | Max ${req.weather.maxTemp}°C | Min ${req.weather.minTemp}°C
5-DAY FORECAST: ${forecastLines}
DATE: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

Generate 5 targeted health tips for this crop based on the real weather data above. Return JSON only.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generatePlantHealthReport(req: PlantHealthRequest): Promise<PlantHealthReport> {
    const messages = buildMessages(req);
    const raw = await callGroq(messages, 2000);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`AI returned non-JSON: ${raw.slice(0, 200)}`);

    const report: PlantHealthReport = JSON.parse(jsonMatch[0]);
    report.generatedAt = new Date().toISOString();
    return report;
}
