import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloudSun, Droplets, Wind, TrendingUp, AlertTriangle, Globe, ArrowLeft, Calendar, WifiOff, Leaf, ThumbsUp, ThumbsDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Simple coordinate mapping (same as Dashboard)
const LOCATION_COORDS: Record<string, { lat: number; lon: number }> = {
    'Kerala': { lat: 9.9312, lon: 76.2673 },
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
};

// ── Crop profiles — unique thresholds per crop type ──────────────────────────
interface CropProfile {
    idealTempMin: number;   // °C — below this is cold stress
    idealTempMax: number;   // °C — above this is heat stress
    weeklyWaterNeed: number; // mm/week — minimum rain needed without irrigation
    floodThreshold: number;  // mm/week — above this causes waterlogging risk
    droughtSensitive: boolean; // true = crop suffers fast without water
    heatTolerant: boolean;   // true = can handle higher temps
    waterloggingTolerant: boolean; // rice loves water; tomato hates it
}

const CROP_PROFILES: Record<string, CropProfile> = {
    // Water-hungry, heat-tolerant, waterlogging-tolerant
    Rice: { idealTempMin: 20, idealTempMax: 35, weeklyWaterNeed: 30, floodThreshold: 140, droughtSensitive: true, heatTolerant: true, waterloggingTolerant: true },
    Paddy: { idealTempMin: 20, idealTempMax: 35, weeklyWaterNeed: 30, floodThreshold: 140, droughtSensitive: true, heatTolerant: true, waterloggingTolerant: true },
    Sugarcane: { idealTempMin: 20, idealTempMax: 38, weeklyWaterNeed: 25, floodThreshold: 120, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    // Moderate water, moderate heat tolerance
    Wheat: { idealTempMin: 12, idealTempMax: 30, weeklyWaterNeed: 15, floodThreshold: 70, droughtSensitive: false, heatTolerant: false, waterloggingTolerant: false },
    Maize: { idealTempMin: 18, idealTempMax: 32, weeklyWaterNeed: 18, floodThreshold: 80, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    Corn: { idealTempMin: 18, idealTempMax: 32, weeklyWaterNeed: 18, floodThreshold: 80, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    Soybean: { idealTempMin: 20, idealTempMax: 30, weeklyWaterNeed: 15, floodThreshold: 65, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    // Low water, heat-tolerant crops
    Cotton: { idealTempMin: 20, idealTempMax: 38, weeklyWaterNeed: 12, floodThreshold: 60, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    Sorghum: { idealTempMin: 22, idealTempMax: 40, weeklyWaterNeed: 10, floodThreshold: 60, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    Millet: { idealTempMin: 22, idealTempMax: 40, weeklyWaterNeed: 8, floodThreshold: 50, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    Groundnut: { idealTempMin: 20, idealTempMax: 35, weeklyWaterNeed: 12, floodThreshold: 55, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    // Vegetables — heat-sensitive, need regular moderate water
    Tomato: { idealTempMin: 18, idealTempMax: 32, weeklyWaterNeed: 14, floodThreshold: 50, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    Potato: { idealTempMin: 10, idealTempMax: 24, weeklyWaterNeed: 16, floodThreshold: 55, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    Onion: { idealTempMin: 13, idealTempMax: 28, weeklyWaterNeed: 10, floodThreshold: 45, droughtSensitive: false, heatTolerant: false, waterloggingTolerant: false },
    Chilli: { idealTempMin: 18, idealTempMax: 33, weeklyWaterNeed: 12, floodThreshold: 50, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    Brinjal: { idealTempMin: 20, idealTempMax: 33, weeklyWaterNeed: 13, floodThreshold: 50, droughtSensitive: true, heatTolerant: false, waterloggingTolerant: false },
    // Fruits / perennials
    Banana: { idealTempMin: 20, idealTempMax: 35, weeklyWaterNeed: 20, floodThreshold: 90, droughtSensitive: true, heatTolerant: true, waterloggingTolerant: false },
    Mango: { idealTempMin: 20, idealTempMax: 40, weeklyWaterNeed: 8, floodThreshold: 60, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    Coconut: { idealTempMin: 22, idealTempMax: 36, weeklyWaterNeed: 18, floodThreshold: 100, droughtSensitive: false, heatTolerant: true, waterloggingTolerant: false },
    // Pulses
    Lentil: { idealTempMin: 15, idealTempMax: 28, weeklyWaterNeed: 8, floodThreshold: 45, droughtSensitive: false, heatTolerant: false, waterloggingTolerant: false },
    Chickpea: { idealTempMin: 15, idealTempMax: 30, weeklyWaterNeed: 7, floodThreshold: 45, droughtSensitive: false, heatTolerant: false, waterloggingTolerant: false },
    // Default fallback
    Default: { idealTempMin: 18, idealTempMax: 34, weeklyWaterNeed: 12, floodThreshold: 70, droughtSensitive: false, heatTolerant: false, waterloggingTolerant: false },
};

function getCropProfile(cropName: string): CropProfile {
    // Case-insensitive match
    const key = Object.keys(CROP_PROFILES).find(
        k => k.toLowerCase() === cropName.trim().toLowerCase()
    );
    return CROP_PROFILES[key ?? 'Default'];
}

interface DayPrediction {
    level: 'good' | 'caution' | 'poor';
    title: string;
    summary: string;
    bullets: string[];
}

function get7DayPrediction(
    cropName: string,
    maxTemps: number[],
    minTemps: number[],
    rainSums: number[]
): DayPrediction {
    const profile = getCropProfile(cropName);

    const totalRain = rainSums.reduce((s, v) => s + v, 0);
    const avgMax = maxTemps.reduce((s, v) => s + v, 0) / maxTemps.length;
    const avgMin = minTemps.reduce((s, v) => s + v, 0) / minTemps.length;
    void avgMin; // used in bullet copy via avgMax proxy
    const rainyDays = rainSums.filter(r => r >= 1).length;
    const dryDays = rainSums.filter(r => r < 0.5).length;
    const extremeHeatDays = maxTemps.filter(t => t > profile.idealTempMax).length;
    const coldDays = maxTemps.filter(t => t < profile.idealTempMin).length;

    const bullets: string[] = [];

    // Rainfall vs crop need
    if (totalRain > profile.floodThreshold) {
        bullets.push(`Very heavy rainfall (${totalRain.toFixed(0)} mm) — exceeds ${cropName}'s waterlogging limit of ${profile.floodThreshold} mm/week.`);
    } else if (totalRain >= profile.weeklyWaterNeed) {
        bullets.push(`Rainfall (${totalRain.toFixed(0)} mm) meets ${cropName}'s weekly water need of ~${profile.weeklyWaterNeed} mm.`);
    } else if (totalRain > 0) {
        bullets.push(`Low rainfall (${totalRain.toFixed(0)} mm) — ${cropName} needs ~${profile.weeklyWaterNeed} mm/week; supplement with irrigation.`);
    } else {
        bullets.push(`No rain expected — ${cropName} needs ~${profile.weeklyWaterNeed} mm/week; irrigation is essential.`);
    }

    // Temperature vs ideal range
    bullets.push(`Avg daytime high: ${avgMax.toFixed(1)}°C (ideal for ${cropName}: ${profile.idealTempMin}–${profile.idealTempMax}°C).`);

    if (extremeHeatDays > 0) {
        bullets.push(`${extremeHeatDays} day(s) above ${cropName}'s heat limit (${profile.idealTempMax}°C) — ${profile.heatTolerant ? 'manageable, but monitor closely' : 'high stress risk, consider shade nets'}.`);
    }
    if (coldDays > 0) {
        bullets.push(`${coldDays} day(s) below ${cropName}'s cold threshold (${profile.idealTempMin}°C) — protect seedlings from cold stress.`);
    }
    if (rainyDays >= 5) bullets.push('Most days will be wet — delay pesticide or fertiliser application.');
    if (dryDays >= 5 && totalRain < profile.weeklyWaterNeed) bullets.push('Mostly dry — ideal for field operations, harvesting, and post-harvest work.');

    // ── Verdict logic using crop-specific thresholds ──────────────────────────
    let level: DayPrediction['level'];
    let title: string;
    let summary: string;

    const isFloodRisk = totalRain > profile.floodThreshold && !profile.waterloggingTolerant;
    const isHeavyRain = totalRain > profile.floodThreshold && profile.waterloggingTolerant;
    const isHeatRisk = avgMax > profile.idealTempMax + 2 || extremeHeatDays >= 3;
    const isColdRisk = avgMax < profile.idealTempMin + 2 || coldDays >= 3;
    const isDrought = totalRain < profile.weeklyWaterNeed * 0.3 && dryDays >= 5 && profile.droughtSensitive;
    const isRainOk = totalRain >= profile.weeklyWaterNeed && totalRain <= profile.floodThreshold;
    const isTempOk = avgMax >= profile.idealTempMin && avgMax <= profile.idealTempMax;

    if (isFloodRisk) {
        level = 'poor';
        title = `Flood risk — dangerous for ${cropName}`;
        summary = `Predicted ${totalRain.toFixed(0)} mm exceeds what ${cropName} can safely handle. Waterlogging and root damage are likely — check drainage urgently.`;
    } else if (isHeatRisk && isDrought) {
        level = 'poor';
        title = 'Hot & dry — double stress on your crop';
        summary = `Both heat and drought conditions are expected this week. ${cropName} is highly vulnerable — irrigate immediately and consider afternoon shading.`;
    } else if (isColdRisk) {
        level = 'poor';
        title = `Cold stress risk for ${cropName}`;
        summary = `Temperatures are dropping below ${cropName}'s comfort zone. Cover young plants and delay any transplanting this week.`;
    } else if (isDrought) {
        level = 'caution';
        title = 'Dry spell ahead — irrigation critical';
        summary = `Rainfall will fall far short of ${cropName}'s needs (~${profile.weeklyWaterNeed} mm/week). Manual irrigation is essential to prevent moisture stress.`;
    } else if (isHeatRisk) {
        level = 'caution';
        title = `Warm week — watch ${cropName} closely`;
        summary = `Temperatures will push above ${cropName}'s ideal range. Water more frequently and monitor for leaf wilt or tip burn.`;
    } else if (isHeavyRain) {
        level = 'caution';
        title = 'Heavy rain — manageable for this crop';
        summary = `High rainfall expected. ${cropName} can tolerate wet conditions, but monitor for fungal disease and standing water.`;
    } else if (isRainOk && isTempOk) {
        level = 'good';
        title = `Favourable week ahead for ${cropName}`;
        summary = `Both temperature (avg ${avgMax.toFixed(1)}°C) and rainfall (${totalRain.toFixed(0)} mm) are within ${cropName}'s ideal range. Routine monitoring should suffice.`;
    } else {
        level = 'caution';
        title = 'Mixed conditions — stay watchful';
        summary = `Some conditions this week are slightly outside ${cropName}'s ideal range. Monitor soil moisture and crop health daily.`;
    }

    return { level, title, summary, bullets };
}


interface Crop {
    id: number;
    name: string;
    state: string;
    district?: string;
    place?: string;
}

interface LocalWeather {
    weather: {
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
    };
    verdict: {
        status: 'Favorable' | 'Risk' | 'Neutral';
        reason: string;
    };
    location: {
        lat: number;
        lon: number;
    };
    metadata?: {
        dataSource: 'real' | 'unavailable';
        fetchedAt: string;
    };
}

interface MarketOpportunity {
    region: string;
    country: string;
    type: 'domestic' | 'international';
    crop: string;
    stressType: 'Flood' | 'Drought' | 'Heat' | 'Cold' | 'Stable';
    severity: 'Severe' | 'Moderate' | 'None';
    weatherSummary: string;
    totalRain: number;
    avgMaxTemp: number;
    opportunityInsight: string;
    error: string | null;
}

interface MarketOpportunityData {
    opportunities: MarketOpportunity[];
    stableRegions: MarketOpportunity[];
    metadata?: {
        crop: string;
        regionsChecked: number;
        stressedCount: number;
        fetchedAt: string;
    };
}

export default function WeatherPage() {
    const navigate = useNavigate();

    const [crops, setCrops] = useState<Crop[]>([]);
    const [selectedCropId, setSelectedCropId] = useState<number | ''>('');

    const [localData, setLocalData] = useState<LocalWeather | null>(null);
    const [marketData, setMarketData] = useState<MarketOpportunityData | null>(null);
    const [loading, setLoading] = useState(false);
    const [cropsLoading, setCropsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fetched, setFetched] = useState(false);

    // Load user's crops on mount
    useEffect(() => {
        const loadCrops = async () => {
            setCropsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3000/api/crops', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data: Crop[] = await res.json();
                    setCrops(data);
                }
            } catch {
                // silent
            } finally {
                setCropsLoading(false);
            }
        };
        loadCrops();
    }, []);

    const selectedCrop = crops.find(c => c.id === selectedCropId) ?? null;

    const handleFetch = async () => {
        if (!selectedCrop) return;

        const coords = LOCATION_COORDS[selectedCrop.state] || { lat: 9.9312, lon: 76.2673 };
        const { lat, lon } = coords;
        const cropName = selectedCrop.name;

        setLoading(true);
        setError(null);
        setLocalData(null);
        setMarketData(null);
        setFetched(false);

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [localRes, marketRes] = await Promise.all([
                fetch(`http://localhost:3000/api/weather/local?lat=${lat}&lon=${lon}&crop=${encodeURIComponent(cropName)}`, { headers }),
                fetch(`http://localhost:3000/api/weather/market-opportunities?crop=${encodeURIComponent(cropName)}&state=${encodeURIComponent(selectedCrop.state)}`, { headers }),
            ]);

            if (localRes.ok) {
                setLocalData(await localRes.json());
            } else {
                const errorData = await localRes.json();
                setError(errorData.message || 'Failed to fetch local weather');
            }

            if (marketRes.ok) {
                setMarketData(await marketRes.json());
            }
        } catch (err: any) {
            setError(err.message || 'Network error — please check your connection');
        } finally {
            setLoading(false);
            setFetched(true);
        }
    };

    const formatNumber = (num: number) => (num ? num.toFixed(1) : '0');

    const coords = selectedCrop
        ? (LOCATION_COORDS[selectedCrop.state] || { lat: 9.9312, lon: 76.2673 })
        : null;

    return (
        <div className="min-h-screen bg-muted/30 p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div
                            className="flex items-center gap-2 text-muted-foreground mb-2 cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Weather &amp; Market Insights</h1>
                        <p className="text-muted-foreground">
                            Select a crop below to fetch its personalised weather forecast.
                        </p>
                    </div>
                </div>

                {/* Crop Selector Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Leaf className="h-5 w-5 text-green-600" />
                            Select Crop for Analysis
                        </CardTitle>
                        <CardDescription>
                            Choose one of your registered crops, then click &ldquo;Fetch Weather Analysis&rdquo;.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <label htmlFor="crop-select" className="text-sm font-medium text-foreground">
                                    Your Crops
                                </label>
                                {cropsLoading ? (
                                    <div className="h-10 bg-muted animate-pulse rounded-md w-full" />
                                ) : crops.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">
                                        No crops found.{' '}
                                        <span
                                            className="text-primary underline cursor-pointer"
                                            onClick={() => navigate('/add-crop')}
                                        >
                                            Add a crop
                                        </span>{' '}
                                        to get started.
                                    </p>
                                ) : (
                                    <select
                                        id="crop-select"
                                        value={selectedCropId}
                                        onChange={e =>
                                            setSelectedCropId(e.target.value === '' ? '' : Number(e.target.value))
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="">— Select a crop —</option>
                                        {crops.map(crop => (
                                            <option key={crop.id} value={crop.id}>
                                                {crop.name} — {crop.state}
                                                {crop.district ? `, ${crop.district}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <Button
                                id="fetch-weather-btn"
                                onClick={handleFetch}
                                disabled={!selectedCrop || loading}
                                className="h-10 px-6 shrink-0"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Fetching…
                                    </span>
                                ) : (
                                    'Fetch Weather Analysis'
                                )}
                            </Button>
                        </div>

                        {selectedCrop && coords && (
                            <p className="text-xs text-muted-foreground mt-3">
                                Location resolved:{' '}
                                <span className="font-medium">
                                    {selectedCrop.state} ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)})
                                </span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        <div className="h-64 bg-slate-200 rounded-xl" />
                        <div className="h-64 bg-slate-200 rounded-xl" />
                        <div className="h-64 bg-slate-200 rounded-xl" />
                    </div>
                )}

                {/* Results */}
                {!loading && fetched && (
                    <>
                        {/* Sub-header showing which crop was fetched */}
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-sm">Showing analysis for</span>
                            <Badge variant="outline" className="text-sm font-semibold">
                                {selectedCrop?.name}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                                at {coords?.lat.toFixed(2)}, {coords?.lon.toFixed(2)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                id="refresh-weather-btn"
                                onClick={handleFetch}
                                className="ml-auto"
                            >
                                Refresh Data
                            </Button>
                        </div>

                        <Tabs defaultValue="local" className="space-y-8">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="local">Local Forecast</TabsTrigger>
                                <TabsTrigger value="global">Global Market</TabsTrigger>
                            </TabsList>

                            <TabsContent value="local" className="space-y-6">
                                {error && (
                                    <Card className="border-orange-200 bg-orange-50">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <WifiOff className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
                                                <div>
                                                    <h3 className="font-semibold text-orange-900 mb-1">
                                                        Weather Data Unavailable
                                                    </h3>
                                                    <p className="text-sm text-orange-800">{error}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3"
                                                        onClick={handleFetch}
                                                    >
                                                        Try Again
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {localData && localData.metadata?.dataSource === 'unavailable' && (
                                    <Card className="border-orange-200 bg-orange-50">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <WifiOff className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
                                                <div>
                                                    <h3 className="font-semibold text-orange-900 mb-1">
                                                        Weather Data Unavailable
                                                    </h3>
                                                    <p className="text-sm text-orange-800">
                                                        Unable to fetch real-time weather data. Please try again later.
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {localData && localData.metadata?.dataSource === 'real' && (
                                    <>
                                        {/* Verdict Hero */}
                                        <Card
                                            className={`border-0 shadow-md overflow-hidden relative ${localData.verdict.status === 'Favorable'
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                                                }`}
                                        >
                                            <CardContent className="p-8 md:p-12 relative z-10">
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                                        {localData.verdict.status === 'Favorable' ? (
                                                            <TrendingUp className="h-10 w-10 text-white" />
                                                        ) : (
                                                            <AlertTriangle className="h-10 w-10 text-white" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h2 className="text-3xl font-bold">
                                                            Verdict: {localData.verdict.status}
                                                        </h2>
                                                        <p className="text-lg opacity-90 font-medium max-w-2xl leading-relaxed">
                                                            {localData.verdict.reason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CloudSun className="absolute right-[-20px] top-[-20px] h-64 w-64 text-white/5 rotate-12" />
                                        </Card>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <CloudSun className="h-4 w-4 text-orange-500" /> Temperature
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-4xl font-bold">
                                                        {formatNumber(localData.weather.current.temperature_2m)}°C
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">Real-time feel</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <Droplets className="h-4 w-4 text-blue-500" /> Rainfall (Today)
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-4xl font-bold text-blue-600">
                                                        {formatNumber(localData.weather.current.rain)} mm
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Precipitation volume
                                                    </p>
                                                </CardContent>
                                            </Card>
                                            <Card className="hover:shadow-md transition-shadow">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                        <Wind className="h-4 w-4 text-slate-500" /> Humidity
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-4xl font-bold text-slate-700">
                                                        {formatNumber(localData.weather.current.relative_humidity_2m)}%
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">Relative humidity</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* 7-Day Forecast */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5" /> 7-Day Forecast
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                                    {localData.weather.daily.time.map((date, i) => (
                                                        <div
                                                            key={date}
                                                            className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border"
                                                        >
                                                            <span className="text-sm font-medium mb-2">
                                                                {new Date(date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </span>
                                                            <div className="flex items-baseline gap-1 my-2">
                                                                <span className="text-2xl font-bold">
                                                                    {Math.round(localData.weather.daily.temperature_2m_max[i])}°
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    / {Math.round(localData.weather.daily.temperature_2m_min[i])}°
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                                <Droplets className="h-3 w-3" />
                                                                {localData.weather.daily.rain_sum[i].toFixed(1)}mm
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* ══ PREDICTION ON UPCOMING 7 DAYS ══ */}
                                        {(() => {
                                            const pred = get7DayPrediction(
                                                selectedCrop?.name ?? 'your crop',
                                                localData.weather.daily.temperature_2m_max,
                                                localData.weather.daily.temperature_2m_min,
                                                localData.weather.daily.rain_sum
                                            );

                                            const totalRain = localData.weather.daily.rain_sum.reduce((s, v) => s + v, 0);
                                            const avgMax = localData.weather.daily.temperature_2m_max.reduce((s, v) => s + v, 0) / 7;
                                            const rainyDays = localData.weather.daily.rain_sum.filter(r => r >= 1).length;
                                            const dryDays = localData.weather.daily.rain_sum.filter(r => r < 0.5).length;

                                            const themes = {
                                                good: {
                                                    gradient: 'from-emerald-800 via-emerald-700 to-teal-600',
                                                    glow: 'shadow-emerald-900/60',
                                                    iconRing: 'bg-emerald-500/30 ring-4 ring-emerald-400/20',
                                                    iconColor: 'text-emerald-200',
                                                    label: '✓ LOOKS GOOD',
                                                    labelBg: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
                                                    chipBg: 'bg-white/10 border border-white/20 text-white',
                                                    panelBg: 'bg-white/10 border border-white/15',
                                                    dot: 'bg-emerald-300',
                                                    accent: 'text-emerald-300',
                                                    decorator: 'text-emerald-400/10',
                                                },
                                                caution: {
                                                    gradient: 'from-amber-800 via-orange-700 to-yellow-600',
                                                    glow: 'shadow-amber-900/60',
                                                    iconRing: 'bg-amber-500/30 ring-4 ring-amber-400/20',
                                                    iconColor: 'text-amber-200',
                                                    label: '⚠ CAUTION ADVISED',
                                                    labelBg: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
                                                    chipBg: 'bg-white/10 border border-white/20 text-white',
                                                    panelBg: 'bg-white/10 border border-white/15',
                                                    dot: 'bg-amber-300',
                                                    accent: 'text-amber-300',
                                                    decorator: 'text-amber-400/10',
                                                },
                                                poor: {
                                                    gradient: 'from-red-900 via-rose-800 to-red-700',
                                                    glow: 'shadow-red-900/70',
                                                    iconRing: 'bg-red-500/30 ring-4 ring-red-400/20',
                                                    iconColor: 'text-red-200',
                                                    label: '✗ UNFAVOURABLE',
                                                    labelBg: 'bg-red-400/20 text-red-200 border border-red-400/30',
                                                    chipBg: 'bg-white/10 border border-white/20 text-white',
                                                    panelBg: 'bg-white/10 border border-white/15',
                                                    dot: 'bg-red-300',
                                                    accent: 'text-red-300',
                                                    decorator: 'text-red-400/10',
                                                },
                                            };
                                            const t = themes[pred.level as 'good' | 'caution' | 'poor'];
                                            const Icon = pred.level === 'good' ? ThumbsUp : pred.level === 'poor' ? ThumbsDown : AlertTriangle;

                                            return (
                                                <div
                                                    id="prediction-card"
                                                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} shadow-2xl ${t.glow} p-8 md:p-10`}
                                                >
                                                    {/* Decorative background blobs */}
                                                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
                                                    <div className="pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full bg-black/20 blur-2xl" />
                                                    <CloudSun className={`pointer-events-none absolute -right-10 -bottom-6 h-72 w-72 ${t.decorator} rotate-12`} />

                                                    {/* Label pill */}
                                                    <div className="relative flex items-center gap-3 mb-6">
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full ${t.labelBg}`}>
                                                            {t.label}
                                                        </span>
                                                        <span className="text-xs text-white/50 uppercase tracking-widest font-medium">
                                                            Prediction on Upcoming 7 Days
                                                        </span>
                                                    </div>

                                                    {/* Main content row */}
                                                    <div className="relative flex flex-col md:flex-row gap-8 items-start">

                                                        {/* Icon */}
                                                        <div className={`shrink-0 h-20 w-20 rounded-2xl flex items-center justify-center ${t.iconRing}`}>
                                                            <Icon className={`h-10 w-10 ${t.iconColor}`} />
                                                        </div>

                                                        {/* Text block */}
                                                        <div className="flex-1 space-y-3">
                                                            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
                                                                {pred.title}
                                                            </h2>
                                                            <p className="text-base text-white/80 leading-relaxed max-w-2xl">
                                                                {pred.summary}
                                                            </p>

                                                            {/* Stat chips */}
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl ${t.chipBg}`}>
                                                                    <Droplets className="h-4 w-4 opacity-70" />
                                                                    {totalRain.toFixed(1)} mm total rain
                                                                </span>
                                                                <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl ${t.chipBg}`}>
                                                                    <CloudSun className="h-4 w-4 opacity-70" />
                                                                    Avg {avgMax.toFixed(1)}°C high
                                                                </span>
                                                                <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl ${t.chipBg}`}>
                                                                    <Calendar className="h-4 w-4 opacity-70" />
                                                                    {rainyDays} rainy · {dryDays} dry days
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Insights panel */}
                                                    <div className={`relative mt-8 rounded-xl overflow-hidden ${t.panelBg} backdrop-blur-sm`}>
                                                        {/* Section header */}
                                                        <div className={`px-5 py-3 border-b border-white/10 flex items-center gap-2`}>
                                                            <span className={`h-1.5 w-5 rounded-full ${t.dot}`} />
                                                            <p className={`text-sm font-extrabold uppercase tracking-[0.2em] ${t.accent}`}>Key Insights</p>
                                                        </div>
                                                        {/* Insight rows */}
                                                        <ul className="divide-y divide-white/10">
                                                            {pred.bullets.map((b: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-4 px-5 py-4">
                                                                    {/* Number badge */}
                                                                    <span className={`shrink-0 mt-0.5 h-6 w-6 rounded-md flex items-center justify-center text-xs font-black ${t.dot} bg-opacity-30 text-white`}
                                                                        style={{ background: 'rgba(255,255,255,0.15)' }}>
                                                                        {i + 1}
                                                                    </span>
                                                                    <span className="text-base text-white/95 leading-relaxed font-medium">{b}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="global" className="space-y-6">
                                {/* Header banner */}
                                <div className="rounded-xl bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-6 flex flex-col md:flex-row md:items-center gap-4 shadow-lg">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold tracking-widest uppercase text-indigo-300 mb-1">Market Intelligence</p>
                                        <h2 className="text-2xl font-extrabold leading-tight">
                                            Export &amp; Trade Opportunities for {selectedCrop?.name}
                                        </h2>
                                        <p className="text-indigo-200 text-sm mt-1">
                                            Regions where bad weather is hurting {selectedCrop?.name} production — your chance to sell at premium prices.
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex gap-3">
                                        <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                                            <p className="text-2xl font-black">{marketData?.opportunities?.length ?? 0}</p>
                                            <p className="text-xs text-indigo-200">Opportunities</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                                            <p className="text-2xl font-black">{marketData?.metadata?.regionsChecked ?? 0}</p>
                                            <p className="text-xs text-indigo-200">Regions Scanned</p>
                                        </div>
                                    </div>
                                </div>

                                {/* No opportunities found */}
                                {marketData && marketData.opportunities.length === 0 && (
                                    <Card className="border-green-200 bg-green-50">
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <ThumbsUp className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-bold text-green-900">All regions are stable this week</h3>
                                                <p className="text-sm text-green-800 mt-1">
                                                    No major weather disruptions detected in {selectedCrop?.name}-producing regions. Prices are likely stable — hold stock and monitor.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Opportunity cards — stressed regions */}
                                {(marketData?.opportunities?.length ?? 0) > 0 && (
                                    <div>
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                            Active Opportunities — Weather-Hit Regions
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {marketData!.opportunities.map((opp, i) => {
                                                // Per-stress full pastel card themes
                                                const stressTheme = {
                                                    Flood: {
                                                        cardBg: 'bg-blue-50 border border-blue-200',
                                                        headerBg: 'bg-blue-100 border-b border-blue-200',
                                                        shadow: 'shadow-md shadow-blue-200/50',
                                                        emoji: '🌊',
                                                        emojiLabel: 'FLOODING',
                                                        labelColor: 'text-blue-700',
                                                        regionColor: 'text-blue-950',
                                                        metaColor: 'text-blue-500',
                                                        chipBg: 'bg-white border-blue-200 text-blue-700',
                                                        divider: 'border-blue-200',
                                                        summaryBg: 'bg-blue-100/60 text-blue-800',
                                                        severeBadge: 'bg-red-100 text-red-600 border-red-200',
                                                        modBadge: 'bg-blue-200 text-blue-700 border-blue-300',
                                                        oppBg: 'bg-emerald-50 border-t border-emerald-100',
                                                        oppLabel: 'text-emerald-700',
                                                        oppText: 'text-emerald-950',
                                                    },
                                                    Drought: {
                                                        cardBg: 'bg-amber-50 border border-amber-200',
                                                        headerBg: 'bg-amber-100 border-b border-amber-200',
                                                        shadow: 'shadow-md shadow-amber-200/50',
                                                        emoji: '☀️',
                                                        emojiLabel: 'DROUGHT',
                                                        labelColor: 'text-amber-700',
                                                        regionColor: 'text-amber-950',
                                                        metaColor: 'text-amber-500',
                                                        chipBg: 'bg-white border-amber-200 text-amber-700',
                                                        divider: 'border-amber-200',
                                                        summaryBg: 'bg-amber-100/60 text-amber-900',
                                                        severeBadge: 'bg-red-100 text-red-700 border-red-200',
                                                        modBadge: 'bg-amber-200 text-amber-800 border-amber-300',
                                                        oppBg: 'bg-emerald-50 border-t border-emerald-100',
                                                        oppLabel: 'text-emerald-700',
                                                        oppText: 'text-emerald-950',
                                                    },
                                                    Heat: {
                                                        cardBg: 'bg-rose-50 border border-rose-200',
                                                        headerBg: 'bg-rose-100 border-b border-rose-200',
                                                        shadow: 'shadow-md shadow-rose-200/50',
                                                        emoji: '🔥',
                                                        emojiLabel: 'HEAT STRESS',
                                                        labelColor: 'text-rose-700',
                                                        regionColor: 'text-rose-950',
                                                        metaColor: 'text-rose-400',
                                                        chipBg: 'bg-white border-rose-200 text-rose-700',
                                                        divider: 'border-rose-200',
                                                        summaryBg: 'bg-rose-100/60 text-rose-900',
                                                        severeBadge: 'bg-red-100 text-red-600 border-red-200',
                                                        modBadge: 'bg-rose-200 text-rose-700 border-rose-300',
                                                        oppBg: 'bg-emerald-50 border-t border-emerald-100',
                                                        oppLabel: 'text-emerald-700',
                                                        oppText: 'text-emerald-950',
                                                    },
                                                    Cold: {
                                                        cardBg: 'bg-sky-50 border border-sky-200',
                                                        headerBg: 'bg-sky-100 border-b border-sky-200',
                                                        shadow: 'shadow-md shadow-sky-200/50',
                                                        emoji: '❄️',
                                                        emojiLabel: 'COLD STRESS',
                                                        labelColor: 'text-sky-700',
                                                        regionColor: 'text-sky-950',
                                                        metaColor: 'text-sky-400',
                                                        chipBg: 'bg-white border-sky-200 text-sky-700',
                                                        divider: 'border-sky-200',
                                                        summaryBg: 'bg-sky-100/60 text-sky-900',
                                                        severeBadge: 'bg-red-100 text-red-600 border-red-200',
                                                        modBadge: 'bg-sky-200 text-sky-700 border-sky-300',
                                                        oppBg: 'bg-emerald-50 border-t border-emerald-100',
                                                        oppLabel: 'text-emerald-700',
                                                        oppText: 'text-emerald-950',
                                                    },
                                                    Stable: {
                                                        cardBg: 'bg-slate-50 border border-slate-200',
                                                        headerBg: 'bg-slate-100 border-b border-slate-200',
                                                        shadow: 'shadow-md shadow-slate-200/50',
                                                        emoji: '✅',
                                                        emojiLabel: 'STABLE',
                                                        labelColor: 'text-slate-600',
                                                        regionColor: 'text-slate-900',
                                                        metaColor: 'text-slate-400',
                                                        chipBg: 'bg-white border-slate-200 text-slate-600',
                                                        divider: 'border-slate-200',
                                                        summaryBg: 'bg-slate-100/60 text-slate-700',
                                                        severeBadge: 'bg-slate-200 text-slate-600 border-slate-300',
                                                        modBadge: 'bg-slate-200 text-slate-600 border-slate-300',
                                                        oppBg: 'bg-emerald-50 border-t border-emerald-100',
                                                        oppLabel: 'text-emerald-700',
                                                        oppText: 'text-emerald-950',
                                                    },
                                                };
                                                const th = stressTheme[opp.stressType] ?? stressTheme.Stable;
                                                const severityBadge = opp.severity === 'Severe' ? th.severeBadge : th.modBadge;
                                                const severityLabel = opp.severity === 'Severe' ? '⚠ Severe' : '● Moderate';

                                                return (
                                                    <div
                                                        key={i}
                                                        onClick={() => navigate('/export-opportunities', {
                                                            state: {
                                                                weatherOpportunities: marketData!.opportunities,
                                                                stableRegions: marketData!.stableRegions,
                                                                crop: selectedCrop?.name ?? '',
                                                            }
                                                        })}
                                                        className={`overflow-hidden rounded-2xl ${th.cardBg} ${th.shadow} flex flex-col cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all duration-200`}
                                                    >
                                                        {/* Header strip — slightly deeper tint */}
                                                        <div className={`${th.headerBg} px-5 py-3.5 flex items-center justify-between`}>
                                                            <span className={`text-sm font-black tracking-[0.15em] uppercase ${th.labelColor}`}>
                                                                {th.emoji} {th.emojiLabel}
                                                            </span>
                                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${severityBadge}`}>
                                                                {severityLabel}
                                                            </span>
                                                        </div>


                                                        {/* Card body */}
                                                        <div className="p-5 pb-4 flex-1">
                                                            {/* Region name */}
                                                            <h3 className={`text-2xl font-extrabold leading-tight mb-1 ${th.regionColor}`}>
                                                                {opp.region}
                                                            </h3>
                                                            <p className={`text-sm font-medium mb-4 ${th.metaColor}`}>
                                                                {opp.type === 'domestic' ? '🇮🇳 India' : `🌐 ${opp.country}`}
                                                                {' · '}Major {opp.crop} producer
                                                            </p>

                                                            {/* Stat chips */}
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border ${th.chipBg}`}>
                                                                    <Droplets className="h-4 w-4" />
                                                                    {opp.totalRain.toFixed(0)} mm / week
                                                                </span>
                                                                <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border ${th.chipBg}`}>
                                                                    <CloudSun className="h-4 w-4" />
                                                                    {opp.avgMaxTemp.toFixed(1)}°C avg high
                                                                </span>
                                                            </div>

                                                            {/* Weather summary */}
                                                            <p className={`text-sm rounded-lg px-3 py-2.5 leading-relaxed ${th.summaryBg}`}>
                                                                {opp.weatherSummary}
                                                            </p>
                                                        </div>

                                                        {/* Opportunity strip */}
                                                        <div className={`p-5 ${th.oppBg}`}>
                                                            <p className={`text-xs font-black uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5 ${th.oppLabel}`}>
                                                                <TrendingUp className="h-3.5 w-3.5" /> Your Opportunity
                                                            </p>
                                                            <p className={`text-sm leading-relaxed ${th.oppText}`}>
                                                                {opp.opportunityInsight}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}




                                {/* Stable regions — context */}
                                {(marketData?.stableRegions?.length ?? 0) > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                                            <Wind className="h-4 w-4" /> Stable Markets (for context)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {marketData!.stableRegions.map((sr, i) => (
                                                <Card key={i} className="border-l-4 border-l-slate-300 bg-muted/20">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="h-4 w-4 text-slate-400" />
                                                            <span className="font-semibold">{sr.region}</span>
                                                            <Badge variant="outline" className="text-xs ml-auto">
                                                                {sr.type === 'domestic' ? '🇮🇳 India' : `🌐 ${sr.country}`}
                                                            </Badge>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-xs text-muted-foreground">{sr.weatherSummary}</p>
                                                        <p className="text-sm text-slate-600 mt-2">{sr.opportunityInsight}</p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Not yet loaded */}
                                {!marketData && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                        <Globe className="h-14 w-14 opacity-20" />
                                        <p className="text-base font-medium">Market data loading…</p>
                                        <p className="text-sm">Scanning {selectedCrop?.name}-producing regions worldwide.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}

                {/* Empty / prompt state — nothing fetched yet */}
                {!loading && !fetched && (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
                        <CloudSun className="h-16 w-16 opacity-20" />
                        <p className="text-lg font-medium">No data yet</p>
                        <p className="text-sm">
                            Select a crop from the dropdown above and click{' '}
                            <span className="font-semibold text-foreground">Fetch Weather Analysis</span>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
