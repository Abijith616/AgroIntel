import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Leaf, TrendingUp, TrendingDown, Sparkles,
    ChevronRight, ChevronDown, BarChart3, DollarSign,
    Truck, Package, CheckCircle2, Loader2, AlertCircle,
    Globe, Store, Calculator, RefreshCw, ArrowRight,
    Wheat, FlaskConical, Coins
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Market {
    id: string;
    name: string;
    type: "local" | "export";
    state?: string;
    country?: string;
    avgPriceMultiplier: number;
    transportPerKm: number;
}

interface UserCrop {
    id: number;
    name: string;
    phase: string;
    landVolume: number;
    landUnit: string;
    place: string;
    district: string;
    state: string;
}

interface SelectedCropEntry {
    crop: UserCrop;
    quantity: number;
}

interface CropYieldBreakdown {
    cropName: string;
    quantity: number;
    marketPrice: number;
    grossRevenue: number;
    transportCost: number;
    brokerFee: number;
    netRevenue: number;
    roi: number;
}

interface ForecastResult {
    totalGrossRevenue: number;
    totalTransportCost: number;
    totalBrokerFees: number;
    totalNetRevenue: number;
    totalROI: number;
    investmentINR: number;
    cropBreakdown: CropYieldBreakdown[];
    marketName: string;
    marketType: string;
    aiReasoning: string;
    strategy: string;
}

// ── Currencies ────────────────────────────────────────────────────────────────

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "MYR"];
const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$", MYR: "RM",
};

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
    return n.toLocaleString("en-IN");
}

function ROIBadge({ roi }: { roi: number }) {
    const color = roi >= 20 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : roi >= 0 ? "bg-amber-100 text-amber-700 border-amber-200"
            : "bg-red-100 text-red-700 border-red-200";
    return (
        <Badge className={`border text-sm font-bold px-3 py-1 ${color}`}>
            {roi >= 0 ? "+" : ""}{roi}% ROI
        </Badge>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function YieldForecast() {
    const navigate = useNavigate();

    const [userCrops, setUserCrops] = useState<UserCrop[]>([]);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [step, setStep] = useState(1);
    const [selectedCrops, setSelectedCrops] = useState<SelectedCropEntry[]>([]);
    const [investment, setInvestment] = useState("");
    const [currency, setCurrency] = useState("INR");
    const [selectedMarketId, setSelectedMarketId] = useState("");
    const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

    const [forecasting, setForecasting] = useState(false);
    const [result, setResult] = useState<ForecastResult | null>(null);
    const [forecastError, setForecastError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoadingData(true);
            const token = localStorage.getItem("token");
            try {
                const [cropsRes, marketsRes] = await Promise.all([
                    fetch("http://localhost:3000/api/crops", { headers: { Authorization: `Bearer ${token}` } }),
                    fetch("http://localhost:3000/api/yield-forecast/markets", { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (cropsRes.ok) setUserCrops(await cropsRes.json());
                if (marketsRes.ok) {
                    const m = await marketsRes.json();
                    setMarkets(m.markets ?? []);
                }
            } catch { /* silent */ }
            finally { setLoadingData(false); }
        };
        load();
    }, []);

    const toggleCrop = (crop: UserCrop) => {
        setSelectedCrops(prev => {
            const exists = prev.find(e => e.crop.id === crop.id);
            if (exists) return prev.filter(e => e.crop.id !== crop.id);
            return [...prev, { crop, quantity: 10 }];
        });
    };

    const updateQty = (cropId: number, qty: number) => {
        setSelectedCrops(prev => prev.map(e => e.crop.id === cropId ? { ...e, quantity: Math.max(1, qty) } : e));
    };

    const runForecast = async () => {
        setForecasting(true);
        setForecastError(null);
        try {
            const token = localStorage.getItem("token");
            const firstCrop = selectedCrops[0]?.crop;
            const body = {
                crops: selectedCrops.map(e => ({
                    name: e.crop.name,
                    quantity: e.quantity,
                    landArea: e.crop.landVolume,
                    landUnit: e.crop.landUnit,
                    phase: e.crop.phase,
                })),
                totalInvestment: parseFloat(investment) || 0,
                investmentCurrency: currency,
                selectedMarketId,
                farmerState: firstCrop?.state ?? "Kerala",
                farmerDistrict: firstCrop?.district ?? "",
            };
            const res = await fetch("http://localhost:3000/api/yield-forecast/forecast", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Failed to get forecast");
            setResult(await res.json());
            setStep(5);
        } catch (e: any) {
            setForecastError(e.message ?? "Something went wrong");
        } finally {
            setForecasting(false);
        }
    };

    const selectedMarket = markets.find(m => m.id === selectedMarketId);
    const localMarkets = markets.filter(m => m.type === "local");
    const exportMarkets = markets.filter(m => m.type === "export");
    const STEPS = ["Select Crops", "Set Quantities", "Investment", "Choose Market"];

    return (
        <div className="min-h-screen bg-muted/30">
            {/* ── Header ── */}
            <header className="bg-background/80 backdrop-blur-md border-b px-16 py-7 flex items-center gap-6 sticky top-0 z-50">
                <Button variant="ghost" size="icon" className="h-13 w-13 h-12 w-12" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="h-7 w-7" />
                </Button>
                <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                        <BarChart3 className="h-9 w-9" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold leading-none">Yield Forecast</h1>
                        <p className="text-lg text-muted-foreground mt-1.5">AI-powered revenue prediction — select crops, set quantities, choose a market and predict</p>
                    </div>
                </div>
            </header>

            <main className="px-16 py-12 max-w-[1400px] mx-auto space-y-12">

                {/* Loading */}
                {loadingData && (
                    <div className="flex items-center justify-center py-48 gap-5 text-muted-foreground">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <span className="text-2xl">Loading your crops &amp; markets…</span>
                    </div>
                )}

                {!loadingData && (
                    <>
                        {/* ── Step indicator ── */}
                        {step < 5 && (
                            <div className="flex items-center gap-6">
                                {STEPS.map((s, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center h-14 w-14 rounded-full text-xl font-bold border-[3px] transition-all ${step > i + 1
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : step === i + 1
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/30 text-muted-foreground"
                                            }`}>
                                            {step > i + 1 ? <CheckCircle2 className="h-7 w-7" /> : i + 1}
                                        </div>
                                        <span className={`text-xl ${step === i + 1 ? "font-bold text-foreground" : "text-muted-foreground"}`}>{s}</span>
                                        {i < 3 && <ChevronRight className="h-6 w-6 text-muted-foreground/40" />}
                                    </div>
                                ))}
                            </div>
                        )}

                        <AnimatePresence mode="wait">

                            {/* ══ STEP 1: Select Crops ══════════════════════════════════════════════ */}
                            {step === 1 && (
                                <motion.div key="step1" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-8">
                                    <motion.div variants={fadeUp}>
                                        <h2 className="text-5xl font-bold mb-3">Select Crops to Forecast</h2>
                                        <p className="text-xl text-muted-foreground">Choose one or more crops from your active cultivation list.</p>
                                    </motion.div>

                                    {userCrops.length === 0 ? (
                                        <motion.div variants={fadeUp} className="flex flex-col items-center py-32 gap-6 text-center">
                                            <Leaf className="h-20 w-20 text-muted-foreground/30" />
                                            <p className="font-bold text-2xl">No crops found</p>
                                            <p className="text-muted-foreground text-lg">Add crops to your dashboard first to run a forecast.</p>
                                            <Button className="h-12 px-8 text-base" onClick={() => navigate("/add-crop")}>+ Add Crop</Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div variants={fadeUp} className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                                            {userCrops.map(crop => {
                                                const isSelected = selectedCrops.some(e => e.crop.id === crop.id);
                                                return (
                                                    <button
                                                        key={crop.id}
                                                        onClick={() => toggleCrop(crop)}
                                                        className={`text-left p-8 rounded-2xl border-2 transition-all duration-200 ${isSelected
                                                            ? "border-primary bg-primary/5 shadow-md"
                                                            : "border-border hover:border-primary/40 bg-background hover:bg-muted/30 hover:shadow-sm"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-4 mb-3">
                                                                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                                                        <Wheat className="h-7 w-7 text-amber-600" />
                                                                    </div>
                                                                    <span className="font-bold text-2xl">{crop.name}</span>
                                                                </div>
                                                                <p className="text-lg text-muted-foreground">{crop.phase} &bull; {crop.landVolume} {crop.landUnit}</p>
                                                                <p className="text-base text-muted-foreground mt-1">{crop.place}, {crop.district}</p>
                                                            </div>
                                                            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                                                {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}

                                    <motion.div variants={fadeUp}>
                                        <Button
                                            className="h-16 px-14 text-xl gap-3"
                                            disabled={selectedCrops.length === 0}
                                            onClick={() => setStep(2)}
                                        >
                                            Continue with {selectedCrops.length} crop{selectedCrops.length !== 1 ? "s" : ""}
                                            <ArrowRight className="h-6 w-6" />
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ══ STEP 2: Quantities ════════════════════════════════════════════════ */}
                            {step === 2 && (
                                <motion.div key="step2" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-8">
                                    <motion.div variants={fadeUp}>
                                        <h2 className="text-5xl font-bold mb-3">Set Harvest Quantities</h2>
                                        <p className="text-xl text-muted-foreground">Enter the expected quantity (in quintals) you plan to sell for each crop.</p>
                                    </motion.div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                        {selectedCrops.map(entry => (
                                            <motion.div key={entry.crop.id} variants={fadeUp}>
                                                <Card className="shadow-sm">
                                                    <CardContent className="pt-9 pb-9 px-10">
                                                        <div className="flex items-center justify-between gap-6">
                                                            <div className="flex items-center gap-5">
                                                                <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                                                                    <Package className="h-9 w-9 text-amber-600" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-2xl">{entry.crop.name}</span>
                                                                    <p className="text-lg text-muted-foreground mt-1">{entry.crop.phase} &bull; {entry.crop.landVolume} {entry.crop.landUnit}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-5 shrink-0">
                                                                <label className="text-lg text-muted-foreground font-medium">Qty (qt)</label>
                                                                <div className="flex items-center border-2 rounded-xl overflow-hidden">
                                                                    <button
                                                                        className="px-6 py-4 bg-muted hover:bg-muted/80 text-2xl font-bold leading-none"
                                                                        onClick={() => updateQty(entry.crop.id, entry.quantity - 1)}
                                                                    >−</button>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={entry.quantity}
                                                                        onChange={e => updateQty(entry.crop.id, parseInt(e.target.value) || 1)}
                                                                        className="w-28 text-center py-4 text-2xl font-bold bg-background border-0 outline-none"
                                                                    />
                                                                    <button
                                                                        className="px-6 py-4 bg-muted hover:bg-muted/80 text-2xl font-bold leading-none"
                                                                        onClick={() => updateQty(entry.crop.id, entry.quantity + 1)}
                                                                    >+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <motion.div variants={fadeUp} className="flex gap-5">
                                        <Button variant="outline" className="h-16 px-12 text-xl" onClick={() => setStep(1)}>← Back</Button>
                                        <Button className="h-16 px-12 text-xl gap-3" onClick={() => setStep(3)}>
                                            Next: Investment <ArrowRight className="h-6 w-6" />
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ══ STEP 3: Investment ════════════════════════════════════════════════ */}
                            {step === 3 && (
                                <motion.div key="step3" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-8">
                                    <motion.div variants={fadeUp}>
                                        <h2 className="text-5xl font-bold mb-3">Total Investment</h2>
                                        <p className="text-xl text-muted-foreground">Enter the total money you've invested — seeds, fertiliser, labour, irrigation, etc.</p>
                                    </motion.div>

                                    <motion.div variants={fadeUp}>
                                        <Card className="shadow-sm">
                                            <CardContent className="pt-12 pb-12 px-12">
                                                <label className="block text-xl font-semibold text-foreground mb-5">Investment Amount</label>
                                                <div className="flex gap-4 items-center">
                                                    <select
                                                        value={currency}
                                                        onChange={e => setCurrency(e.target.value)}
                                                        className="border-2 rounded-xl px-6 py-5 bg-background text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
                                                    >
                                                        {CURRENCIES.map(c => (
                                                            <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        id="investment-input"
                                                        type="number"
                                                        min="0"
                                                        placeholder="e.g. 50000"
                                                        value={investment}
                                                        onChange={e => setInvestment(e.target.value)}
                                                        className="flex-1 border-2 rounded-xl px-7 py-5 text-3xl font-bold bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                    />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-4">Accepted: INR, USD, EUR, GBP, AED, SGD, MYR — converted to ₹ automatically.</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="flex gap-5">
                                        <Button variant="outline" className="h-16 px-12 text-xl" onClick={() => setStep(2)}>← Back</Button>
                                        <Button
                                            className="h-16 px-12 text-xl gap-3"
                                            disabled={!investment || parseFloat(investment) <= 0}
                                            onClick={() => setStep(4)}
                                        >
                                            Next: Choose Market <ArrowRight className="h-6 w-6" />
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ══ STEP 4: Market ════════════════════════════════════════════════════ */}
                            {step === 4 && (
                                <motion.div key="step4" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-8">
                                    <motion.div variants={fadeUp}>
                                        <h2 className="text-5xl font-bold mb-3">Choose Target Market</h2>
                                        <p className="text-xl text-muted-foreground">Select where you want to sell. Export markets offer higher prices but include broker fees.</p>
                                    </motion.div>

                                    {/* Two-column layout: dropdown + market info */}
                                    <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {/* Left: dropdown */}
                                        <div className="space-y-5">
                                            <p className="text-base font-semibold text-muted-foreground">Select Market</p>
                                            <div className="relative">
                                                <button
                                                    id="market-dropdown-trigger"
                                                    onClick={() => setMarketDropdownOpen(!marketDropdownOpen)}
                                                    className="w-full flex items-center justify-between px-7 py-6 rounded-2xl border-2 bg-background text-left transition-all hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    {selectedMarket ? (
                                                        <div className="flex items-center gap-5">
                                                            <div className={`h-13 w-13 h-12 w-12 rounded-xl flex items-center justify-center ${selectedMarket.type === "export" ? "bg-indigo-100" : "bg-emerald-100"}`}>
                                                                {selectedMarket.type === "export"
                                                                    ? <Globe className="h-7 w-7 text-indigo-600" />
                                                                    : <Store className="h-7 w-7 text-emerald-600" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-xl">{selectedMarket.name}</p>
                                                                <p className="text-base text-muted-foreground">{selectedMarket.type === "export" ? "Export" : "Domestic"} · {selectedMarket.type === "export" ? selectedMarket.country : selectedMarket.state}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xl">Select a market…</span>
                                                    )}
                                                    <ChevronDown className={`h-6 w-6 text-muted-foreground transition-transform ${marketDropdownOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {marketDropdownOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="absolute z-30 top-full mt-2 w-full bg-background border-2 rounded-2xl shadow-2xl overflow-hidden"
                                                        >
                                                            <div className="max-h-[420px] overflow-y-auto">
                                                                {/* Domestic */}
                                                                <div className="px-5 py-3 bg-muted/50 border-b sticky top-0">
                                                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                                        <Store className="h-4 w-4" /> Domestic Markets
                                                                    </p>
                                                                </div>
                                                                {localMarkets.map(m => (
                                                                    <button
                                                                        key={m.id}
                                                                        onClick={() => { setSelectedMarketId(m.id); setMarketDropdownOpen(false); }}
                                                                        className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b ${selectedMarketId === m.id ? "bg-primary/5" : ""}`}
                                                                    >
                                                                        <Store className="h-5 w-5 text-emerald-600 shrink-0" />
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-base">{m.name}</p>
                                                                            <p className="text-sm text-muted-foreground">{m.state} &bull; ~{Math.round(m.avgPriceMultiplier * 100 - 100)}% above MSP</p>
                                                                        </div>
                                                                        {selectedMarketId === m.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />}
                                                                    </button>
                                                                ))}
                                                                {/* Export */}
                                                                <div className="px-5 py-3 bg-indigo-50/70 border-b border-t sticky top-0">
                                                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-2">
                                                                        <Globe className="h-4 w-4" /> Export Markets (incl. broker fees)
                                                                    </p>
                                                                </div>
                                                                {exportMarkets.map(m => (
                                                                    <button
                                                                        key={m.id}
                                                                        onClick={() => { setSelectedMarketId(m.id); setMarketDropdownOpen(false); }}
                                                                        className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors border-b ${selectedMarketId === m.id ? "bg-primary/5" : ""}`}
                                                                    >
                                                                        <Globe className="h-5 w-5 text-indigo-600 shrink-0" />
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-base">{m.name}</p>
                                                                            <p className="text-sm text-muted-foreground">{m.country} &bull; ~{Math.round(m.avgPriceMultiplier * 100 - 100)}% above MSP + 7% broker</p>
                                                                        </div>
                                                                        {selectedMarketId === m.id && <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Right: market stats */}
                                        <div>
                                            {selectedMarket ? (
                                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                                    <div className={`rounded-2xl p-7 border-2 h-full ${selectedMarket.type === "export" ? "bg-indigo-50/60 border-indigo-200" : "bg-emerald-50/60 border-emerald-200"}`}>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            {selectedMarket.type === "export" ? <Globe className="h-7 w-7 text-indigo-600" /> : <Store className="h-7 w-7 text-emerald-600" />}
                                                            <span className="font-bold text-xl">{selectedMarket.name}</span>
                                                            <Badge className={`text-sm px-3 py-1 border ${selectedMarket.type === "export" ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                                                                {selectedMarket.type === "export" ? "Export" : "Domestic"}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-5">
                                                            <div className="bg-background/80 rounded-xl p-4">
                                                                <p className="text-sm text-muted-foreground mb-1">Price vs MSP</p>
                                                                <p className="font-bold text-xl">{selectedMarket.avgPriceMultiplier}×</p>
                                                                <p className="text-sm text-muted-foreground">+{Math.round(selectedMarket.avgPriceMultiplier * 100 - 100)}% premium</p>
                                                            </div>
                                                            <div className="bg-background/80 rounded-xl p-4">
                                                                <p className="text-sm text-muted-foreground mb-1">Transport Rate</p>
                                                                <p className="font-bold text-xl">₹{selectedMarket.transportPerKm}</p>
                                                                <p className="text-sm text-muted-foreground">per km per quintal</p>
                                                            </div>
                                                            {selectedMarket.type === "export" && (
                                                                <div className="bg-indigo-100/60 rounded-xl p-4">
                                                                    <p className="text-sm text-muted-foreground mb-1">Avg Broker Fee</p>
                                                                    <p className="font-bold text-xl text-indigo-700">7%</p>
                                                                    <p className="text-sm text-muted-foreground">of gross revenue</p>
                                                                </div>
                                                            )}
                                                            <div className="bg-background/80 rounded-xl p-4">
                                                                <p className="text-sm text-muted-foreground mb-1">Est. Distance</p>
                                                                <p className="font-bold text-xl">{selectedMarket.type === "export" ? "~600km" : "~200km"}</p>
                                                                <p className="text-sm text-muted-foreground">{selectedMarket.type === "export" ? "to port" : "to market"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="h-full border-2 border-dashed rounded-2xl flex items-center justify-center text-muted-foreground text-lg">
                                                    Select a market to see details
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {forecastError && (
                                        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
                                            <AlertCircle className="h-5 w-5 shrink-0" />
                                            {forecastError}
                                        </div>
                                    )}

                                    <motion.div variants={fadeUp} className="flex gap-5">
                                        <Button variant="outline" className="h-16 px-12 text-xl" onClick={() => setStep(3)}>← Back</Button>
                                        <Button
                                            id="predict-yield-btn"
                                            className="h-16 px-14 text-xl gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                            disabled={!selectedMarketId || forecasting}
                                            onClick={runForecast}
                                        >
                                            {forecasting ? (
                                                <><Loader2 className="h-5 w-5 animate-spin" /> Predicting…</>
                                            ) : (
                                                <><Sparkles className="h-5 w-5" /> Predict Yield &amp; Revenue</>
                                            )}
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}

                            {/* ══ STEP 5: Results ══════════════════════════════════════════════════ */}
                            {step === 5 && result && (
                                <motion.div key="step5" variants={stagger} initial="hidden" animate="show" className="space-y-8">

                                    {/* Hero banner */}
                                    <motion.div variants={fadeUp}>
                                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-10 shadow-2xl">
                                            <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 h-32 w-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Sparkles className="h-6 w-6 text-emerald-200" />
                                                    <p className="text-emerald-100 text-base font-medium uppercase tracking-widest">AgroIntel Yield Forecast</p>
                                                </div>
                                                <h2 className="text-6xl font-extrabold mb-2 tracking-tight">₹{fmt(result.totalNetRevenue)}</h2>
                                                <p className="text-emerald-100 text-xl mb-8">Estimated net revenue after transport &amp; broker deductions</p>

                                                <div className="grid grid-cols-3 gap-6">
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                                                        <p className="text-sm text-emerald-200 mb-1 uppercase tracking-wide">Gross Revenue</p>
                                                        <p className="font-extrabold text-3xl">₹{fmt(result.totalGrossRevenue)}</p>
                                                    </div>
                                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center">
                                                        <p className="text-sm text-emerald-200 mb-1 uppercase tracking-wide">Total Deductions</p>
                                                        <p className="font-extrabold text-3xl text-red-200">-₹{fmt(result.totalTransportCost + result.totalBrokerFees)}</p>
                                                    </div>
                                                    <div className={`rounded-2xl p-5 text-center backdrop-blur-sm ${result.totalROI >= 0 ? "bg-white/20" : "bg-red-500/30"}`}>
                                                        <p className="text-sm text-emerald-200 mb-1 uppercase tracking-wide">Overall ROI</p>
                                                        <p className="font-extrabold text-3xl">{result.totalROI >= 0 ? "+" : ""}{result.totalROI}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Strategy + verdict row */}
                                    <motion.div variants={fadeUp} className="flex items-center gap-5 flex-wrap">
                                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border text-base px-4 py-2">
                                            {result.marketType === "export" ? <Globe className="h-4 w-4 mr-2 inline" /> : <Store className="h-4 w-4 mr-2 inline" />}
                                            {result.strategy}
                                        </Badge>
                                        <span className="text-base text-muted-foreground">Your Investment: ₹{fmt(result.investmentINR)}</span>
                                        {result.totalROI >= 0
                                            ? <span className="text-emerald-600 font-bold text-base flex items-center gap-2"><TrendingUp className="h-5 w-5" />Profitable</span>
                                            : <span className="text-red-500 font-bold text-base flex items-center gap-2"><TrendingDown className="h-5 w-5" />Below breakeven</span>
                                        }
                                    </motion.div>

                                    {/* Two columns: AI Reasoning + Cost Breakdown */}
                                    <motion.div variants={fadeUp} className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                                        {/* AI Reasoning */}
                                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                                    <Sparkles className="h-6 w-6" />
                                                </div>
                                                <p className="font-bold text-lg text-indigo-100 uppercase tracking-wide">AgroIntel Reasoning</p>
                                            </div>
                                            <p className="text-base leading-relaxed whitespace-pre-line">{result.aiReasoning}</p>
                                        </div>

                                        {/* Cost Breakdown */}
                                        <Card className="shadow-sm">
                                            <CardHeader className="pb-4">
                                                <CardTitle className="flex items-center gap-3 text-xl">
                                                    <Calculator className="h-6 w-6 text-blue-600" />
                                                    Revenue Breakdown
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex justify-between items-center py-3 border-b">
                                                    <span className="flex items-center gap-3 text-base"><Coins className="h-5 w-5 text-emerald-600" />Gross Revenue</span>
                                                    <span className="font-bold text-xl text-emerald-700">+₹{fmt(result.totalGrossRevenue)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 border-b">
                                                    <span className="flex items-center gap-3 text-base"><Truck className="h-5 w-5 text-amber-600" />Transport ({result.marketType === "export" ? "600km" : "200km"})</span>
                                                    <span className="font-bold text-xl text-amber-700">-₹{fmt(result.totalTransportCost)}</span>
                                                </div>
                                                {result.totalBrokerFees > 0 && (
                                                    <div className="flex justify-between items-center py-3 border-b">
                                                        <span className="flex items-center gap-3 text-base"><Globe className="h-5 w-5 text-indigo-600" />Export Broker Fees (7%)</span>
                                                        <span className="font-bold text-xl text-indigo-700">-₹{fmt(result.totalBrokerFees)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center py-3 border-b">
                                                    <span className="flex items-center gap-3 text-base"><DollarSign className="h-5 w-5 text-slate-600" />Your Investment</span>
                                                    <span className="font-bold text-xl text-slate-700">₹{fmt(result.investmentINR)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-4 bg-muted/30 rounded-xl px-4 mt-2">
                                                    <span className="flex items-center gap-3 font-bold text-lg"><BarChart3 className="h-6 w-6 text-primary" />Net Revenue</span>
                                                    <div className="text-right">
                                                        <span className={`text-3xl font-extrabold ${result.totalNetRevenue >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                                            ₹{fmt(result.totalNetRevenue)}
                                                        </span>
                                                        <span className={`ml-3 text-base font-bold ${result.totalROI >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                                            ({result.totalROI >= 0 ? "+" : ""}{result.totalROI}% ROI)
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>

                                    {/* Per-crop breakdown > 1 crop */}
                                    {result.cropBreakdown.length > 1 && (
                                        <motion.div variants={fadeUp}>
                                            <Card className="shadow-sm">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="flex items-center gap-3 text-xl">
                                                        <Wheat className="h-6 w-6 text-amber-600" />
                                                        Individual Crop Yields
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                                        {result.cropBreakdown.map((c, i) => (
                                                            <div key={i} className="p-6 bg-muted/20 rounded-2xl border">
                                                                <div className="flex items-center justify-between mb-5">
                                                                    <div>
                                                                        <h4 className="font-bold text-xl">{c.cropName}</h4>
                                                                        <p className="text-sm text-muted-foreground mt-1">{c.quantity} quintals @ ₹{fmt(c.marketPrice)}/qt</p>
                                                                    </div>
                                                                    <ROIBadge roi={c.roi} />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {[
                                                                        { label: "Gross", val: `₹${fmt(c.grossRevenue)}`, color: "text-emerald-700" },
                                                                        { label: "Transport", val: `-₹${fmt(c.transportCost)}`, color: "text-amber-700" },
                                                                        ...(c.brokerFee > 0 ? [{ label: "Broker", val: `-₹${fmt(c.brokerFee)}`, color: "text-indigo-700" }] : []),
                                                                        { label: "Net", val: `₹${fmt(c.netRevenue)}`, color: c.netRevenue >= 0 ? "text-primary" : "text-red-600" },
                                                                    ].map((item, idx) => (
                                                                        <div key={idx} className="bg-background rounded-xl p-4 text-center">
                                                                            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                                                                            <p className={`font-bold text-lg ${item.color}`}>{item.val}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}

                                    {/* Single crop detail */}
                                    {result.cropBreakdown.length === 1 && (
                                        <motion.div variants={fadeUp}>
                                            <Card className="shadow-sm border-primary/20">
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="flex items-center gap-3 text-xl">
                                                        <FlaskConical className="h-6 w-6 text-primary" />
                                                        {result.cropBreakdown[0].cropName} — Detailed Breakdown
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                                                        {[
                                                            { label: "Market Price", value: `₹${fmt(result.cropBreakdown[0].marketPrice)}/qt`, color: "text-foreground" },
                                                            { label: "Quantity", value: `${result.cropBreakdown[0].quantity} quintals`, color: "text-foreground" },
                                                            { label: "Gross Revenue", value: `₹${fmt(result.cropBreakdown[0].grossRevenue)}`, color: "text-emerald-700" },
                                                            { label: "Transport Cost", value: `-₹${fmt(result.cropBreakdown[0].transportCost)}`, color: "text-amber-700" },
                                                            ...(result.cropBreakdown[0].brokerFee > 0 ? [{ label: "Broker Fee (7%)", value: `-₹${fmt(result.cropBreakdown[0].brokerFee)}`, color: "text-indigo-700" }] : []),
                                                            { label: "Net Revenue", value: `₹${fmt(result.cropBreakdown[0].netRevenue)}`, color: result.cropBreakdown[0].netRevenue >= 0 ? "text-primary" : "text-red-600" },
                                                        ].map((item, idx) => (
                                                            <div key={idx} className="bg-muted/30 rounded-2xl p-5 text-center">
                                                                <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
                                                                <p className={`font-extrabold text-xl ${item.color}`}>{item.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}

                                    {/* Action buttons */}
                                    <motion.div variants={fadeUp} className="flex gap-4 flex-wrap">
                                        <Button variant="outline" className="h-12 px-7 text-base gap-2"
                                            onClick={() => { setResult(null); setStep(4); }}>
                                            <RefreshCw className="h-5 w-5" /> Change Market
                                        </Button>
                                        <Button variant="outline" className="h-12 px-7 text-base"
                                            onClick={() => { setResult(null); setStep(1); setSelectedCrops([]); setInvestment(""); setSelectedMarketId(""); }}>
                                            New Forecast
                                        </Button>
                                        <Button className="h-12 px-7 text-base gap-2 ml-auto" onClick={() => navigate("/market-opportunities")}>
                                            View Market Opportunities <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </motion.div>

                                    <motion.div variants={fadeUp} className="text-center text-sm text-muted-foreground pb-6">
                                        Prices are MSP-anchored estimates. Transport costs estimated at ₹{selectedMarket?.transportPerKm ?? 1.5}/km per quintal. Export broker fee avg 7%.
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
}
