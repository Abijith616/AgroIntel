import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloudSun, Droplets, Wind, TrendingUp, AlertTriangle, Globe, ArrowLeft, Calendar, WifiOff } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';

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

interface GlobalInsight {
    region: string;
    crop: string;
    weatherSummary: string;
    marketSignal: string;
    error?: string;
}

interface GlobalInsightsResponse {
    insights: GlobalInsight[];
    metadata?: {
        dataSource: 'real' | 'partial' | 'unavailable';
        fetchedAt: string;
        successCount?: number;
        totalCount?: number;
    };
}

export default function WeatherPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    // Get params from URL or defaults
    const lat = parseFloat(searchParams.get('lat') || '9.9312');
    const lon = parseFloat(searchParams.get('lon') || '76.2673');
    const cropName = searchParams.get('crop') || 'Rice';

    const [localData, setLocalData] = useState<LocalWeather | null>(null);
    const [globalData, setGlobalData] = useState<GlobalInsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [localRes, globalRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/weather/local?lat=${lat}&lon=${lon}&crop=${cropName}`, { headers }),
                    fetch(`http://localhost:3000/api/weather/global`, { headers })
                ]);

                if (localRes.ok) {
                    setLocalData(await localRes.json());
                } else {
                    const errorData = await localRes.json();
                    setError(errorData.message || 'Failed to fetch local weather');
                }

                if (globalRes.ok) {
                    setGlobalData(await globalRes.json());
                }
            } catch (error: any) {
                console.error("Failed to fetch weather data", error);
                setError(error.message || 'Network error - please check your connection');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lat, lon, cropName]);

    const formatNumber = (num: number) => num ? num.toFixed(1) : '0';

    return (
        <div className="min-h-screen bg-muted/30 p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2 cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Weather & Market Insights</h1>
                        <p className="text-muted-foreground">
                            Real-time analysis for <Badge variant="outline" className="text-base font-normal">{cropName}</Badge> at {lat.toFixed(2)}, {lon.toFixed(2)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.reload()}>Refresh Data</Button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        <div className="h-64 bg-slate-200 rounded-xl"></div>
                        <div className="h-64 bg-slate-200 rounded-xl"></div>
                        <div className="h-64 bg-slate-200 rounded-xl"></div>
                    </div>
                ) : (
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
                                                <h3 className="font-semibold text-orange-900 mb-1">Weather Data Unavailable</h3>
                                                <p className="text-sm text-orange-800">{error}</p>
                                                <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
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
                                                <h3 className="font-semibold text-orange-900 mb-1">Weather Data Unavailable</h3>
                                                <p className="text-sm text-orange-800">Unable to fetch real-time weather data. Please try again later.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {localData && localData.metadata?.dataSource === 'real' && (
                                <>
                                    {/* Verdict Section - Hero */}
                                    <Card className={`border-0 shadow-md overflow-hidden relative ${localData.verdict.status === 'Favorable' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'}`}>
                                        <CardContent className="p-8 md:p-12 relative z-10">
                                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                                    {localData.verdict.status === 'Favorable' ? <TrendingUp className="h-10 w-10 text-white" /> : <AlertTriangle className="h-10 w-10 text-white" />}
                                                </div>
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold">Verdict: {localData.verdict.status}</h2>
                                                    <p className="text-lg opacity-90 font-medium max-w-2xl leading-relaxed">
                                                        {localData.verdict.reason}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        {/* Decorative background elements */}
                                        <CloudSun className="absolute right-[-20px] top-[-20px] h-64 w-64 text-white/5 rotate-12" />
                                    </Card>

                                    {/* Current Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <CloudSun className="h-4 w-4 text-orange-500" /> Temperature
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-bold">{formatNumber(localData.weather.current.temperature_2m)}°C</div>
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
                                                <div className="text-4xl font-bold text-blue-600">{formatNumber(localData.weather.current.rain)} mm</div>
                                                <p className="text-xs text-muted-foreground mt-1">Precipitation volume</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                    <Wind className="h-4 w-4 text-slate-500" /> Humidity
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-4xl font-bold text-slate-700">{formatNumber(localData.weather.current.relative_humidity_2m)}%</div>
                                                <p className="text-xs text-muted-foreground mt-1">Relative humidity</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* 7 Day Forecast */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> 7-Day Forecast</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                                {localData.weather.daily.time.map((date, i) => (
                                                    <div key={date} className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border">
                                                        <span className="text-sm font-medium mb-2">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        <div className="flex items-baseline gap-1 my-2">
                                                            <span className="text-2xl font-bold">{Math.round(localData.weather.daily.temperature_2m_max[i])}°</span>
                                                            <span className="text-sm text-muted-foreground">/ {Math.round(localData.weather.daily.temperature_2m_min[i])}°</span>
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
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="global" className="space-y-6">
                            {globalData?.metadata?.dataSource === 'partial' && (
                                <Card className="border-yellow-200 bg-yellow-50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-sm text-yellow-800">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Some regions failed to load ({globalData.metadata.successCount}/{globalData.metadata.totalCount} available)</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {globalData?.insights?.filter(item => !item.error).map((item, i) => (
                                    <Card key={i} className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-5 w-5 text-indigo-500" />
                                                    {item.region}
                                                </div>
                                                <Badge variant="secondary">{item.crop}</Badge>
                                            </CardTitle>
                                            <CardDescription>Major Production Region</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="p-3 bg-muted rounded-md text-sm">
                                                <span className="font-semibold block mb-1">Current Conditions:</span>
                                                {item.weatherSummary}
                                            </div>
                                            <div className={`p-4 rounded-md text-sm font-medium flex items-start gap-3 ${item.marketSignal.includes('Scarcity') || item.marketSignal.includes('Opportunity') ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {item.marketSignal.includes('Scarcity') ? <TrendingUp className="h-5 w-5 shrink-0" /> : <Wind className="h-5 w-5 shrink-0" />}
                                                {item.marketSignal}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
