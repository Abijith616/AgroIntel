import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Brain, Leaf, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle2, Zap, BarChart3, Globe,
    MapPin, Sprout, Clock, ShieldAlert, RefreshCw,
    Star, CloudRain, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CropVerdict {
    cropName: string;
    action: "Sell Now" | "Hold" | "Process & Sell" | "Monitor";
    actionColor: "green" | "orange" | "blue" | "yellow";
    localPrice: number;
    msp: number;
    priceDiffFromMSP: string;
    reasoning: string;
    riskLevel: "Low" | "Medium" | "High";
    bestTimeToSell: string;
}

interface SwitchCrop {
    name: string;
    why: string;
    expectedReturn: string;
    season: string;
    difficulty: "Easy" | "Moderate" | "Expert";
    msp: string;
    demandTrend: "Rising" | "Stable" | "Declining";
}

interface AIReport {
    overallVerdict: "Excellent" | "Good" | "Caution" | "Act Now";
    overallVerdictColor: "green" | "blue" | "orange" | "red";
    executiveSummary: string;
    cropVerdicts: CropVerdict[];
    topCropsToSwitch: SwitchCrop[];
    globalMarketInsight: string;
    localMarketInsight: string;
    immediateActions: string[];
    keyRisks: string[];
    weatherAdvisory: string;
    generatedAt: string;
    dataSource: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VERDICT_STYLES = {
    Excellent: { gradient: "from-emerald-500 via-green-500 to-teal-600", icon: CheckCircle2 },
    Good: { gradient: "from-blue-500 via-indigo-500 to-violet-600", icon: TrendingUp },
    Caution: { gradient: "from-amber-400 via-orange-500 to-red-500", icon: AlertTriangle },
    "Act Now": { gradient: "from-red-500 via-rose-500 to-pink-600", icon: Zap },
};

const ACTION_PILL: Record<string, { bg: string; text: string }> = {
    "Sell Now": { bg: "bg-emerald-500", text: "text-white" },
    "Hold": { bg: "bg-amber-500", text: "text-white" },
    "Process & Sell": { bg: "bg-blue-500", text: "text-white" },
    "Monitor": { bg: "bg-slate-400", text: "text-white" },
};

const CARD_ACCENT: Record<string, string> = {
    "Sell Now": "border-l-emerald-500",
    "Hold": "border-l-amber-500",
    "Process & Sell": "border-l-blue-500",
    "Monitor": "border-l-slate-300",
};

const RISK_BADGE: Record<string, string> = {
    Low: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Medium: "bg-amber-100  text-amber-700  border border-amber-200",
    High: "bg-red-100   text-red-700   border border-red-200",
};

const DIFFICULTY_BADGE: Record<string, string> = {
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderate: "bg-amber-50  text-amber-700  border-amber-200",
    Expert: "bg-red-50   text-red-700   border-red-200",
};

const DEMAND_EL: Record<string, React.ReactElement> = {
    Rising: <span className="flex items-center gap-1 text-emerald-600 font-semibold text-sm"><TrendingUp className="h-4 w-4" />Rising</span>,
    Stable: <span className="flex items-center gap-1 text-blue-500   font-semibold text-sm"><BarChart3 className="h-4 w-4" />Stable</span>,
    Declining: <span className="flex items-center gap-1 text-red-500    font-semibold text-sm"><TrendingDown className="h-4 w-4" />Declining</span>,
};

// ─── Loading ──────────────────────────────────────────────────────────────────

const STEPS = [
    "Connecting to AgroIntel AI …",
    "Searching live market data …",
    "Analyzing global commodity trends …",
    "Evaluating your crops …",
    "Identifying switching opportunities …",
    "Crafting personalised advice …",
    "Almost done …",
];

function LoadingScreen() {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2500);
        return () => clearInterval(id);
    }, []);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8">
            <div className="relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
                <div className="relative h-36 w-36 rounded-full bg-indigo-600/80 flex items-center justify-center shadow-2xl">
                    <Brain style={{ height: 72, width: 72 }} className="text-white animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-3">
                <h2 className="text-5xl font-bold">AgroIntel AI</h2>
                <p className="text-indigo-200 text-xl">Generating your personalised market report…</p>
            </div>
            <div className="space-y-3 w-full max-w-lg">
                {STEPS.map((s, i) => (
                    <div key={s} className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500
                        ${i === step ? "bg-white/10 text-white" : i < step ? "text-indigo-400" : "text-slate-600"}`}>
                        {i < step
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                            : i === step
                                ? <div className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-white animate-spin shrink-0" />
                                : <div className="h-5 w-5 rounded-full border border-slate-600 shrink-0" />}
                        <span className="text-base">{s}</span>
                    </div>
                ))}
            </div>
            <p className="text-slate-500 text-base">This may take 15–30 seconds. Powered by AgroIntel AI.</p>
        </div>
    );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
    return (
        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-6">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </span>
            {children}
        </h2>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MarketAIReport() {
    const navigate = useNavigate();
    const [report, setReport] = useState<AIReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [crops, setCrops] = useState<any[]>([]);
    const [cropsLoaded, setCropsLoaded] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }
        fetch("http://localhost:3000/api/crops", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { setCrops(d); setCropsLoaded(true); })
            .catch(() => setCropsLoaded(true));
    }, [navigate]);

    const generateReport = useCallback(async () => {
        if (!crops.length) { setError("No crops found. Add crops first."); return; }
        try {
            setLoading(true); setError(null); setReport(null);
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3000/api/ai-report", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ crops }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed"); }
            setReport(await res.json());
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally { setLoading(false); }
    }, [crops]);

    useEffect(() => {
        if (cropsLoaded && crops.length > 0 && !report && !loading) generateReport();
    }, [cropsLoaded]);

    if (loading) return <LoadingScreen />;

    const vs = report ? VERDICT_STYLES[report.overallVerdict] : null;
    const VIcon = vs?.icon;
    const fade = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
    const list = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

    return (
        <div className="min-h-screen bg-slate-100">

            {/* ── Sticky Nav ───────────────────────────────────────────────── */}
            <header className="bg-white border-b sticky top-0 z-50 px-10 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-base font-medium"
                    >
                        <ArrowLeft className="h-5 w-5" /> Dashboard
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                            <Brain className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-xl text-slate-800">Market AI Report</span>
                    </div>
                    {report && (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium px-3 py-1 rounded-full">
                            <Activity className="h-3.5 w-3.5" /> Live
                        </span>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={generateReport}
                    disabled={loading || !crops.length}
                    className="gap-2 text-base px-5 py-2.5 h-auto"
                >
                    <RefreshCw className="h-5 w-5" /> Regenerate
                </Button>
            </header>

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="px-10 xl:px-16 2xl:px-24 py-10">

                {/* Error */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center gap-6 py-40 text-center">
                        <AlertTriangle className="h-24 w-24 text-amber-400" />
                        <p className="text-2xl font-semibold text-red-600">{error}</p>
                        <Button size="lg" onClick={generateReport} className="text-base px-8">Try Again</Button>
                    </div>
                )}

                {/* No crops */}
                {cropsLoaded && !crops.length && !loading && (
                    <div className="flex flex-col items-center justify-center gap-6 py-40 text-center">
                        <Leaf className="h-24 w-24 text-slate-300" />
                        <p className="text-xl text-slate-500">No crops found. Add your crops first to get an AI report.</p>
                        <Button size="lg" onClick={() => navigate("/add-crop")} className="text-base px-8">Add Crop</Button>
                    </div>
                )}

                {report && vs && VIcon && (
                    <AnimatePresence>
                        <motion.div variants={list} initial="hidden" animate="show" className="space-y-10">

                            {/* ── 1. Verdict Banner — full width ── */}
                            <motion.div variants={fade}>
                                <div className={`w-full rounded-3xl bg-gradient-to-r ${vs.gradient} p-10 xl:p-12 text-white shadow-2xl overflow-hidden relative`}>
                                    {/* giant watermark icon */}
                                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                                        <VIcon className="h-80 w-80 -mt-10 -mr-10" />
                                    </div>
                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
                                        {/* Left: verdict + summary */}
                                        <div className="flex-1">
                                            <p className="text-white/70 text-sm uppercase tracking-widest font-semibold mb-3">Overall Verdict</p>
                                            <div className="flex items-center gap-4 mb-5">
                                                <VIcon className="h-12 w-12 drop-shadow" />
                                                <span className="text-6xl font-extrabold tracking-tight">{report.overallVerdict}</span>
                                            </div>
                                            <p className="text-white/90 text-xl leading-relaxed max-w-3xl">{report.executiveSummary}</p>
                                        </div>
                                        {/* Right: meta */}
                                        <div className="shrink-0 flex flex-col gap-1 bg-white/15 backdrop-blur-sm rounded-2xl px-8 py-6 text-right min-w-[200px]">
                                            <p className="text-white/60 text-sm">Generated at</p>
                                            <p className="text-white text-3xl font-extrabold">
                                                {new Date(report.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                            <p className="text-white/60 text-sm mt-3">Source</p>
                                            <p className="text-white/80 text-sm leading-snug">{report.dataSource}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ── 2. Immediate Actions ── */}
                            <motion.section variants={fade}>
                                <SectionTitle icon={Zap} color="bg-amber-500">Do These This Week</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {report.immediateActions.map((action, i) => (
                                        <div key={i} className="flex items-start gap-4 p-7 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-lg">{i + 1}</span>
                                            <p className="text-base text-slate-700 leading-relaxed pt-1">{action}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>

                            {/* ── 3. Crop Analysis ── */}
                            <motion.section variants={fade}>
                                <SectionTitle icon={Sprout} color="bg-green-500">Your Crop Analysis</SectionTitle>
                                <div className="space-y-5">
                                    {report.cropVerdicts.map((crop, i) => {
                                        const pill = ACTION_PILL[crop.action] ?? ACTION_PILL["Monitor"];
                                        const accent = CARD_ACCENT[crop.action] ?? CARD_ACCENT["Monitor"];
                                        return (
                                            <motion.div key={i} variants={fade}
                                                className={`bg-white rounded-2xl shadow-sm border border-l-4 ${accent} overflow-hidden`}>
                                                <div className="p-8 xl:p-10">
                                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
                                                        <div>
                                                            <h3 className="text-2xl font-bold text-slate-800">{crop.cropName}</h3>
                                                            <p className="text-base text-slate-500 mt-2 max-w-3xl leading-relaxed">{crop.reasoning}</p>
                                                        </div>
                                                        <span className={`shrink-0 px-6 py-3 rounded-xl font-bold text-lg ${pill.bg} ${pill.text}`}>
                                                            {crop.action}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                                                        <div className="bg-slate-50 rounded-2xl p-6 border">
                                                            <p className="text-sm text-slate-400 mb-2">Local Price</p>
                                                            <p className="text-3xl font-extrabold text-slate-800">₹{crop.localPrice.toLocaleString("en-IN")}</p>
                                                            <p className="text-sm text-slate-400 mt-1">/quintal</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-2xl p-6 border">
                                                            <p className="text-sm text-slate-400 mb-2">vs MSP</p>
                                                            <p className={`text-2xl font-extrabold ${crop.priceDiffFromMSP.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                                                                {crop.priceDiffFromMSP}
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-1">MSP ₹{crop.msp.toLocaleString("en-IN")}</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-2xl p-6 border">
                                                            <p className="text-sm text-slate-400 mb-2">Best Time to Sell</p>
                                                            <p className="text-base font-bold text-slate-700 flex items-center gap-2 mt-2">
                                                                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                                                                {crop.bestTimeToSell}
                                                            </p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-2xl p-6 border">
                                                            <p className="text-sm text-slate-400 mb-2">Risk Level</p>
                                                            <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-full mt-2 ${RISK_BADGE[crop.riskLevel]}`}>
                                                                {crop.riskLevel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.section>

                            {/* ── 4. Crops Worth Switching ── */}
                            <motion.section variants={fade}>
                                <SectionTitle icon={Star} color="bg-indigo-500">Crops Worth Switching To</SectionTitle>
                                <p className="text-base text-slate-500 -mt-2 mb-6">Based on your region, climate, and market trends — consider these for your next season</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {report.topCropsToSwitch.map((crop, i) => (
                                        <motion.div key={i} variants={fade}
                                            className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all p-7">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h4 className="font-bold text-xl text-slate-800">{crop.name}</h4>
                                                    <p className="text-sm text-slate-400 mt-1">{crop.season}</p>
                                                </div>
                                                <span className={`text-sm px-3 py-1.5 rounded-xl border font-semibold ${DIFFICULTY_BADGE[crop.difficulty]}`}>
                                                    {crop.difficulty}
                                                </span>
                                            </div>
                                            <p className="text-base text-slate-500 mb-6 leading-relaxed">{crop.why}</p>
                                            <div className="border-t pt-5 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-400">Expected Return</span>
                                                    <span className="text-base font-extrabold text-emerald-600">{crop.expectedReturn}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-400">MSP</span>
                                                    <span className="text-base font-bold text-slate-700">{crop.msp}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-slate-400">Demand</span>
                                                    {DEMAND_EL[crop.demandTrend]}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>

                            {/* ── 5. Market Intelligence + Weather + Risks — 3-col row ── */}
                            <motion.section variants={fade}>
                                <SectionTitle icon={Globe} color="bg-blue-500">Market Intelligence & Advisories</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {/* Global Market */}
                                    <div className="bg-white rounded-2xl shadow-sm border p-7">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Globe className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800">Global Market</h3>
                                        </div>
                                        <p className="text-base text-slate-500 leading-relaxed">{report.globalMarketInsight}</p>
                                    </div>
                                    {/* Local Market */}
                                    <div className="bg-white rounded-2xl shadow-sm border p-7">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <MapPin className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800">Local / India Market</h3>
                                        </div>
                                        <p className="text-base text-slate-500 leading-relaxed">{report.localMarketInsight}</p>
                                    </div>
                                    {/* Weather */}
                                    <div className="bg-blue-50 rounded-2xl border border-blue-100 p-7">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-blue-200 flex items-center justify-center">
                                                <CloudRain className="h-5 w-5 text-blue-700" />
                                            </div>
                                            <h3 className="font-bold text-lg text-blue-900">Weather Advisory</h3>
                                        </div>
                                        <p className="text-base text-blue-700 leading-relaxed">{report.weatherAdvisory}</p>
                                    </div>
                                </div>
                            </motion.section>

                            {/* ── 6. Key Risks ── */}
                            <motion.section variants={fade}>
                                <SectionTitle icon={ShieldAlert} color="bg-red-500">Risks to Watch</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {report.keyRisks.map((risk, i) => (
                                        <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-red-100 shadow-sm">
                                            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                            <p className="text-base text-slate-700 leading-relaxed">{risk}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>



                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
