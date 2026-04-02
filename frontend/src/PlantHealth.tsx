import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Leaf, ArrowLeft, Thermometer, Droplets, CloudRain,
    AlertTriangle, CheckCircle2, AlertCircle, RefreshCw, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthTip {
    title: string;
    tip: string;
    urgency: "High" | "Medium" | "Low";
    category: string;
    icon: string;
}

interface PlantHealthData {
    crop: {
        id: number;
        name: string;
        phase: string;
        landVolume: number;
        landUnit: string;
        state: string;
        district: string;
        place: string;
    };
    weather: {
        temperature: number;
        humidity: number;
        rain: number;
        maxTemp: number;
        minTemp: number;
    };
    report: {
        overallStatus: "Healthy" | "Needs Attention" | "Critical";
        statusColor: "green" | "orange" | "red";
        summary: string;
        tips: HealthTip[];
        weatherNote: string;
        nextInspectionDate: string;
        generatedAt: string;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig = {
    Healthy: {
        icon: CheckCircle2,
        bg: "bg-emerald-50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
        accent: "text-emerald-600",
        dot: "bg-emerald-500",
        iconBg: "bg-emerald-100",
    },
    "Needs Attention": {
        icon: AlertCircle,
        bg: "bg-amber-50 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
        accent: "text-amber-600",
        dot: "bg-amber-500",
        iconBg: "bg-amber-100",
    },
    Critical: {
        icon: AlertTriangle,
        bg: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800",
        accent: "text-red-600",
        dot: "bg-red-500",
        iconBg: "bg-red-100",
    },
};

const urgencyConfig = {
    High: "border-l-red-500 bg-red-50/40",
    Medium: "border-l-amber-400 bg-amber-50/40",
    Low: "border-l-emerald-500 bg-emerald-50/40",
};

const urgencyBadge = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
};

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlantHealth() {
    const { cropId } = useParams<{ cropId: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<PlantHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/plant-health/${cropId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || err.error || "Failed to fetch report");
            }
            const json = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropId]);

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center gap-6">
                <div className="relative h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                    <Leaf className="absolute inset-0 m-auto h-9 w-9 text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">Analysing crop health</p>
                    <p className="text-base text-muted-foreground mt-2">Fetching live weather + AI insights…</p>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error || !data) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center gap-5 p-8">
                <AlertTriangle className="h-16 w-16 text-destructive" />
                <p className="text-2xl font-bold text-center">Failed to load report</p>
                <p className="text-base text-muted-foreground text-center max-w-md">{error}</p>
                <div className="flex gap-4 mt-2">
                    <Button variant="outline" className="h-11 px-6 text-base" onClick={() => navigate("/plant-health")}>
                        <ArrowLeft className="h-5 w-5 mr-2" /> Back
                    </Button>
                    <Button className="h-11 px-6 text-base" onClick={fetchReport}>
                        <RefreshCw className="h-5 w-5 mr-2" /> Retry
                    </Button>
                </div>
            </div>
        );
    }

    const { crop, weather, report } = data;
    const st = statusConfig[report.overallStatus] ?? statusConfig["Needs Attention"];
    const StatusIcon = st.icon;

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-8 py-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/plant-health")} className="h-11 w-11 hover:bg-muted">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                        <Leaf className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Plant Health</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{crop.name} · {crop.place}, {crop.district}</p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 h-11 px-5 text-base" onClick={fetchReport}>
                    <RefreshCw className="h-5 w-5" /> Refresh
                </Button>
            </header>

            <main className="max-w-4xl mx-auto p-8 md:p-12 space-y-7">
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">

                    {/* Status Banner */}
                    <motion.div variants={fadeUp}>
                        <Card className={`border-2 ${st.bg} shadow-sm`}>
                            <CardContent className="pt-8 pb-7">
                                <div className="flex items-start gap-6">
                                    <div className={`flex h-16 w-16 rounded-2xl items-center justify-center shrink-0 ${st.iconBg}`}>
                                        <StatusIcon className={`h-8 w-8 ${st.accent}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <Badge className={`text-base font-bold px-4 py-1 ${st.badge}`}>
                                                <span className={`mr-2 h-2.5 w-2.5 rounded-full inline-block ${st.dot}`} />
                                                {report.overallStatus}
                                            </Badge>
                                            <Badge variant="outline" className="text-sm px-3 py-1">{crop.phase}</Badge>
                                        </div>
                                        <p className="text-xl text-foreground font-semibold leading-snug">{report.summary}</p>
                                        <p className="text-base text-muted-foreground mt-3 italic">☁️ {report.weatherNote}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Weather Strip */}
                    <motion.div variants={fadeUp}>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: Thermometer, label: "Temperature", value: `${weather.temperature}°C`, sub: `${weather.minTemp}–${weather.maxTemp}°C today`, color: "text-orange-500", bg: "bg-orange-50" },
                                { icon: Droplets, label: "Humidity", value: `${weather.humidity}%`, sub: "Current relative humidity", color: "text-blue-500", bg: "bg-blue-50" },
                                { icon: CloudRain, label: "Rainfall", value: `${weather.rain} mm`, sub: "Recorded today", color: "text-indigo-500", bg: "bg-indigo-50" },
                            ].map((w) => (
                                <Card key={w.label} className="shadow-sm">
                                    <CardContent className="pt-6 pb-5 px-6">
                                        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 ${w.bg}`}>
                                            <w.icon className={`h-6 w-6 ${w.color}`} />
                                        </div>
                                        <p className="text-3xl font-bold">{w.value}</p>
                                        <p className="text-sm text-muted-foreground mt-1.5">{w.label}</p>
                                        <p className="text-xs text-muted-foreground">{w.sub}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tips */}
                    <motion.div variants={fadeUp}>
                        <CardHeader className="px-0 pb-4 pt-0">
                            <CardTitle className="text-2xl flex items-center gap-3">
                                🌿 Health Tips for {crop.name}
                            </CardTitle>
                        </CardHeader>
                        <div className="space-y-4">
                            {report.tips.map((tip, i) => (
                                <motion.div key={i} variants={fadeUp}>
                                    <Card className={`shadow-sm border-l-[5px] ${urgencyConfig[tip.urgency] ?? urgencyConfig["Low"]}`}>
                                        <CardContent className="pt-5 pb-5 px-6">
                                            <div className="flex items-start gap-5">
                                                <span className="text-3xl shrink-0 mt-0.5">{tip.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-lg">{tip.title}</h3>
                                                        <Badge className={`text-sm px-3 py-0.5 ${urgencyBadge[tip.urgency] ?? urgencyBadge["Low"]}`}>
                                                            {tip.urgency} priority
                                                        </Badge>
                                                        <Badge variant="outline" className="text-sm px-3 py-0.5">{tip.category}</Badge>
                                                    </div>
                                                    <p className="text-base text-muted-foreground leading-relaxed">{tip.tip}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <motion.div variants={fadeUp}>
                        <div className="flex flex-wrap items-center justify-between gap-4 text-base text-muted-foreground border-t pt-5">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <span>Next inspection: <strong className="text-foreground">{report.nextInspectionDate}</strong></span>
                            </div>
                            <span>
                                Generated {new Date(report.generatedAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit", minute: "2-digit"
                                })} · Powered by AgroIntel AI
                            </span>
                        </div>
                    </motion.div>

                </motion.div>
            </main>
        </div>
    );
}
