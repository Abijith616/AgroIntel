import axios from 'axios';

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

const CROP_RULES: Record<string, { minRain?: number; maxRain?: number; minTemp?: number; maxTemp?: number }> = {
    Rice: { minRain: 2, minTemp: 20 },
    Wheat: { maxRain: 5, minTemp: 10, maxTemp: 30 },
    Corn: { minRain: 1, minTemp: 15 },
    // Default fallback
    Default: {}
};

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
                timeout: 5000 // 5 second timeout
            });
            return response.data as WeatherData;
        } catch (error: any) {
            // Retry logic with exponential backoff
            if (retryCount < maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, etc.
                console.log(`Weather API failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.getLocalWeather(lat, lon, retryCount + 1);
            }

            // After retries exhausted, throw descriptive error
            if (error.code === 'ECONNABORTED') {
                throw new Error('Weather service timeout - please try again later');
            } else if (error.response) {
                throw new Error(`Weather API error: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Unable to reach weather service - check your internet connection');
            } else {
                throw new Error(`Weather service error: ${error.message}`);
            }
        }
    }

    static getVerdict(cropName: string, weather: WeatherData): CropVerdict {
        const rules = CROP_RULES[cropName] || CROP_RULES['Default'];
        const currentRain = weather.current.rain;
        const currentTemp = weather.current.temperature_2m;

        if (rules.minRain !== undefined && currentRain < rules.minRain) {
            return { status: 'Risk', reason: `Low rainfall (${currentRain}mm). ${cropName} generally needs more water.` };
        }
        if (rules.maxRain !== undefined && currentRain > rules.maxRain) {
            return { status: 'Risk', reason: `High rainfall (${currentRain}mm). ${cropName} might suffer from excess water.` };
        }
        if (rules.minTemp !== undefined && currentTemp < rules.minTemp) {
            return { status: 'Risk', reason: `Temperature too low (${currentTemp}°C).` };
        }
        if (rules.maxTemp !== undefined && currentTemp > rules.maxTemp) {
            return { status: 'Risk', reason: `Temperature too high (${currentTemp}°C).` };
        }

        return { status: 'Favorable', reason: `Conditions are good for ${cropName}.` };
    }

    static async getGlobalInsights() {
        // Hardcoded major regions
        const regions = [
            { name: 'Vietnam', crop: 'Rice', lat: 14.05, lon: 108.27 },
            { name: 'USA (Iowa)', crop: 'Corn', lat: 41.87, lon: -93.62 },
            { name: 'Ukraine', crop: 'Wheat', lat: 48.37, lon: 31.16 }
        ];

        const results = await Promise.all(regions.map(async (region) => {
            try {
                const weather = await this.getLocalWeather(region.lat, region.lon);
                // Simple logic: If it's raining heavily in Vietnam, maybe Rice harvesting is delayed -> Opportunity?
                // Or if it's too dry -> Drought -> Scarcity.

                // Let's assume scarcity if "High Risk" due to extreme weather
                const verdict = this.getVerdict(region.crop, weather);
                let marketSignal = 'Stable';

                if (verdict.status === 'Risk') {
                    marketSignal = `Potential Scarcity in ${region.name} due to adverse weather. Opportunity for export.`;
                }

                return {
                    region: region.name,
                    crop: region.crop,
                    weatherSummary: `${weather.current.temperature_2m}°C, ${weather.current.rain}mm rain`,
                    marketSignal
                };
            } catch (e) {
                return { region: region.name, error: "Failed to fetch data" };
            }
        }));

        return results;
    }
}
