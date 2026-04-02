import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, ArrowLeft, Sprout, ChevronRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Crop {
    id: number;
    name: string;
    phase: string;
    landVolume: number;
    landUnit: string;
    state: string;
    district: string;
    place: string;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const phaseColor = (phase: string) => {
    if (phase.toLowerCase().includes("harvest")) return "bg-orange-100 text-orange-700";
    if (phase.toLowerCase().includes("initial")) return "bg-sky-100 text-sky-700";
    if (phase.toLowerCase().includes("vegetative") || phase.toLowerCase().includes("growth"))
        return "bg-emerald-100 text-emerald-700";
    return "bg-muted text-muted-foreground";
};

export default function PlantHealthList() {
    const navigate = useNavigate();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        fetch("http://localhost:3000/api/crops", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => setCrops(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [navigate]);

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-10 py-6 flex items-center gap-5 sticky top-0 z-50">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-12 w-12 hover:bg-muted">
                    <ArrowLeft className="h-7 w-7" />
                </Button>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                    <Leaf className="h-7 w-7" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold leading-tight">Plant Health</h1>
                    <p className="text-base text-muted-foreground mt-0.5">Select a crop to get AI health tips</p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-10 py-10 space-y-8">
                {/* Intro banner */}
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white px-10 py-10 shadow-md">
                        <h2 className="text-3xl font-bold mb-3">Real-time Crop Analysis</h2>
                        <p className="text-emerald-100 text-lg leading-relaxed max-w-2xl">
                            AgroIntel analyses live weather in your region alongside your crop's current stage to generate targeted, actionable health tips — select any crop below to get started.
                        </p>
                    </div>
                </motion.div>

                {/* Crop list */}
                {loading ? (
                    <div className="space-y-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : crops.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="shadow-sm">
                            <CardContent className="flex flex-col items-center gap-5 py-20 text-center">
                                <Sprout className="h-16 w-16 text-muted-foreground" />
                                <p className="text-2xl font-semibold">No crops registered yet</p>
                                <p className="text-lg text-muted-foreground">Add your first crop to get health tips.</p>
                                <Button className="mt-2 h-12 px-8 text-lg" onClick={() => navigate("/add-crop")}>
                                    + Add Crop
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
                        {crops.map((crop) => (
                            <motion.div key={crop.id} variants={fadeUp}>
                                <button
                                    onClick={() => navigate(`/plant-health/${crop.id}`)}
                                    className="w-full text-left"
                                >
                                    <Card className="shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all group">
                                        <CardContent className="flex items-center gap-6 py-7 px-8">
                                            {/* Crop icon */}
                                            <div className="h-18 w-18 h-[72px] w-[72px] rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                <Sprout className="h-9 w-9 text-emerald-600" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-2xl">{crop.name}</h3>
                                                    <Badge className={`text-sm px-3 py-1 ${phaseColor(crop.phase)}`}>
                                                        {crop.phase}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-base text-muted-foreground">
                                                    <MapPin className="h-4 w-4 shrink-0" />
                                                    <span>{crop.place}, {crop.district}, {crop.state}</span>
                                                    <span className="ml-1">· {crop.landVolume} {crop.landUnit}</span>
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-base text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View health tips
                                                </span>
                                                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all">
                                                    <ChevronRight className="h-6 w-6 text-emerald-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>
        </div>
    );
}
