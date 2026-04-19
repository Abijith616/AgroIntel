import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherData {
    current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        rain: number;
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        rain_sum: number[];
    };
}

interface CropVerdict {
    status: 'Favorable' | 'Risk' | 'Neutral';
    reason: string;
}

// ─── Static crop rules (used for local verdict) ───────────────────────────────

const CROP_RULES: Record<string, { minRain?: number; maxRain?: number; minTemp?: number; maxTemp?: number }> = {
    Rice: { minRain: 2, minTemp: 20 },
    Wheat: { maxRain: 5, minTemp: 10, maxTemp: 30 },
    Corn: { minRain: 1, minTemp: 15 },
    Tomato: { minRain: 1, maxRain: 8, minTemp: 18, maxTemp: 32 },
    Default: {}
};

// ─── Region × crop map ────────────────────────────────────────────────────────
// Each entry: a region that is a major producer of that crop.
// We include both Indian inter-state opportunities AND global ones.

interface Region {
    name: string;
    country: string;
    crop: string;
    lat: number;
    lon: number;
    type: 'domestic' | 'international';
}

const REGIONS: Region[] = [
    // ── Rice ──────────────────────────────────────────────────────────────────
    { name: 'West Bengal', country: 'India', crop: 'Rice', lat: 22.98, lon: 87.85, type: 'domestic' },
    { name: 'Andhra Pradesh', country: 'India', crop: 'Rice', lat: 15.91, lon: 79.74, type: 'domestic' },
    { name: 'Uttar Pradesh', country: 'India', crop: 'Rice', lat: 26.85, lon: 80.91, type: 'domestic' },
    { name: 'Punjab', country: 'India', crop: 'Rice', lat: 31.15, lon: 75.34, type: 'domestic' },
    { name: 'Kerala', country: 'India', crop: 'Rice', lat: 9.93, lon: 76.27, type: 'domestic' },
    { name: 'Vietnam', country: 'Vietnam', crop: 'Rice', lat: 14.05, lon: 108.27, type: 'international' },
    { name: 'Thailand', country: 'Thailand', crop: 'Rice', lat: 13.76, lon: 100.50, type: 'international' },
    { name: 'Bangladesh', country: 'Bangladesh', crop: 'Rice', lat: 23.68, lon: 90.36, type: 'international' },

    // ── Wheat ─────────────────────────────────────────────────────────────────
    { name: 'Haryana', country: 'India', crop: 'Wheat', lat: 29.06, lon: 76.09, type: 'domestic' },
    { name: 'Madhya Pradesh', country: 'India', crop: 'Wheat', lat: 22.97, lon: 78.66, type: 'domestic' },
    { name: 'Rajasthan', country: 'India', crop: 'Wheat', lat: 27.02, lon: 74.22, type: 'domestic' },
    { name: 'Ukraine', country: 'Ukraine', crop: 'Wheat', lat: 48.37, lon: 31.16, type: 'international' },
    { name: 'Russia', country: 'Russia', crop: 'Wheat', lat: 55.75, lon: 37.62, type: 'international' },
    { name: 'Australia', country: 'Australia', crop: 'Wheat', lat: -25.27, lon: 133.77, type: 'international' },

    // ── Maize / Corn ──────────────────────────────────────────────────────────
    { name: 'Karnataka', country: 'India', crop: 'Maize', lat: 15.31, lon: 75.71, type: 'domestic' },
    { name: 'Bihar', country: 'India', crop: 'Maize', lat: 25.09, lon: 85.31, type: 'domestic' },
    { name: 'USA (Iowa)', country: 'USA', crop: 'Maize', lat: 41.87, lon: -93.62, type: 'international' },
    { name: 'Brazil', country: 'Brazil', crop: 'Maize', lat: -14.24, lon: -51.93, type: 'international' },

    // ── Sugarcane ────────────────────────────────────────────────────────────
    { name: 'Maharashtra', country: 'India', crop: 'Sugarcane', lat: 19.75, lon: 75.71, type: 'domestic' },
    { name: 'Tamil Nadu', country: 'India', crop: 'Sugarcane', lat: 11.13, lon: 78.66, type: 'domestic' },
    { name: 'Brazil', country: 'Brazil', crop: 'Sugarcane', lat: -14.24, lon: -51.93, type: 'international' },

    // ── Cotton ───────────────────────────────────────────────────────────────
    { name: 'Gujarat', country: 'India', crop: 'Cotton', lat: 22.26, lon: 71.19, type: 'domestic' },
    { name: 'Telangana', country: 'India', crop: 'Cotton', lat: 18.11, lon: 79.02, type: 'domestic' },
    { name: 'USA (Texas)', country: 'USA', crop: 'Cotton', lat: 31.97, lon: -99.90, type: 'international' },

    // ── Tomato ───────────────────────────────────────────────────────────────
    { name: 'Himachal Pradesh', country: 'India', crop: 'Tomato', lat: 31.10, lon: 77.17, type: 'domestic' },
    { name: 'Madhya Pradesh', country: 'India', crop: 'Tomato', lat: 22.97, lon: 78.66, type: 'domestic' },
    { name: 'China', country: 'China', crop: 'Tomato', lat: 35.86, lon: 104.20, type: 'international' },
    { name: 'Italy', country: 'Italy', crop: 'Tomato', lat: 41.87, lon: 12.57, type: 'international' },

    // ── Potato ───────────────────────────────────────────────────────────────
    { name: 'Uttar Pradesh', country: 'India', crop: 'Potato', lat: 26.85, lon: 80.91, type: 'domestic' },
    { name: 'West Bengal', country: 'India', crop: 'Potato', lat: 22.98, lon: 87.85, type: 'domestic' },
    { name: 'Poland', country: 'Poland', crop: 'Potato', lat: 51.92, lon: 19.14, type: 'international' },

    // ── Soybean ──────────────────────────────────────────────────────────────
    { name: 'Madhya Pradesh', country: 'India', crop: 'Soybean', lat: 22.97, lon: 78.66, type: 'domestic' },
    { name: 'Brazil', country: 'Brazil', crop: 'Soybean', lat: -14.24, lon: -51.93, type: 'international' },
    { name: 'USA (Illinois)', country: 'USA', crop: 'Soybean', lat: 40.63, lon: -89.40, type: 'international' },

    // ── Banana ───────────────────────────────────────────────────────────────
    { name: 'Tamil Nadu', country: 'India', crop: 'Banana', lat: 11.13, lon: 78.66, type: 'domestic' },
    { name: 'Andhra Pradesh', country: 'India', crop: 'Banana', lat: 15.91, lon: 79.74, type: 'domestic' },
    { name: 'Philippines', country: 'Philippines', crop: 'Banana', lat: 12.88, lon: 121.77, type: 'international' },

    // ── Onion ────────────────────────────────────────────────────────────────
    { name: 'Maharashtra', country: 'India', crop: 'Onion', lat: 19.75, lon: 75.71, type: 'domestic' },
    { name: 'Rajasthan', country: 'India', crop: 'Onion', lat: 27.02, lon: 74.22, type: 'domestic' },
    { name: 'China', country: 'China', crop: 'Onion', lat: 35.86, lon: 104.20, type: 'international' },

    // ── Groundnut ────────────────────────────────────────────────────────────
    { name: 'Gujarat', country: 'India', crop: 'Groundnut', lat: 22.26, lon: 71.19, type: 'domestic' },
    { name: 'Andhra Pradesh', country: 'India', crop: 'Groundnut', lat: 15.91, lon: 79.74, type: 'domestic' },

    // ── Mango ────────────────────────────────────────────────────────────────
    { name: 'Uttar Pradesh', country: 'India', crop: 'Mango', lat: 26.85, lon: 80.91, type: 'domestic' },
    { name: 'Andhra Pradesh', country: 'India', crop: 'Mango', lat: 15.91, lon: 79.74, type: 'domestic' },
    { name: 'Mexico', country: 'Mexico', crop: 'Mango', lat: 23.63, lon: -102.55, type: 'international' },
];

// ─── Stress analyser ──────────────────────────────────────────────────────────

export interface RegionStress {
    type: 'Flood' | 'Drought' | 'Heat' | 'Cold' | 'Stable';
    severity: 'Severe' | 'Moderate' | 'None';
    description: string; // eg "135mm rain in 7 days"
    totalRain: number;
    avgMaxTemp: number;
}

function analyseStress(weather: WeatherData): RegionStress {
    const totalRain = weather.daily.rain_sum.reduce((s, v) => s + v, 0);
    const avgMax = weather.daily.temperature_2m_max.reduce((s, v) => s + v, 0) / weather.daily.temperature_2m_max.length;
    const avgMin = weather.daily.temperature_2m_min.reduce((s, v) => s + v, 0) / weather.daily.temperature_2m_min.length;
    const currentTemp = weather.current.temperature_2m;

    if (totalRain > 150) {
        return { type: 'Flood', severity: 'Severe', description: `${totalRain.toFixed(0)} mm rain in 7 days — severe flooding risk`, totalRain, avgMaxTemp: avgMax };
    }
    if (totalRain > 80) {
        return { type: 'Flood', severity: 'Moderate', description: `${totalRain.toFixed(0)} mm rain in 7 days — waterlogging likely`, totalRain, avgMaxTemp: avgMax };
    }
    if (totalRain < 2 && avgMax > 38) {
        return { type: 'Heat', severity: 'Severe', description: `${totalRain.toFixed(1)} mm rain, avg high ${avgMax.toFixed(1)}°C — extreme heat + drought`, totalRain, avgMaxTemp: avgMax };
    }
    if (avgMax > 40) {
        return { type: 'Heat', severity: 'Severe', description: `Avg high ${avgMax.toFixed(1)}°C — extreme heat stress on crops`, totalRain, avgMaxTemp: avgMax };
    }
    if (avgMax > 36) {
        return { type: 'Heat', severity: 'Moderate', description: `Avg high ${avgMax.toFixed(1)}°C — above-normal heat`, totalRain, avgMaxTemp: avgMax };
    }
    if (avgMin < 2 || currentTemp < 5) {
        return { type: 'Cold', severity: 'Severe', description: `Avg low ${avgMin.toFixed(1)}°C — severe frost risk for crops`, totalRain, avgMaxTemp: avgMax };
    }
    if (avgMin < 8) {
        return { type: 'Cold', severity: 'Moderate', description: `Avg low ${avgMin.toFixed(1)}°C — cold stress possible`, totalRain, avgMaxTemp: avgMax };
    }
    if (totalRain < 3) {
        return { type: 'Drought', severity: 'Moderate', description: `Only ${totalRain.toFixed(1)} mm rain in 7 days — dry spell`, totalRain, avgMaxTemp: avgMax };
    }
    return { type: 'Stable', severity: 'None', description: `${totalRain.toFixed(0)} mm rain, avg ${avgMax.toFixed(1)}°C — normal conditions`, totalRain, avgMaxTemp: avgMax };
}

// ─── Groq opportunity insight generator ───────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS = ['llama-3.3-70b-versatile', 'llama3-70b-8192'];

async function callGroq(messages: { role: string; content: string }[], maxTokens = 300, attempt = 0): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');

    const model = MODELS[Math.min(attempt, MODELS.length - 1)];
    try {
        const res = await axios.post(GROQ_API_URL, { model, messages, temperature: 0.3, max_tokens: maxTokens }, {
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 30000,
        });
        return res.data?.choices?.[0]?.message?.content ?? '';
    } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429 && attempt < MODELS.length) {
            const retryAfter = parseInt(err.response?.headers?.['retry-after'] ?? '5', 10);
            await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 8000)));
            return callGroq(messages, maxTokens, attempt + 1);
        }
        throw err;
    }
}

async function generateOpportunityInsight(
    farmerCrop: string,
    farmerState: string,
    region: Region,
    stress: RegionStress
): Promise<string> {
    const isInternational = region.type === 'international';
    const context = isInternational
        ? `${region.name} (${region.country}) is a major global producer of ${farmerCrop}.`
        : `${region.name} is a major ${farmerCrop}-producing state in India — close to the farmer in ${farmerState}.`;

    const prompt = `You are AgroIntel, an agricultural market intelligence assistant for Indian farmers.

SITUATION: ${context}
WEATHER STRESS DETECTED: ${stress.type} (${stress.severity}) — ${stress.description}
FARMER'S CROP: ${farmerCrop} in ${farmerState}

Write exactly 2 sentences (max 60 words total). First sentence: explain the supply impact on ${farmerCrop} due to this weather. Second sentence: give a specific, actionable market opportunity for a farmer holding ${farmerCrop} stock in ${farmerState}. Be direct, practical, and use plain English. Do not use bullet points or formatting.`;

    const raw = await callGroq([
        { role: 'system', content: 'You are a terse agricultural market analyst. Write only the 2 requested sentences. No preamble.' },
        { role: 'user', content: prompt }
    ], 120);

    return raw.trim() || `${stress.type} conditions in ${region.name} are disrupting ${farmerCrop} supply. Consider approaching buyers in ${region.name} or intermediaries who source from stressed regions.`;
}

// ─── Main weather service class ───────────────────────────────────────────────

export class WeatherService {
    private static BASE_URL = 'https://api.open-meteo.com/v1/forecast';

    static async getLocalWeather(lat: number, lon: number, retryCount = 0): Promise<WeatherData> {
        const maxRetries = 1;
        try {
            const response = await axios.get(this.BASE_URL, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,relative_humidity_2m,rain',
                    daily: 'temperature_2m_max,temperature_2m_min,rain_sum',
                    timezone: 'auto'
                },
                timeout: 8000
            });
            return response.data as WeatherData;
        } catch (error: any) {
            if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                return this.getLocalWeather(lat, lon, retryCount + 1);
            }
            if (error.code === 'ECONNABORTED') throw new Error('Weather service timeout - please try again later');
            if (error.response) throw new Error(`Weather API error: ${error.response.status}`);
            throw new Error('Unable to reach weather service');
        }
    }

    static getVerdict(cropName: string, weather: WeatherData): CropVerdict {
        const rules = CROP_RULES[cropName] || CROP_RULES['Default'];
        const currentRain = weather.current.rain;
        const currentTemp = weather.current.temperature_2m;

        if (rules.minRain !== undefined && currentRain < rules.minRain)
            return { status: 'Risk', reason: `Low rainfall (${currentRain}mm). ${cropName} generally needs more water.` };
        if (rules.maxRain !== undefined && currentRain > rules.maxRain)
            return { status: 'Risk', reason: `High rainfall (${currentRain}mm). ${cropName} might suffer from excess water.` };
        if (rules.minTemp !== undefined && currentTemp < rules.minTemp)
            return { status: 'Risk', reason: `Temperature too low (${currentTemp}°C).` };
        if (rules.maxTemp !== undefined && currentTemp > rules.maxTemp)
            return { status: 'Risk', reason: `Temperature too high (${currentTemp}°C).` };
        return { status: 'Favorable', reason: `Conditions are good for ${cropName}.` };
    }

    /**
     * New smart global market opportunity finder.
     * - Filters regions by the farmer's actual crop
     * - Fetches real 7-day weather for each
     * - Only returns regions with actual weather stress (flood/drought/heat/cold)
     * - Generates AI opportunity insights for stressed regions
     * - Always returns at least 1 Stable region for context
     */
    static async getMarketOpportunities(farmerCrop: string, farmerState: string) {
        // Normalise crop name (case-insensitive match)
        const normCrop = farmerCrop.trim();

        // Find all regions that grow this crop
        const candidateRegions = REGIONS.filter(r =>
            r.crop.toLowerCase() === normCrop.toLowerCase()
        );

        if (candidateRegions.length === 0) {
            return { opportunities: [], stableRegions: [], metadata: { crop: normCrop, fetchedAt: new Date().toISOString() } };
        }

        // Fetch weather for all candidate regions concurrently
        const regionResults = await Promise.all(candidateRegions.map(async (region) => {
            try {
                const weather = await this.getLocalWeather(region.lat, region.lon);
                const stress = analyseStress(weather);
                return { region, weather, stress, error: null };
            } catch (e: any) {
                return { region, weather: null, stress: null, error: e.message };
            }
        }));

        // Separate stressed regions from stable ones
        const stressedResults = regionResults.filter(r => r.stress && r.stress.type !== 'Stable' && r.stress.severity !== 'None');
        const stableResults = regionResults.filter(r => r.stress && r.stress.type === 'Stable');

        // Generate AI insights for stressed regions (limit to top 5 to avoid rate limits)
        const topStressed = stressedResults.slice(0, 5);
        const opportunities = await Promise.all(topStressed.map(async (r) => {
            let insight = '';
            try {
                insight = await generateOpportunityInsight(normCrop, farmerState, r.region, r.stress!);
            } catch {
                insight = `${r.stress!.type} conditions in ${r.region.name} may reduce ${normCrop} supply — monitor prices and approach buyers early.`;
            }
            return {
                region: r.region.name,
                country: r.region.country,
                type: r.region.type,
                crop: r.region.crop,
                stressType: r.stress!.type,
                severity: r.stress!.severity,
                weatherSummary: r.stress!.description,
                totalRain: r.stress!.totalRain,
                avgMaxTemp: r.stress!.avgMaxTemp,
                opportunityInsight: insight,
                error: null,
            };
        }));

        // Include up to 2 stable regions for context
        const stableContext = stableResults.slice(0, 2).map(r => ({
            region: r.region.name,
            country: r.region.country,
            type: r.region.type,
            crop: r.region.crop,
            stressType: r.stress!.type,
            severity: r.stress!.severity,
            weatherSummary: r.stress!.description,
            totalRain: r.stress!.totalRain,
            avgMaxTemp: r.stress!.avgMaxTemp,
            opportunityInsight: `Conditions in ${r.region.name} are normal — stable supply expected. No pricing pressure from this region this week.`,
            error: null,
        }));

        return {
            opportunities,
            stableRegions: stableContext,
            metadata: {
                crop: normCrop,
                regionsChecked: candidateRegions.length,
                stressedCount: stressedResults.length,
                fetchedAt: new Date().toISOString(),
            }
        };
    }

    // ── Legacy global insights (kept for backward compat) ──────────────────────
    static async getGlobalInsights() {
        const regions = [
            { name: 'Vietnam', crop: 'Rice', lat: 14.05, lon: 108.27 },
            { name: 'USA (Iowa)', crop: 'Corn', lat: 41.87, lon: -93.62 },
            { name: 'Ukraine', crop: 'Wheat', lat: 48.37, lon: 31.16 }
        ];
        const results = await Promise.all(regions.map(async (region) => {
            try {
                const weather = await this.getLocalWeather(region.lat, region.lon);
                const verdict = this.getVerdict(region.crop, weather);
                const stress = analyseStress(weather);
                let marketSignal = stress.type !== 'Stable'
                    ? `${stress.type} conditions in ${region.name} (${stress.description}) — potential supply disruption.`
                    : 'Stable conditions — normal supply expected.';
                return {
                    region: region.name,
                    crop: region.crop,
                    weatherSummary: `${weather.current.temperature_2m}°C, ${weather.current.rain}mm rain`,
                    marketSignal,
                    verdict: verdict.status,
                };
            } catch (e) {
                return { region: region.name, error: 'Failed to fetch data' };
            }
        }));
        return results;
    }
}
