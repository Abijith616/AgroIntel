import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, TrendingUp, TrendingDown, Minus,
    MapPin, Truck, Sparkles, Leaf, DollarSign,
    BarChart3, AlertCircle, RefreshCw, Star, Wheat,
    Store, ShoppingBasket, MapPinned, Info, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MarketType = "apmc" | "vegetable" | "local_estimate";

interface LocalMarket {
    name: string;
    district: string;
    state: string;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    email?: string | null;
    sourceUrls?: string[];
    lat?: number;
    lon?: number;
    price: number;
    trend: number;
    marketType?: MarketType;
    priceSource?: "agmarknet" | "estimated" | "osm_estimated";
}

interface Opportunity {
    name: string;
    district: string;
    state: string;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    email?: string | null;
    sourceUrls?: string[];
    lat?: number;
    lon?: number;
    distance: number;
    price: number;
    minPrice: number;
    maxPrice: number;
    trend: number;
    volume: number;
    priceGap: number;
    priceGapPercent: number;
    transportCost: number;
    netGain: number;
    profitPotential: "High" | "Medium" | "Low";
    marketType?: MarketType;
    priceSource?: "agmarknet" | "estimated" | "osm_estimated";
}

interface OpportunityData {
    crop: string;
    localMarket: LocalMarket;
    topOpportunities: Opportunity[];
    bestOpportunity: Opportunity | null;
    aiInsight: string;
    lastUpdated: string;
    source: string;
}

const potentialColors = {
    High: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-red-100 text-red-700 border-red-200",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const marketTypeConfig: Record<MarketType, { label: string; icon: typeof Store; color: string; bgColor: string }> = {
    apmc: { label: "APMC", icon: Store, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
    vegetable: { label: "Vegetable Market", icon: ShoppingBasket, color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
    local_estimate: { label: "Local Market", icon: MapPinned, color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200" },
};

function MarketTypeBadge({ type }: { type?: MarketType }) {
    if (!type) return null;
    const config = marketTypeConfig[type];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${config.bgColor} ${config.color}`}>
            <Icon className="h-3 w-3" />{config.label}
        </span>
    );
}

function PriceSourceBadge({ source }: { source?: "agmarknet" | "estimated" | "osm_estimated" }) {
    if (!source) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold bg-green-100 border-green-300 text-green-800">
            <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            LIVE PRICE
        </span>
    );
}

function TrendBadge({ trend }: { trend: number }) {
    if (trend > 0.2) return (
        <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
            <TrendingUp className="h-4 w-4" />+{trend.toFixed(1)}%
        </span>
    );
    if (trend < -0.2) return (
        <span className="flex items-center gap-1 text-red-500 font-semibold text-sm">
            <TrendingDown className="h-4 w-4" />{trend.toFixed(1)}%
        </span>
    );
    return (
        <span className="flex items-center gap-1 text-muted-foreground text-sm">
            <Minus className="h-4 w-4" />Stable
        </span>
    );
}

export default function MarketOpportunities() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<OpportunityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

    // All user crops for the filter tabs
    const [userCrops, setUserCrops] = useState<Array<{
        id: number;
        name: string;
        state: string;
        district: string;
        place: string;
        latitude?: number | null;
        longitude?: number | null;
    }>>([]);
    const [activeCropId, setActiveCropId] = useState<number | null>(
        searchParams.get("cropId") ? parseInt(searchParams.get("cropId") as string, 10) : null
    );

    // Fetch all user crops once
    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:3000/api/crops", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const crops = await res.json();
                setUserCrops(crops);

                if (activeCropId) return;

                const cropFromQuery = searchParams.get("crop");
                const stateFromQuery = searchParams.get("state");
                const matchedCrop = crops.find((crop: any) =>
                    crop.name === cropFromQuery && crop.state === stateFromQuery
                );

                if (matchedCrop) {
                    setActiveCropId(matchedCrop.id);
                } else if (crops.length > 0) {
                    setActiveCropId(crops[0].id);
                }
            } catch { /* silent */ }
        };
        load();
    }, [activeCropId, searchParams]);

    const activeCrop = userCrops.find((crop) => crop.id === activeCropId) || null;

    const fetchData = async () => {
        if (!activeCrop) return;
        if (!activeCrop.latitude || !activeCrop.longitude) {
            setError("This crop does not have a valid geocode. Edit the crop and add latitude/longitude.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:3000/api/market-opportunities?crop=${encodeURIComponent(activeCrop.name)}&state=${encodeURIComponent(activeCrop.state)}&district=${encodeURIComponent(activeCrop.district || '')}&place=${encodeURIComponent(activeCrop.place || '')}&lat=${encodeURIComponent(String(activeCrop.latitude))}&lon=${encodeURIComponent(String(activeCrop.longitude))}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (activeCrop) fetchData(); }, [activeCropId, userCrops.length]);

    const filtered = data?.topOpportunities.filter(o =>
        filter === "All" ? true : o.profitPotential === filter
    ) ?? [];

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-6 md:px-10 py-5 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Leaf className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold leading-none">Market Opportunities</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Find the most profitable markets for your <span className="font-semibold text-foreground">{activeCrop?.name || searchParams.get("crop") || "Crop"}</span></p>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Crop filter tabs */}
                {userCrops.length > 0 && (
                    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mr-1">Filter by crop:</span>
                        {userCrops.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setActiveCropId(c.id);
                                    setFilter("All");
                                }}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-semibold transition-all shrink-0 ${activeCropId === c.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted/40"
                                    }`}
                            >
                                <Wheat className="h-3.5 w-3.5" />
                                {c.name}
                                <span className="text-xs opacity-70 font-normal">({c.state})</span>
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <main className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
                {loading && (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                        {/* Skeleton: local market */}
                        <motion.div variants={item}>
                            <div className="h-36 bg-muted animate-pulse rounded-xl" />
                        </motion.div>
                        {/* Skeleton: AI insight */}
                        <motion.div variants={item}>
                            <div className="h-28 bg-muted animate-pulse rounded-xl" />
                        </motion.div>
                        {/* Skeleton: cards */}
                        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                            ))}
                        </motion.div>
                    </motion.div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <AlertCircle className="h-12 w-12 text-red-400" />
                        <p className="text-lg font-semibold">Could not load opportunities</p>
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={fetchData}>Try Again</Button>
                    </div>
                )}

                {data && !loading && (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

                        {/* Local Market Baseline */}
                        <motion.div variants={item}>
                            <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
                                <div>
                                    <p className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-1">Your Current (Local) Market</p>
                                    <h2 className="text-2xl font-bold">{data.localMarket.name}</h2>
                                    <p className="text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />{data.localMarket.district}, {data.localMarket.state}
                                    </p>
                                    {data.localMarket.address && (
                                        <p className="text-slate-400 mt-1 text-sm">{data.localMarket.address}</p>
                                    )}
                                    {data.localMarket.marketType && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <MarketTypeBadge type={data.localMarket.marketType} />
                                            <PriceSourceBadge source={data.localMarket.priceSource} />
                                        </div>
                                    )}
                                    {(data.localMarket.phone || data.localMarket.website || data.localMarket.email) && (
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                                            {data.localMarket.phone && <span className="rounded-full border border-slate-500 px-2 py-1">Phone: {data.localMarket.phone}</span>}
                                            {data.localMarket.website && <span className="rounded-full border border-slate-500 px-2 py-1">Website available</span>}
                                            {data.localMarket.email && <span className="rounded-full border border-slate-500 px-2 py-1">Email available</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-300 text-sm mb-1">Today's Price</p>
                                    <p className="text-4xl font-extrabold">₹{data.localMarket.price.toLocaleString("en-IN")}</p>
                                    <p className="text-slate-400 text-sm">/quintal</p>
                                    <div className="mt-2 justify-end flex">
                                        <TrendBadge trend={data.localMarket.trend} />
                                    </div>

                                </div>
                            </div>
                        </motion.div>

                        {/* AI Insight */}
                        {data.aiInsight && (
                            <motion.div variants={item}>
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5 shadow-md flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm mb-1 text-indigo-100 uppercase tracking-wide">AI Market Insight</p>
                                        <p className="text-sm leading-relaxed">{data.aiInsight}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Export Opportunities Hub card */}
                        <motion.div variants={item}>
                            <button
                                onClick={() => navigate(`/export-opportunities`)}
                                className="w-full text-left group"
                            >
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shrink-0">
                                            <Truck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base text-emerald-900">All Export Opportunities</p>
                                            <p className="text-sm text-emerald-700 mt-0.5">
                                                Live weather alerts + verified exporters &amp; trade partners for <span className="font-semibold">{activeCrop?.name || searchParams.get("crop") || "your crop"}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm group-hover:gap-3 transition-all">
                                        Open Hub <TrendingUp className="h-4 w-4" />
                                    </div>
                                </div>
                            </button>
                        </motion.div>


                        {/* Best Opportunity Highlight */}
                        {data.bestOpportunity && data.bestOpportunity.netGain > 0 && (
                            <motion.div variants={item}>
                                <Card className="border-2 border-emerald-300 bg-emerald-50/60 shadow-md">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
                                            <Star className="h-5 w-5 text-emerald-500 fill-emerald-400" />
                                            Best Opportunity Right Now
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <p className="text-xl font-bold text-foreground">{data.bestOpportunity.name}</p>
                                                <div className="flex items-center gap-2 mt-1.5 mb-1">
                                                    <MarketTypeBadge type={data.bestOpportunity.marketType} />
                                                    <PriceSourceBadge source={data.bestOpportunity.priceSource} />
                                                </div>
                                                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                                    <MapPin className="h-4 w-4" />{data.bestOpportunity.district}, {data.bestOpportunity.state}
                                                </p>
                                                <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Truck className="h-4 w-4" />{data.bestOpportunity.distance} km away
                                                </p>
                                            </div>
                                            <div className="flex gap-6">
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Market Price</p>
                                                    <p className="text-2xl font-bold text-emerald-700">₹{data.bestOpportunity.price.toLocaleString("en-IN")}</p>
                                                    <p className="text-xs text-muted-foreground">/quintal</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Price Gap</p>
                                                    <p className="text-2xl font-bold text-emerald-700">+{data.bestOpportunity.priceGapPercent}%</p>
                                                    <p className="text-xs text-muted-foreground">vs local</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Net Gain</p>
                                                    <p className="text-2xl font-bold text-emerald-700">₹{data.bestOpportunity.netGain}</p>
                                                    <p className="text-xs text-muted-foreground">/qt after transport</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {(!data.bestOpportunity || data.bestOpportunity.netGain <= 0) && (
                            <motion.div variants={item}>
                                <Card className="border border-amber-200 bg-amber-50/80 shadow-sm">
                                    <CardContent className="pt-5 pb-5">
                                        <p className="font-semibold text-amber-900">Your current local market is the best option right now.</p>
                                        <p className="text-sm text-amber-800 mt-1">
                                            The nearby alternatives are not worth the extra transport cost for this crop at the moment.
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Filter Bar */}
                        <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
                            <p className="text-sm font-medium text-muted-foreground">Filter:</p>
                            <select
                                value={filter}
                                onChange={e => setFilter(e.target.value as typeof filter)}
                                className="px-4 py-1.5 rounded-full text-sm font-medium border border-border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            >
                                <option value="All">All Markets</option>
                                <option value="High">High Potential</option>
                                <option value="Medium">Medium Potential</option>
                                <option value="Low">Low Potential</option>
                            </select>
                            <p className="text-xs text-muted-foreground ml-auto">{filtered.length} market{filtered.length !== 1 ? "s" : ""} shown</p>
                        </motion.div>

                        {/* Opportunities Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filtered.map((opp, i) => (
                                <div key={opp.name}>
                                    <Card
                                        className={`shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer border ${opp.netGain > 200 ? "border-emerald-200" : opp.netGain < 0 ? "border-red-100" : "border-border"}`}
                                        onClick={() => {
                                            if (opp.lat && opp.lon) {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${opp.lat},${opp.lon}&travelmode=driving`, '_blank');
                                            }
                                        }}
                                    >
                                        <CardContent className="pt-5 pb-5">
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                                                        <h3 className="font-bold text-foreground text-base leading-tight">{opp.name}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />{opp.district}, {opp.state}
                                                    </p>
                                                    {opp.address && (
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{opp.address}</p>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        <MarketTypeBadge type={opp.marketType} />
                                                        <PriceSourceBadge source={opp.priceSource} />
                                                    </div>
                                                    {(opp.phone || opp.website || opp.email) && (
                                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                            {opp.phone && <span className="rounded-full border px-2 py-0.5">Phone: {opp.phone}</span>}
                                                            {opp.website && <span className="rounded-full border px-2 py-0.5">Website</span>}
                                                            {opp.email && <span className="rounded-full border px-2 py-0.5">Email</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <Badge className={`shrink-0 border text-xs font-semibold ${potentialColors[opp.profitPotential]}`}>
                                                    {opp.profitPotential}
                                                </Badge>
                                            </div>

                                            {/* Price row */}
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                                                    <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                                                    <p className="font-bold text-sm">₹{opp.price.toLocaleString("en-IN")}</p>
                                                    <p className="text-xs text-muted-foreground">/qt</p>
                                                </div>
                                                <div className={`rounded-lg p-2.5 text-center ${opp.priceGap >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                                                    <p className="text-xs text-muted-foreground mb-0.5">Gap</p>
                                                    <p className={`font-bold text-sm ${opp.priceGap >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                                        {opp.priceGap >= 0 ? "+" : ""}{opp.priceGapPercent}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">vs local</p>
                                                </div>
                                                <div className={`rounded-lg p-2.5 text-center ${opp.netGain > 0 ? "bg-blue-50" : "bg-muted/40"}`}>
                                                    <p className="text-xs text-muted-foreground mb-0.5">Net Gain</p>
                                                    <p className={`font-bold text-sm ${opp.netGain > 0 ? "text-blue-700" : "text-muted-foreground"}`}>
                                                        {opp.netGain > 0 ? "+" : ""}₹{opp.netGain}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">/qt</p>
                                                </div>
                                            </div>

                                            {/* Footer row */}
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Truck className="h-3.5 w-3.5" />{opp.distance} km
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3.5 w-3.5" />~₹{opp.transportCost}/qt
                                                </span>
                                                <TrendBadge trend={opp.trend} />
                                                <span className="flex items-center gap-1 text-primary font-semibold">
                                                    <ExternalLink className="h-3.5 w-3.5" /> Open in Maps
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                <p>No markets match this filter.</p>
                            </div>
                        )}

                        {/* Footer */}
                        <motion.div variants={item} className="text-center text-xs text-muted-foreground pb-4">
                            <p>Live prices are fetched from AGMARKNET (data.gov.in) and agricultural market networks.</p>
                            <p className="mt-0.5">Transport costs estimated at ₹1.5/km per quintal.</p>
                            <p className="mt-0.5">Updated: {new Date(data.lastUpdated).toLocaleString("en-IN")} · {data.source}</p>
                        </motion.div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
