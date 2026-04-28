import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, BarChart3, Leaf, Loader2,
    RefreshCw, MapPin, Brain, Sparkles,
    ArrowRight, Wifi, WifiOff, Truck, Clock3, Store, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketIntelligenceChart } from "@/components/MarketIntelligenceChart";

interface UserCrop {
    name: string;
    state: string;
    district: string;
    place: string;
    latitude?: number | null;
    longitude?: number | null;
}

interface TrendPoint {
    date: string;
    localPrice: number | null;
    nationalAvg: number | null;
    msp: number;
}

interface TrendResponse {
    source: "real" | "simulated";
    trend: TrendPoint[];
}

interface MarketEntry {
    name: string;
    district: string;
    state: string;
    distance: number;
    price: number;
    trend: number;
    profitPotential: "High" | "Medium" | "Low";
    priceSource: "agmarknet" | "estimated" | "osm_estimated";
}

interface MarketPricesResponse {
    nearestMarket: MarketEntry;
    alternativeMarkets: MarketEntry[];
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const getSignalTone = (source: TrendResponse["source"], momentum: number) => {
    if (Math.abs(momentum) >= 2) {
        return { label: "Strong Signal", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    if (Math.abs(momentum) >= 0.8) {
        return { label: "Moderate Signal", tone: "text-amber-700 bg-amber-50 border-amber-200" };
    }
    return { label: "Weak Signal", tone: "text-slate-700 bg-slate-50 border-slate-200" };
};

const getSourceLabel = (source: MarketEntry["priceSource"]) => {
    return "Live";
};

export default function MarketIntelligence() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as { crop?: string; state?: string; district?: string } | null;

    const [crops, setCrops] = useState<UserCrop[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<UserCrop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pathwaysLoading, setPathwaysLoading] = useState(false);
    const [priceData, setPriceData] = useState<MarketPricesResponse | null>(null);
    const [trendData, setTrendData] = useState<TrendResponse | null>(null);

    useEffect(() => {
        const fetchCrops = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) { navigate("/login"); return; }
                const res = await fetch("http://localhost:3000/api/crops", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to load crops");
                const data: UserCrop[] = await res.json();
                setCrops(data);

                let initial: UserCrop | null = null;
                if (locationState?.crop && data.length) {
                    initial = data.find(c => c.name.toLowerCase() === locationState.crop!.toLowerCase()) || data[0];
                } else if (data.length) {
                    initial = data[0];
                }
                if (initial) setSelectedCrop(initial);
            } catch {
                setError("Could not load your crops.");
            } finally {
                setLoading(false);
            }
        };
        fetchCrops();
    }, [navigate, locationState]);

    useEffect(() => {
        if (!selectedCrop) return;

        const fetchPathwayInputs = async () => {
            try {
                setPathwaysLoading(true);

                const priceParams = new URLSearchParams({
                    crop: selectedCrop.name,
                    state: selectedCrop.state,
                });
                if (selectedCrop.district) priceParams.set("district", selectedCrop.district);
                if (selectedCrop.latitude != null && selectedCrop.longitude != null) {
                    priceParams.set("lat", String(selectedCrop.latitude));
                    priceParams.set("lon", String(selectedCrop.longitude));
                }

                const trendParams = new URLSearchParams({
                    crop: selectedCrop.name,
                    state: selectedCrop.state,
                });

                const [pricesRes, trendRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/market/prices?${priceParams}`),
                    fetch(`http://localhost:3000/api/market/trend?${trendParams}`),
                ]);

                if (pricesRes.ok) setPriceData(await pricesRes.json());
                else setPriceData(null);

                if (trendRes.ok) setTrendData(await trendRes.json());
                else setTrendData(null);
            } catch {
                setPriceData(null);
                setTrendData(null);
            } finally {
                setPathwaysLoading(false);
            }
        };

        fetchPathwayInputs();
    }, [selectedCrop]);

    const localMarket = priceData?.nearestMarket ?? null;
    const bestNearbyMarket = priceData
        ? [priceData.nearestMarket, ...priceData.alternativeMarkets].reduce((best, market) =>
            market.price > best.price ? market : best,
        priceData.nearestMarket)
        : null;

    const recentLocalPoints = trendData?.trend.filter((point) => point.localPrice !== null).slice(-7) ?? [];
    const latestLocalPrice = recentLocalPoints[recentLocalPoints.length - 1]?.localPrice ?? localMarket?.price ?? null;
    const oldestRecentPrice = recentLocalPoints[0]?.localPrice ?? latestLocalPrice;
    const dailyMomentum = latestLocalPrice != null && oldestRecentPrice != null && recentLocalPoints.length > 1
        ? (latestLocalPrice - oldestRecentPrice) / (recentLocalPoints.length - 1)
        : 0;
    const projectedWaitPrice = latestLocalPrice != null
        ? Math.max(0, Math.round(latestLocalPrice + dailyMomentum * 7))
        : null;
    const signal = trendData ? getSignalTone(trendData.source, dailyMomentum) : null;
    const localToBestGain = localMarket && bestNearbyMarket
        ? bestNearbyMarket.price - localMarket.price - Math.round(bestNearbyMarket.distance * 1.5)
        : null;
    const waitDelta = localMarket && projectedWaitPrice != null
        ? projectedWaitPrice - localMarket.price
        : null;
    const bestIsDifferentMarket = localMarket && bestNearbyMarket
        ? bestNearbyMarket.name !== localMarket.name || bestNearbyMarket.state !== localMarket.state
        : false;

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/90 backdrop-blur-md border-b px-8 md:px-12 py-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-5">
                    <Button variant="ghost" size="default" onClick={() => navigate("/dashboard")} className="gap-2 text-base text-muted-foreground hover:text-foreground h-11 px-4">
                        <ArrowLeft className="h-5 w-5" />
                        Dashboard
                    </Button>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl text-foreground">Market Intelligence</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {crops.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Leaf className="h-5 w-5 text-muted-foreground" />
                            <select
                                className="text-base border rounded-lg px-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={selectedCrop?.name || ""}
                                onChange={(e) => {
                                    const crop = crops.find(c => c.name === e.target.value);
                                    if (crop) setSelectedCrop(crop);
                                }}
                            >
                                {crops.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <Button variant="outline" size="default" className="gap-2 h-11 text-base" onClick={() => setSelectedCrop(selectedCrop ? { ...selectedCrop } : null)}>
                        <RefreshCw className="h-5 w-5" />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="p-8 md:p-12 max-w-[1500px] mx-auto">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-40 gap-5">
                        <Loader2 className="h-14 w-14 animate-spin text-primary" />
                        <p className="text-muted-foreground text-lg">Loading market intelligence…</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-40 gap-5">
                        <p className="text-red-500 font-semibold text-lg">{error}</p>
                        <Button size="lg" variant="outline" onClick={() => setSelectedCrop(selectedCrop ? { ...selectedCrop } : null)}>Try Again</Button>
                    </div>
                )}

                {!loading && !error && selectedCrop && (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">

                        {/* Page Title */}
                        <motion.div variants={item}>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Market Intelligence — <span className="text-primary">{selectedCrop.name}</span>
                            </h1>
                            <p className="text-muted-foreground mt-2 flex items-center gap-2 text-base">
                                <MapPin className="h-5 w-5" />
                                {selectedCrop.place || selectedCrop.district}, {selectedCrop.state}
                            </p>
                        </motion.div>

                        {/* Large Trend Chart */}
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <BarChart3 className="h-7 w-7 text-blue-600" />
                                        30-Day Price Trend
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Local vs national average — {selectedCrop.name} in {selectedCrop.state}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <MarketIntelligenceChart
                                        cropName={selectedCrop.name}
                                        state={selectedCrop.state}
                                        district={selectedCrop.district}
                                        compact={false}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div variants={item}>
                            <Card className="shadow-sm border-slate-200 overflow-hidden">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-3 text-2xl">
                                                <ArrowRight className="h-7 w-7 text-emerald-600" />
                                                Market Pathways
                                            </CardTitle>
                                            <CardDescription className="text-base mt-1">
                                                Three market routes based on current prices and the latest trend signal.
                                            </CardDescription>
                                        </div>

                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    {pathwaysLoading ? (
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="h-56 rounded-2xl border bg-muted/30 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : !localMarket || !bestNearbyMarket || !trendData ? (
                                        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
                                            <p className="font-semibold text-foreground">Path comparison unavailable</p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Market pathways need both price and trend inputs for this crop.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                                                    <div className="flex items-center justify-between gap-3 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                                                <Store className="h-5 w-5 text-slate-700" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-slate-900">Sell Local Now</p>
                                                                <p className="text-sm text-muted-foreground">{localMarket.name}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                                                            {getSourceLabel(localMarket.priceSource)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-4xl font-bold text-slate-900">₹{localMarket.price.toLocaleString("en-IN")}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Immediate price per quintal in your nearest tracked market.</p>
                                                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Transport cost</span>
                                                            <span className="font-semibold">Minimal</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Trend vs yesterday</span>
                                                            <span className={`font-semibold ${localMarket.trend > 0 ? "text-emerald-600" : localMarket.trend < 0 ? "text-red-500" : "text-slate-600"}`}>
                                                                {localMarket.trend > 0 ? "+" : ""}{localMarket.trend}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Signal confidence</span>
                                                            <span className="font-semibold">High</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                                                    <div className="flex items-center justify-between gap-3 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-11 w-11 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                                                                <Truck className="h-5 w-5 text-emerald-700" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-emerald-950">Move to Better Market</p>
                                                                <p className="text-sm text-emerald-700">{bestNearbyMarket.name}, {bestNearbyMarket.state}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                                                            {getSourceLabel(bestNearbyMarket.priceSource)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-4xl font-bold text-emerald-950">₹{bestNearbyMarket.price.toLocaleString("en-IN")}</p>
                                                    <p className="text-sm text-emerald-800 mt-1">
                                                        {bestIsDifferentMarket
                                                            ? `Best tracked market is ${bestNearbyMarket.distance} km away.`
                                                            : "Your nearest market is already the strongest tracked option."}
                                                    </p>
                                                    <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4 space-y-2 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Distance</span>
                                                            <span className="font-semibold">{bestNearbyMarket.distance} km</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Est. transport drag</span>
                                                            <span className="font-semibold">₹{Math.round(bestNearbyMarket.distance * 1.5)}/qt</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Net edge vs local</span>
                                                            <span className={`font-semibold ${localToBestGain != null && localToBestGain > 0 ? "text-emerald-700" : "text-slate-700"}`}>
                                                                {localToBestGain == null ? "—" : `${localToBestGain > 0 ? "+" : ""}₹${localToBestGain}/qt`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                                                    <div className="flex items-center justify-between gap-3 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-11 w-11 rounded-xl bg-white border border-blue-200 flex items-center justify-center">
                                                                <Clock3 className="h-5 w-5 text-blue-700" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-lg text-blue-950">Wait 7 Days</p>
                                                                <p className="text-sm text-blue-700">Short-term trend continuation</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
                                                            Trend-led
                                                        </Badge>
                                                    </div>
                                                    <p className="text-4xl font-bold text-blue-950">
                                                        {projectedWaitPrice != null ? `₹${projectedWaitPrice.toLocaleString("en-IN")}` : "—"}
                                                    </p>
                                                    <p className="text-sm text-blue-800 mt-1">
                                                        Based on the last 7 local points and current momentum.
                                                    </p>
                                                    <div className="mt-5 rounded-xl border border-blue-200 bg-white p-4 space-y-2 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Recent daily momentum</span>
                                                            <span className={`font-semibold ${dailyMomentum > 0 ? "text-emerald-600" : dailyMomentum < 0 ? "text-red-500" : "text-slate-700"}`}>
                                                                {dailyMomentum > 0 ? "+" : ""}₹{Math.round(dailyMomentum)}/day
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Change vs local now</span>
                                                            <span className={`font-semibold ${waitDelta != null && waitDelta > 0 ? "text-emerald-700" : waitDelta != null && waitDelta < 0 ? "text-red-500" : "text-slate-700"}`}>
                                                                {waitDelta == null ? "—" : `${waitDelta > 0 ? "+" : ""}₹${waitDelta}/qt`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Confidence</span>
                                                            <span className="font-semibold">High</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Pathway Read</p>
                                                        <h3 className="text-xl font-bold text-foreground mt-1">What this chart adds before the AI report</h3>
                                                    </div>
                                                    {bestNearbyMarket.profitPotential === "High" && (
                                                        <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-700">
                                                            <Trophy className="h-3.5 w-3.5 mr-1.5" />
                                                            Strong alternate market
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 text-sm">
                                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                                                        <p className="text-muted-foreground mb-1">Local route</p>
                                                        <p className="font-semibold text-foreground">
                                                            Best when you want the cleanest execution with the least market friction.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                                                        <p className="text-emerald-700 mb-1">Better-market route</p>
                                                        <p className="font-semibold text-emerald-950">
                                                            {localToBestGain != null && localToBestGain > 0
                                                                ? `Current data suggests a transport-adjusted edge of about ₹${localToBestGain}/qt.`
                                                                : "Current data does not show a clear transport-adjusted advantage over your local market."}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                                                        <p className="text-blue-700 mb-1">Wait route</p>
                                                        <p className="font-semibold text-blue-950">
                                                            {waitDelta != null && waitDelta > 0
                                                                ? `Recent momentum is positive, but this remains a short-horizon market signal rather than a final recommendation.`
                                                                : waitDelta != null && waitDelta < 0
                                                                    ? `Recent movement is soft, so waiting currently looks weaker than selling immediately.`
                                                                    : "Recent movement is mostly flat, so waiting adds little edge right now."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* AI Report CTA */}
                        <motion.div variants={item}>
                            <button
                                onClick={() => navigate('/market-report')}
                                className="w-full flex items-center justify-between px-6 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Brain className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-base">Get AI Market Report</p>
                                        <p className="text-indigo-200 text-sm">Personalised verdict • Crop advice • What to grow next</p>
                                    </div>
                                </div>
                                <Sparkles className="h-5 w-5 text-indigo-200 group-hover:text-white transition-colors" />
                            </button>
                        </motion.div>

                    </motion.div>
                )}
            </main>
        </div>
    );
}
