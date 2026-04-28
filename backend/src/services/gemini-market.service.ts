import axios from 'axios';

export interface GeminiMarketCandidate {
    name: string;
    marketType: 'vegetable' | 'wholesale' | 'apmc' | 'marketplace' | 'other';
    address?: string | null;
    district?: string | null;
    state?: string | null;
    approximateLat: number;
    approximateLon: number;
    phone?: string | null;
    website?: string | null;
    email?: string | null;
    sourceUrls: string[];
    confidence: 'high' | 'medium' | 'low';
    notes?: string | null;
}

interface GeminiMarketResponse {
    best_guess_local_market_name?: string;
    reasoning?: string;
    markets?: GeminiMarketCandidate[];
}

const geminiCache: Record<string, { timestamp: number; data: GeminiMarketCandidate[] }> = {};
const GEMINI_CACHE_TTL = 24 * 60 * 60 * 1000;

const normalizeMarketType = (value: string): GeminiMarketCandidate['marketType'] => {
    if (value === 'vegetable' || value === 'wholesale' || value === 'apmc' || value === 'marketplace') {
        return value;
    }
    return 'other';
};

const normalizeConfidence = (value: string): GeminiMarketCandidate['confidence'] => {
    if (value === 'high' || value === 'medium') {
        return value;
    }
    return 'low';
};

const stripJsonFence = (raw: string): string => {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? match[0] : raw;
};

export class GeminiMarketService {
    static async findNearbyMarkets(params: {
        cropName: string;
        lat: number;
        lon: number;
        state: string;
        district?: string;
        place?: string;
    }): Promise<GeminiMarketCandidate[]> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return [];
        }

        const cacheKey = [
            params.cropName.toLowerCase(),
            params.lat.toFixed(3),
            params.lon.toFixed(3),
            (params.state || '').toLowerCase(),
            (params.district || '').toLowerCase(),
            (params.place || '').toLowerCase()
        ].join(':');

        const cached = geminiCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < GEMINI_CACHE_TTL) {
            return cached.data;
        }

        const prompt = `You are assisting an agricultural market intelligence engine for India.

Goal:
Find real nearby physical markets for a farmer selling ${params.cropName}.

Field coordinates:
- latitude: ${params.lat}
- longitude: ${params.lon}
- place context: ${params.place || 'unknown place'}, ${params.district || 'unknown district'}, ${params.state}

Rules:
- Focus on vegetable markets, wholesale produce markets, APMC or mandi-style markets, marketplaces, and produce trading points.
- Return only markets that are plausibly near these coordinates.
- Include only entries with coordinates.
- If a phone, website, or email is unknown, use null.
- Do not invent contact details.
- If uncertain, keep the market but mark confidence low.
- Return at most 12 markets.
- Return only valid JSON.

JSON schema:
{
  "best_guess_local_market_name": "",
  "reasoning": "",
  "markets": [
    {
      "name": "",
      "marketType": "vegetable|wholesale|apmc|marketplace|other",
      "address": null,
      "district": null,
      "state": null,
      "approximateLat": 0,
      "approximateLon": 0,
      "phone": null,
      "website": null,
      "email": null,
      "sourceUrls": [],
      "confidence": "high|medium|low",
      "notes": null
    }
  ]
}`;

        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        responseMimeType: 'application/json'
                    }
                },
                {
                    timeout: 30000
                }
            );

            const rawText =
                response.data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
            const parsed = JSON.parse(stripJsonFence(rawText)) as GeminiMarketResponse;

            const markets = (parsed.markets || [])
                .map((market) => ({
                    ...market,
                    marketType: normalizeMarketType(market.marketType),
                    confidence: normalizeConfidence(market.confidence),
                    sourceUrls: Array.isArray(market.sourceUrls) ? market.sourceUrls.filter(Boolean) : [],
                }))
                .filter((market) =>
                    market.name &&
                    Number.isFinite(market.approximateLat) &&
                    Number.isFinite(market.approximateLon) &&
                    market.approximateLat >= -90 &&
                    market.approximateLat <= 90 &&
                    market.approximateLon >= -180 &&
                    market.approximateLon <= 180
                );

            geminiCache[cacheKey] = { timestamp: Date.now(), data: markets };
            return markets;
        } catch (error) {
            console.error('[Gemini] Nearby market enrichment failed:', (error as any)?.message || error);
            return [];
        }
    }
}
