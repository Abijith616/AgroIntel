import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Leaf, ArrowLeft, Globe, Phone, Mail, ExternalLink,
    TrendingUp, PackageCheck, Truck, Filter, Search,
    Building2, MapPin, CheckCircle2, CloudLightning,
    Droplets, CloudSun, Wind, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo, useEffect, useCallback } from "react";

// ─── Weather opportunity type (passed via router state) ───────────────────────
interface WeatherOpportunity {
    region: string;
    country: string;
    type: "domestic" | "international";
    crop: string;
    stressType: "Flood" | "Drought" | "Heat" | "Cold" | "Stable";
    severity: "Severe" | "Moderate" | "None";
    weatherSummary: string;
    totalRain: number;
    avgMaxTemp: number;
    opportunityInsight: string;
    error: string | null;
}

// ─── Export contact type (from API) ───────────────────────────────────────────
interface ExportContact {
    id: number;
    name: string;
    type: "Exporter" | "Agri-Broker" | "Trade Board" | "Government" | "Cooperative" | "Commodity Board";
    crops: string[];
    description: string;
    cropSpecificInsight: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    verified: boolean;
    tag: string;
    tagColor: string;
    relevanceScore: number;
}

// ─── Cache key for localStorage ───────────────────────────────────────────────
const CACHE_KEY = "agrointel_export_partners_v1";

interface CachedPartners {
    crops: string[];
    data: ExportContact[];
    fetchedAt: string;
}

const ALL_TYPES = ["All", "Exporter", "Trade Board", "Government", "Cooperative", "Commodity Board"];

// ─── Pastel theme map (matches WeatherPage card styles) ───────────────────────
const stressTheme = {
    Flood: { cardBg: "bg-blue-50 border border-blue-200", headerBg: "bg-blue-100 border-b border-blue-200", emoji: "🌊", emojiLabel: "FLOODING", labelColor: "text-blue-700", regionColor: "text-blue-950", metaColor: "text-blue-500", chipBg: "bg-white border-blue-200 text-blue-700", summaryBg: "bg-blue-100/60 text-blue-800", severeBadge: "bg-red-100 text-red-600 border-red-200", modBadge: "bg-blue-200 text-blue-700 border-blue-300", oppBg: "bg-emerald-50 border-t border-emerald-100", oppLabel: "text-emerald-700", oppText: "text-emerald-950" },
    Drought: { cardBg: "bg-amber-50 border border-amber-200", headerBg: "bg-amber-100 border-b border-amber-200", emoji: "☀️", emojiLabel: "DROUGHT", labelColor: "text-amber-700", regionColor: "text-amber-950", metaColor: "text-amber-500", chipBg: "bg-white border-amber-200 text-amber-700", summaryBg: "bg-amber-100/60 text-amber-900", severeBadge: "bg-red-100 text-red-700 border-red-200", modBadge: "bg-amber-200 text-amber-800 border-amber-300", oppBg: "bg-emerald-50 border-t border-emerald-100", oppLabel: "text-emerald-700", oppText: "text-emerald-950" },
    Heat: { cardBg: "bg-rose-50 border border-rose-200", headerBg: "bg-rose-100 border-b border-rose-200", emoji: "🔥", emojiLabel: "HEAT STRESS", labelColor: "text-rose-700", regionColor: "text-rose-950", metaColor: "text-rose-400", chipBg: "bg-white border-rose-200 text-rose-700", summaryBg: "bg-rose-100/60 text-rose-900", severeBadge: "bg-red-100 text-red-600 border-red-200", modBadge: "bg-rose-200 text-rose-700 border-rose-300", oppBg: "bg-emerald-50 border-t border-emerald-100", oppLabel: "text-emerald-700", oppText: "text-emerald-950" },
    Cold: { cardBg: "bg-sky-50 border border-sky-200", headerBg: "bg-sky-100 border-b border-sky-200", emoji: "❄️", emojiLabel: "COLD STRESS", labelColor: "text-sky-700", regionColor: "text-sky-950", metaColor: "text-sky-400", chipBg: "bg-white border-sky-200 text-sky-700", summaryBg: "bg-sky-100/60 text-sky-900", severeBadge: "bg-red-100 text-red-600 border-red-200", modBadge: "bg-sky-200 text-sky-700 border-sky-300", oppBg: "bg-emerald-50 border-t border-emerald-100", oppLabel: "text-emerald-700", oppText: "text-emerald-950" },
    Stable: { cardBg: "bg-slate-50 border border-slate-200", headerBg: "bg-slate-100 border-b border-slate-200", emoji: "✅", emojiLabel: "STABLE", labelColor: "text-slate-600", regionColor: "text-slate-900", metaColor: "text-slate-400", chipBg: "bg-white border-slate-200 text-slate-600", summaryBg: "bg-slate-100/60 text-slate-700", severeBadge: "bg-slate-200 text-slate-600 border-slate-300", modBadge: "bg-slate-200 text-slate-600 border-slate-300", oppBg: "bg-emerald-50 border-t border-emerald-100", oppLabel: "text-emerald-700", oppText: "text-emerald-950" },
};

// ─── Weather opportunity card ─────────────────────────────────────────────────
function WeatherOppCard({ opp, index }: { opp: WeatherOpportunity; index: number }) {
    const th = stressTheme[opp.stressType] ?? stressTheme.Stable;
    const severityBadge = opp.severity === "Severe" ? th.severeBadge : th.modBadge;
    const severityLabel = opp.severity === "Severe" ? "⚠ Severe" : "● Moderate";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35 }}
            className={`overflow-hidden rounded-2xl ${th.cardBg} shadow-md flex flex-col`}
        >
            <div className={`${th.headerBg} px-5 py-3.5 flex items-center justify-between`}>
                <span className={`text-sm font-black tracking-[0.15em] uppercase ${th.labelColor}`}>
                    {th.emoji} {th.emojiLabel}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${severityBadge}`}>
                    {severityLabel}
                </span>
            </div>
            <div className="p-5 pb-4 flex-1">
                <h3 className={`text-xl font-extrabold leading-tight mb-1 ${th.regionColor}`}>{opp.region}</h3>
                <p className={`text-sm font-medium mb-4 ${th.metaColor}`}>
                    {opp.type === "domestic" ? "🇮🇳 India" : `🌐 ${opp.country}`}
                    {" · "}Major {opp.crop} producer
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border ${th.chipBg}`}>
                        <Droplets className="h-4 w-4" />{opp.totalRain.toFixed(0)} mm / week
                    </span>
                    <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border ${th.chipBg}`}>
                        <CloudSun className="h-4 w-4" />{opp.avgMaxTemp.toFixed(1)}°C avg high
                    </span>
                </div>
                <p className={`text-sm rounded-lg px-3 py-2.5 leading-relaxed ${th.summaryBg}`}>{opp.weatherSummary}</p>
            </div>
            <div className={`p-5 ${th.oppBg}`}>
                <p className={`text-xs font-black uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5 ${th.oppLabel}`}>
                    <TrendingUp className="h-3.5 w-3.5" /> Your Opportunity
                </p>
                <p className={`text-sm leading-relaxed ${th.oppText}`}>{opp.opportunityInsight}</p>
            </div>
        </motion.div>
    );
}

// ─── Export contact card ──────────────────────────────────────────────────────
function ExportCard({ contact, index }: { contact: ExportContact; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
        >
            <Card className="hover:shadow-lg transition-all duration-300 border hover:border-primary/30">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-base text-foreground leading-snug">{contact.name}</h3>
                                {contact.verified && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${contact.tagColor}`}>{contact.tag}</span>
                                <span className="text-xs text-muted-foreground px-2.5 py-0.5 bg-muted rounded-full">{contact.type}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{contact.location}</span>
                    </div>
                    {/* AI-generated crop-specific insight */}
                    {contact.cropSpecificInsight && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                            <p className="text-xs text-emerald-800 leading-relaxed flex items-start gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                {contact.cropSpecificInsight}
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{contact.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {contact.crops.map((crop) => (
                            <Badge key={crop} variant="secondary" className="text-xs bg-primary/8 text-primary border border-primary/15">{crop}</Badge>
                        ))}
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Details</h4>
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"><Mail className="h-3.5 w-3.5 text-blue-600" /></div>
                            <span className="truncate">{contact.email}</span>
                        </a>
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0"><Phone className="h-3.5 w-3.5 text-green-600" /></div>
                            <span>{contact.phone}</span>
                        </a>
                        <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0"><Globe className="h-3.5 w-3.5 text-purple-600" /></div>
                            <span className="truncate">{contact.website.replace("https://", "")}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </a>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <a href={`mailto:${contact.email}`} className="flex-1">
                            <Button className="w-full h-9 text-sm" size="sm"><Mail className="h-3.5 w-3.5 mr-1.5" />Send Inquiry</Button>
                        </a>
                        <a href={contact.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-9 text-sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Main Hub Page ────────────────────────────────────────────────────────────
export default function ExportOpportunities() {
    const navigate = useNavigate();
    const location = useLocation();

    // Weather data passed via router state from WeatherPage (no extra API call)
    const weatherOpportunities: WeatherOpportunity[] = location.state?.weatherOpportunities ?? [];
    const passedCrop: string = location.state?.crop ?? "";

    // Derive unique crops from weather opportunities for a quick filter
    const weatherCrops = useMemo(() => {
        const crops = Array.from(new Set(weatherOpportunities.map((o) => o.crop).filter(Boolean)));
        return ["All", ...crops];
    }, [weatherOpportunities]);

    // Contact directory filters
    const [search, setSearch] = useState("");
    const [selectedCrop, setSelectedCrop] = useState(passedCrop || "All");
    const [selectedType, setSelectedType] = useState("All");

    // ── Dynamic export partners from API with caching ─────────────────────────
    const [exportContacts, setExportContacts] = useState<ExportContact[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [isCached, setIsCached] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [userCrops, setUserCrops] = useState<string[]>([]);

    // Fetch user's crops from backend
    useEffect(() => {
        const fetchCrops = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3000/api/crops", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const cropNames = [...new Set(data.map((c: any) => c.name as string))] as string[];
                    const state = data[0]?.state || "Kerala";
                    setUserCrops(cropNames.length > 0 ? cropNames : ["Rice"]);
                    (window as any).__agrointel_farmer_state = state;
                } else {
                    setUserCrops(["Rice"]); // fallback
                }
            } catch {
                setUserCrops(["Rice"]); // fallback on error
            }
        };
        fetchCrops();
    }, []);

    // Fetch export partners (with localStorage caching)
    const fetchPartners = useCallback(async (forceRefresh = false) => {
        if (userCrops.length === 0) return;
        const farmerState = (window as any).__agrointel_farmer_state || "Kerala";
        const token = localStorage.getItem("token");

        // Check localStorage cache first (unless force refresh)
        if (!forceRefresh) {
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (raw) {
                    const cached: CachedPartners = JSON.parse(raw);
                    const cachedCropsSorted = [...cached.crops].sort().join(",");
                    const currentCropsSorted = [...userCrops].sort().join(",");
                    if (cachedCropsSorted === currentCropsSorted && cached.data.length > 0) {
                        setExportContacts(cached.data);
                        setIsCached(true);
                        setPartnersLoading(false);
                        return;
                    }
                }
            } catch { /* cache miss */ }
        }

        // Fetch from API
        setPartnersLoading(true);
        setRefreshing(forceRefresh);
        try {
            const cropsParam = userCrops.join(",");
            const res = await fetch(
                `http://localhost:3000/api/export-partners?crops=${encodeURIComponent(cropsParam)}&state=${encodeURIComponent(farmerState)}&forceRefresh=${forceRefresh}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setExportContacts(data.partners || []);
                setIsCached(data.cached || false);
                // Save to localStorage
                const toCache: CachedPartners = {
                    crops: userCrops,
                    data: data.partners || [],
                    fetchedAt: data.fetchedAt || new Date().toISOString(),
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
            }
        } catch (e) {
            console.error("Failed to fetch export partners", e);
        } finally {
            setPartnersLoading(false);
            setRefreshing(false);
        }
    }, [userCrops]);

    useEffect(() => {
        fetchPartners(false);
    }, [fetchPartners]);

    // Filter weather opportunities by selected crop
    const filteredWeather = weatherOpportunities.filter((o) =>
        selectedCrop === "All" || o.crop.toLowerCase() === selectedCrop.toLowerCase()
    );

    // Filter contacts
    const filteredContacts = exportContacts.filter((c) => {
        const matchSearch =
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase()) ||
            c.location.toLowerCase().includes(search.toLowerCase());
        const matchCrop =
            selectedCrop === "All" ||
            c.crops.some((cr) => cr.toLowerCase().includes(selectedCrop.toLowerCase()));
        const matchType = selectedType === "All" || c.type === selectedType;
        return matchSearch && matchCrop && matchType;
    });

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-8 py-5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <span className="text-xl font-bold tracking-tight">
                                Agro<span className="text-primary">Intel</span>
                            </span>
                            <p className="text-xs text-muted-foreground leading-none mt-0.5">Export Opportunities Hub</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <PackageCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{partnersLoading ? '…' : filteredContacts.length}</span> export partners
                    {weatherOpportunities.length > 0 && (
                        <>
                            <span className="mx-1 text-muted-foreground/40">·</span>
                            <CloudLightning className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-foreground">{filteredWeather.length}</span> live alerts
                        </>
                    )}
                    {isCached && <span className="text-xs text-muted-foreground/60 ml-1">(cached)</span>}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-1"
                        disabled={refreshing || partnersLoading}
                        onClick={() => fetchPartners(true)}
                        title="Refresh export partners (fetches fresh data)"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            <main className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto space-y-10">

                {/* Hero banner */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 right-8 h-32 w-32 rounded-full border-4 border-white" />
                            <div className="absolute bottom-4 right-32 h-20 w-20 rounded-full border-4 border-white" />
                            <div className="absolute top-12 right-48 h-12 w-12 rounded-full border-4 border-white" />
                        </div>
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Truck className="h-5 w-5 text-emerald-200" />
                                    <span className="text-emerald-200 text-sm font-medium">Global Market Access</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">All Export Opportunities</h1>
                                <p className="text-emerald-100 text-base max-w-lg">
                                    Live weather-driven trade alerts + verified exporters, trade boards, and agri-brokers — your complete export hub.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                                {[
                                    { label: "Export Partners", value: `${exportContacts.length}+` },
                                    { label: "Your Crops", value: `${userCrops.length}` },
                                    { label: "Live Alerts", value: `${weatherOpportunities.length}` },
                                ].map((s) => (
                                    <div key={s.label} className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
                                        <div className="text-2xl font-bold">{s.value}</div>
                                        <div className="text-xs text-emerald-200">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Crop filter (shared across both sections) ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
                    <div className="bg-background rounded-xl border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search exporters, crops, locations…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        {/* Crop pills — dynamic: merge weather crops with a base set */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {["All", ...Array.from(new Set([
                                ...weatherCrops.filter((c) => c !== "All"),
                                "Rice", "Wheat", "Spices", "Fruits", "Vegetables",
                            ]))].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedCrop(c)}
                                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selectedCrop === c
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        {/* Type filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {ALL_TYPES.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedType(t)}
                                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selectedType === t
                                        ? "bg-emerald-600 text-white"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Section 1: Live Weather-Driven Alerts ── */}
                {weatherOpportunities.length > 0 && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <CloudLightning className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Live Weather-Driven Alerts</h2>
                                <p className="text-sm text-muted-foreground">Regions with supply stress — potential price gaps for your crop</p>
                            </div>
                            <span className="ml-auto text-xs text-muted-foreground bg-amber-50 border border-amber-200 text-amber-700 font-semibold px-3 py-1 rounded-full">
                                {filteredWeather.length} alert{filteredWeather.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {filteredWeather.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground border rounded-2xl bg-muted/20">
                                <Wind className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No alerts for this crop filter</p>
                                <p className="text-sm mt-1">Try selecting "All" to see all weather-driven alerts.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredWeather.map((opp, i) => (
                                    <WeatherOppCard key={`${opp.region}-${i}`} opp={opp} index={i} />
                                ))}
                            </div>
                        )}
                    </motion.section>
                )}

                {/* ── Section 2: Export Partner Directory ── */}
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Export Partner Directory</h2>
                            <p className="text-sm text-muted-foreground">Real verified organisations matched to your crops</p>
                        </div>
                        <span className="ml-auto text-xs bg-muted text-muted-foreground font-semibold px-3 py-1 rounded-full">
                            {partnersLoading ? '…' : `${filteredContacts.length} partner${filteredContacts.length !== 1 ? "s" : ""}`}
                        </span>
                    </div>

                    {partnersLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="rounded-xl border p-6 space-y-3 animate-pulse">
                                    <div className="h-5 w-3/4 bg-muted rounded" />
                                    <div className="flex gap-2">
                                        <div className="h-4 w-20 bg-muted rounded-full" />
                                        <div className="h-4 w-16 bg-muted rounded-full" />
                                    </div>
                                    <div className="h-4 w-1/2 bg-muted rounded" />
                                    <div className="h-12 w-full bg-muted rounded-lg" />
                                    <div className="h-4 w-full bg-muted rounded" />
                                    <div className="h-4 w-5/6 bg-muted rounded" />
                                    <div className="flex gap-1.5 mt-2">
                                        <div className="h-5 w-12 bg-muted rounded-full" />
                                        <div className="h-5 w-14 bg-muted rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-lg font-medium">No export partners found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {filteredContacts.map((contact, i) => (
                                <ExportCard key={contact.id} contact={contact} index={i} />
                            ))}
                        </div>
                    )}
                </motion.section>

                {/* Bottom Banner */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                    <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Want to register your produce for export?</h3>
                        <p className="text-sm text-muted-foreground">
                            Visit APEDA's portal to register your farm, get quality certification, and access export incentives.
                        </p>
                    </div>
                    <a href="https://apeda.gov.in" target="_blank" rel="noopener noreferrer">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-6">
                            <Globe className="h-4 w-4" />Visit APEDA Portal
                        </Button>
                    </a>
                </motion.div>
            </main>
        </div>
    );
}
