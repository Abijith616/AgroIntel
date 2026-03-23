import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, TrendingUp, MapPin, ShoppingCart,
    Leaf, Trophy, BarChart3, Loader2, RefreshCw, Star, Navigation,
    DollarSign, Package, ChevronUp, ChevronDown, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketIntelligenceChart } from "@/components/MarketIntelligenceChart";

interface MarketEntry {
    name: string;
    district: string;
    state: string;
    distance: number;
    price: number;
    minPrice: number;
    maxPrice: number;
    trend: number;
    volume: number;
    profitPotential: "High" | "Medium" | "Low";
}

interface UserCrop {
    name: string;
    state: string;
    district: string;
    place: string;
    landVolume: number;
    landUnit: string;
}

interface MarketData {
    crop: string;
    farmerLocation: { lat: number; lon: number; state: string };
    nearestMarket: MarketEntry;
    alternativeMarkets: MarketEntry[];
    metadata: { fetchedAt: string };
}

const YIELD_PER_ACRE: Record<string, number> = {
    rice: 25, wheat: 20, maize: 30, cotton: 10,
    sugarcane: 400, soybean: 12, groundnut: 15, mustard: 8,
    onion: 100, tomato: 120, potato: 100, default: 20,
};

function getYieldEstimate(cropName: string, landVolume: number, landUnit: string): number {
    const key = cropName.toLowerCase().trim();
    const yieldPerAcre = YIELD_PER_ACRE[key] || YIELD_PER_ACRE.default;
    const acres = landUnit === "hectares" ? landVolume * 2.47 : landVolume;
    return Math.round(yieldPerAcre * acres);
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function PotentialBadge({ potential }: { potential: "High" | "Medium" | "Low" }) {
    if (potential === "High") return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1">High</Badge>;
    if (potential === "Low") return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 text-sm px-3 py-1">Low</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-sm px-3 py-1">Medium</Badge>;
}

function TrendBadge({ trend }: { trend: number }) {
    if (trend > 0) return (
        <span className="flex items-center text-emerald-600 font-semibold text-base">
            <ChevronUp className="h-5 w-5" />+{trend}%
        </span>
    );
    if (trend < 0) return (
        <span className="flex items-center text-red-500 font-semibold text-base">
            <ChevronDown className="h-5 w-5" />{trend}%
        </span>
    );
    return (
        <span className="flex items-center text-muted-foreground text-base">
            <Minus className="h-5 w-5" />0%
        </span>
    );
}

export default function MarketPrices() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as { crop?: string; state?: string; district?: string } | null;

    const [crops, setCrops] = useState<UserCrop[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<UserCrop | null>(null);
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCropsThenPrices = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) { navigate("/login"); return; }
                const res = await fetch("http://localhost:3000/api/crops", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to load crops");
                const cropsData: UserCrop[] = await res.json();
                setCrops(cropsData);

                let initial: UserCrop | null = null;
                if (locationState?.crop && cropsData.length) {
                    initial = cropsData.find(
                        (c) => c.name.toLowerCase() === locationState.crop!.toLowerCase()
                    ) || cropsData[0];
                } else if (cropsData.length) {
                    initial = cropsData[0];
                }
                if (initial) setSelectedCrop(initial);
            } catch (e) {
                setError("Could not load your crops.");
                setLoading(false);
            }
        };
        fetchCropsThenPrices();
    }, [navigate, locationState]);

    useEffect(() => {
        if (!selectedCrop) return;
        const fetchPrices = async () => {
            try {
                setLoading(true);
                setError(null);
                const params = new URLSearchParams({
                    crop: selectedCrop.name,
                    state: selectedCrop.state,
                });
                if (selectedCrop.district) params.set("district", selectedCrop.district);
                const res = await fetch(`http://localhost:3000/api/market/prices?${params}`);
                if (!res.ok) throw new Error("Failed to fetch market prices");
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                setError(e.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, [selectedCrop]);

    const allMarkets = data ? [data.nearestMarket, ...data.alternativeMarkets] : [];
    const bestMarket = allMarkets.length
        ? allMarkets.reduce((best, m) => (m.price > best.price ? m : best), allMarkets[0])
        : null;
    const nearestMarket = data?.nearestMarket;

    const estimatedYield = selectedCrop
        ? getYieldEstimate(selectedCrop.name, selectedCrop.landVolume, selectedCrop.landUnit)
        : 0;
    const extraEarnings =
        bestMarket && nearestMarket && bestMarket.name !== nearestMarket.name
            ? Math.round((bestMarket.price - nearestMarket.price) * estimatedYield)
            : 0;

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
                        <span className="font-bold text-xl text-foreground">Market Analysis</span>
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
                                    const crop = crops.find((c) => c.name === e.target.value);
                                    if (crop) setSelectedCrop(crop);
                                }}
                            >
                                {crops.map((c) => (
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
                        <p className="text-muted-foreground text-lg">Fetching live market prices…</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-40 gap-5">
                        <p className="text-red-500 font-semibold text-lg">{error}</p>
                        <Button size="lg" variant="outline" onClick={() => setSelectedCrop(selectedCrop ? { ...selectedCrop } : null)}>
                            Try Again
                        </Button>
                    </div>
                )}

                {data && !loading && selectedCrop && (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">

                        {/* Page Title */}
                        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                    Market Prices — <span className="text-primary">{data.crop}</span>
                                </h1>
                                <p className="text-muted-foreground mt-2 flex items-center gap-2 text-base">
                                    <MapPin className="h-5 w-5" />
                                    {selectedCrop.place}, {selectedCrop.district}, {selectedCrop.state}
                                    &nbsp;·&nbsp;
                                    <span className="relative flex h-2.5 w-2.5 inline-block">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                    <span className="text-emerald-600 font-semibold">Live</span>
                                    &nbsp;·&nbsp; Updated {new Date(data.metadata.fetchedAt).toLocaleTimeString()}
                                </p>
                            </div>
                        </motion.div>

                        {/* ====== TOP SUMMARY CARDS ====== */}
                        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Nearest Market Price */}
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base font-semibold text-muted-foreground">Nearest Market</CardTitle>
                                    <Navigation className="h-6 w-6 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">₹{nearestMarket!.price.toLocaleString("en-IN")}<span className="text-lg font-normal text-muted-foreground">/qt</span></div>
                                    <div className="mt-1"><TrendBadge trend={nearestMarket!.trend} /></div>
                                    <p className="text-sm text-muted-foreground mt-2 truncate">{nearestMarket!.name} · {nearestMarket!.distance} km</p>
                                </CardContent>
                            </Card>

                            {/* Best Price */}
                            <Card className="border-emerald-200 bg-emerald-50/50">
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base font-semibold text-muted-foreground">Best Available Price</CardTitle>
                                    <Trophy className="h-6 w-6 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-emerald-700">₹{bestMarket!.price.toLocaleString("en-IN")}<span className="text-lg font-normal text-muted-foreground">/qt</span></div>
                                    <div className="mt-1"><TrendBadge trend={bestMarket!.trend} /></div>
                                    <p className="text-sm text-muted-foreground mt-2 truncate">{bestMarket!.name}</p>
                                </CardContent>
                            </Card>

                            {/* Extra Earnings */}
                            <Card className={extraEarnings > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base font-semibold text-muted-foreground">Extra Earnings Possible</CardTitle>
                                    <DollarSign className="h-6 w-6 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    {extraEarnings > 0 ? (
                                        <>
                                            <div className="text-4xl font-bold text-amber-700">₹{extraEarnings.toLocaleString("en-IN")}</div>
                                            <p className="text-sm text-muted-foreground mt-2">by selling at best market</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-4xl font-bold text-emerald-700">Optimal!</div>
                                            <p className="text-sm text-muted-foreground mt-2">Nearest is also the best market</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Estimated Yield */}
                            <Card>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base font-semibold text-muted-foreground">Estimated Yield</CardTitle>
                                    <Package className="h-6 w-6 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold">{estimatedYield} qt</div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        from {selectedCrop.landVolume} {selectedCrop.landUnit}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ====== NEAREST MARKET HIGHLIGHT ====== */}
                        <motion.div variants={item}>
                            <Card className="border-primary/20 shadow-md overflow-hidden">
                                <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
                                <CardHeader className="pb-4 pt-6 px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Navigation className="h-7 w-7 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl flex items-center gap-3">
                                                {nearestMarket!.name}
                                                <Badge variant="secondary" className="bg-primary/10 text-primary text-sm px-3 py-1">Nearest</Badge>
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1.5 mt-1 text-base">
                                                <MapPin className="h-4 w-4" />
                                                {nearestMarket!.district}, {nearestMarket!.state} · {nearestMarket!.distance} km away
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Today's Price</p>
                                            <p className="text-5xl font-bold">₹{nearestMarket!.price.toLocaleString("en-IN")}<span className="text-xl font-normal text-muted-foreground">/qt</span></p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Price Range</p>
                                            <p className="text-2xl font-semibold">₹{nearestMarket!.minPrice.toLocaleString("en-IN")} – ₹{nearestMarket!.maxPrice.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Daily Trend</p>
                                            <div className="mt-1"><TrendBadge trend={nearestMarket!.trend} /></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Volume Today</p>
                                            <p className="text-2xl font-semibold">{nearestMarket!.volume.toLocaleString("en-IN")} <span className="font-normal text-muted-foreground text-base">tonnes</span></p>
                                        </div>
                                    </div>

                                    {bestMarket && bestMarket.name !== nearestMarket!.name && (
                                        <div className="mt-8 p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                                            <Star className="h-7 w-7 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-amber-800 text-lg">Better price available at {bestMarket.name}</p>
                                                <p className="text-base text-amber-700 mt-1">
                                                    ₹{(bestMarket.price - nearestMarket!.price).toLocaleString("en-IN")} more per quintal (~{bestMarket.distance} km away).
                                                    {estimatedYield > 0 && (
                                                        <> That's <strong>₹{extraEarnings.toLocaleString("en-IN")}</strong> extra for your estimated yield of {estimatedYield} qt.</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {bestMarket && bestMarket.name === nearestMarket!.name && (
                                        <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                                            <Trophy className="h-7 w-7 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-emerald-800 text-lg">Your nearest market offers the best price!</p>
                                                <p className="text-base text-emerald-700 mt-1">No need to travel far — sell here for maximum profit.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ====== 30-DAY TREND CHART ====== */}
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <TrendingUp className="h-7 w-7 text-blue-600" />
                                        30-Day Price Trend
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Local vs national average price — {data.crop} in {selectedCrop.state}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <MarketIntelligenceChart
                                        cropName={data.crop}
                                        state={selectedCrop.state}
                                        district={selectedCrop.district}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ====== MARKET COMPARISON TABLE ====== */}
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="px-8 pt-8 pb-4">
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <BarChart3 className="h-7 w-7 text-blue-600" />
                                        Market Comparison
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">All regional markets sorted by distance</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-base">
                                            <thead>
                                                <tr className="border-b bg-muted/40">
                                                    <th className="text-left px-8 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Market</th>
                                                    <th className="text-left px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Location</th>
                                                    <th className="text-right px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Distance</th>
                                                    <th className="text-right px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Price (₹/qt)</th>
                                                    <th className="text-right px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Trend</th>
                                                    <th className="text-right px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Volume</th>
                                                    <th className="text-center px-6 py-5 font-semibold text-muted-foreground text-sm uppercase tracking-wide">Profit Potential</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allMarkets.map((market, idx) => {
                                                    const isNearest = idx === 0;
                                                    const isBest = bestMarket?.name === market.name && bestMarket?.district === market.district;
                                                    return (
                                                        <tr
                                                            key={`${market.name}-${idx}`}
                                                            className={`border-b last:border-0 transition-colors hover:bg-muted/20 ${isNearest || isBest ? "bg-primary/3" : ""}`}
                                                        >
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3 font-semibold text-base">
                                                                    {isNearest && (
                                                                        <span title="Nearest" className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                                                            <Navigation className="h-4 w-4" />
                                                                        </span>
                                                                    )}
                                                                    {isBest && !isNearest && (
                                                                        <span title="Best Price" className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                                                                            <Trophy className="h-4 w-4" />
                                                                        </span>
                                                                    )}
                                                                    {!isNearest && !isBest && <span className="w-7" />}
                                                                    <span>{market.name}</span>
                                                                    {isNearest && <Badge variant="outline" className="text-xs px-2 py-0.5 text-primary border-primary/30">Nearest</Badge>}
                                                                    {isBest && <Badge variant="outline" className="text-xs px-2 py-0.5 text-emerald-700 border-emerald-300">Best Price</Badge>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-muted-foreground text-base">{market.district}, {market.state}</td>
                                                            <td className="px-6 py-5 text-right text-muted-foreground text-base font-medium">{market.distance} km</td>
                                                            <td className="px-6 py-5 text-right font-bold text-lg">₹{market.price.toLocaleString("en-IN")}</td>
                                                            <td className="px-6 py-5 text-right">
                                                                <TrendBadge trend={market.trend} />
                                                            </td>
                                                            <td className="px-6 py-5 text-right text-muted-foreground text-base">{market.volume.toLocaleString("en-IN")} t</td>
                                                            <td className="px-6 py-5 text-center">
                                                                <PotentialBadge potential={market.profitPotential} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ====== PROFITABILITY ANALYSIS ====== */}
                        <motion.div variants={item}>
                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl overflow-hidden relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
                                <CardHeader className="relative z-10 px-8 pt-8 pb-4">
                                    <CardTitle className="text-2xl flex items-center gap-3 text-white">
                                        <TrendingUp className="h-7 w-7 text-primary" />
                                        Profitability Analysis
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-base mt-1">
                                        Based on your {selectedCrop.landVolume} {selectedCrop.landUnit} of {data.crop} (~{estimatedYield} qt estimated yield)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 px-8 pb-8">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {/* Sell at nearest */}
                                        <div className="bg-white/5 rounded-2xl p-7 border border-white/10">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Navigation className="h-6 w-6 text-blue-400" />
                                                <span className="text-slate-300 text-lg font-semibold">Nearest Market</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-2">{nearestMarket!.name}</p>
                                            <p className="text-4xl font-bold text-white">₹{(nearestMarket!.price * estimatedYield).toLocaleString("en-IN")}</p>
                                            <p className="text-sm text-slate-400 mt-2">₹{nearestMarket!.price}/qt × {estimatedYield} qt</p>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4" />{nearestMarket!.distance} km travel
                                            </p>
                                        </div>

                                        {/* Sell at best */}
                                        <div className="bg-emerald-500/10 rounded-2xl p-7 border border-emerald-500/30">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Trophy className="h-6 w-6 text-emerald-400" />
                                                <span className="text-slate-300 text-lg font-semibold">Best Market</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-2">{bestMarket!.name}</p>
                                            <p className="text-4xl font-bold text-emerald-400">₹{(bestMarket!.price * estimatedYield).toLocaleString("en-IN")}</p>
                                            <p className="text-sm text-slate-400 mt-2">₹{bestMarket!.price}/qt × {estimatedYield} qt</p>
                                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4" />{bestMarket!.distance} km travel
                                            </p>
                                        </div>

                                        {/* Difference */}
                                        <div className={`${extraEarnings > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"} rounded-2xl p-7 border`}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <DollarSign className={`h-6 w-6 ${extraEarnings > 0 ? "text-amber-400" : "text-emerald-400"}`} />
                                                <span className="text-slate-300 text-lg font-semibold">
                                                    {extraEarnings > 0 ? "Extra Opportunity" : "You're Optimal"}
                                                </span>
                                            </div>
                                            {extraEarnings > 0 ? (
                                                <>
                                                    <p className="text-4xl font-bold text-amber-400">+₹{extraEarnings.toLocaleString("en-IN")}</p>
                                                    <p className="text-sm text-slate-400 mt-2">extra if you sell at best market</p>
                                                    <p className="text-sm text-slate-400 mt-1">
                                                        ₹{(bestMarket!.price - nearestMarket!.price)} more per quintal
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-4xl font-bold text-emerald-400">₹0 lost</p>
                                                    <p className="text-sm text-slate-400 mt-2">Nearest market has the best price</p>
                                                    <p className="text-sm text-slate-400 mt-1">Sell locally for maximum profit!</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ====== HIGH PROFIT MARKETS SPOTLIGHT ====== */}
                        {allMarkets.filter(m => m.profitPotential === "High").length > 0 && (
                            <motion.div variants={item}>
                                <Card className="shadow-sm">
                                    <CardHeader className="px-8 pt-8 pb-4">
                                        <CardTitle className="flex items-center gap-3 text-2xl">
                                            <ShoppingCart className="h-7 w-7 text-emerald-600" />
                                            Top Markets to Consider
                                        </CardTitle>
                                        <CardDescription className="text-base mt-1">Markets with high profit potential for {data.crop}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8">
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {allMarkets
                                                .filter(m => m.profitPotential === "High")
                                                .slice(0, 6)
                                                .map((market, idx) => (
                                                    <div key={idx} className="flex flex-col gap-3 p-6 rounded-2xl border bg-emerald-50/30 hover:bg-emerald-50 transition-colors">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="font-bold text-base leading-tight">{market.name}</p>
                                                                <p className="text-sm text-muted-foreground mt-0.5">{market.district}, {market.state}</p>
                                                            </div>
                                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1 shrink-0">High</Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-2xl font-bold">₹{market.price.toLocaleString("en-IN")}/qt</span>
                                                            <TrendBadge trend={market.trend} />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <MapPin className="h-4 w-4" />{market.distance} km away · {market.volume.toLocaleString("en-IN")} t/day
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                    </motion.div>
                )}
            </main>
        </div>
    );
}
