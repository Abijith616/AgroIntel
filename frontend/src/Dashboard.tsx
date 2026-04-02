import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Leaf, LogOut, Sprout, TrendingUp, BarChart3,
    Download, Phone,
    AlertTriangle, ArrowDownRight, FileText, Landmark,
    Pencil, Trash2, Brain, Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeatherWidget } from "@/components/WeatherWidget";
import { MarketPriceWidget } from "@/components/MarketPriceWidget";
import { MarketIntelligenceChart } from "@/components/MarketIntelligenceChart";
import RecordExpenseModal from "@/components/RecordExpenseModal";

// Simple coordinate mapping for demo
const LOCATION_COORDS: Record<string, { lat: number, lon: number }> = {
    'Kerala': { lat: 9.9312, lon: 76.2673 },
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
    // Add more as needed
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ username: string, email: string } | null>(null);

    const [crops, setCrops] = useState<any[]>([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [marketOpportunity, setMarketOpportunity] = useState<{
        bestName: string;
        bestState: string;
        priceGapPercent: number;
        netGain: number;
        profitPotential: string;
        localPrice: number;
        trend: number;
    } | null>(null);
    const [moLoading, setMoLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }

        const fetchCrops = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3000/api/crops', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setCrops(data);
                }
            } catch (error) {
                console.error("Failed to fetch crops", error);
            }
        };

        if (storedUser) {
            fetchCrops();
        }
    }, [navigate]);

    // Fetch market opportunity once we have crops
    useEffect(() => {
        if (crops.length === 0) return;
        const crop = crops[0];
        const fetchMO = async () => {
            setMoLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(
                    `http://localhost:3000/api/market-opportunities?crop=${encodeURIComponent(crop.name)}&state=${encodeURIComponent(crop.state)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) return;
                const data = await res.json();
                const best = data.topOpportunities?.find((o: any) => o.netGain > 0) ?? data.topOpportunities?.[0];
                if (best) {
                    setMarketOpportunity({
                        bestName: best.name,
                        bestState: best.state,
                        priceGapPercent: best.priceGapPercent,
                        netGain: best.netGain,
                        profitPotential: best.profitPotential,
                        localPrice: data.localMarket?.price ?? 0,
                        trend: best.trend,
                    });
                }
            } catch { /* silent fail */ } finally {
                setMoLoading(false);
            }
        };
        fetchMO();
    }, [crops]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this crop?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/crops/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setCrops(crops.filter(crop => crop.id !== id));
            } else {
                alert('Failed to delete crop');
            }
        } catch (error) {
            console.error("Failed to delete crop", error);
        }
    };

    if (!user) return null;

    // Determine location from first crop
    const firstCrop = crops[0];
    const coords = firstCrop ? (LOCATION_COORDS[firstCrop.state] || { lat: 9.9312, lon: 76.2673 }) : { lat: 9.9312, lon: 76.2673 };
    const cropName = firstCrop ? firstCrop.name : 'Rice';

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <>
            <div className="min-h-screen bg-muted/30">
                {/* Header */}
                <header className="bg-background/80 backdrop-blur-md border-b px-8 py-6 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <Leaf className="h-6 w-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">Agro<span className="text-primary">Intel</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-base text-muted-foreground hidden sm:inline-block">Welcome back, <span className="font-semibold text-foreground">{user.username}</span></span>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                        </Button>
                    </div>
                </header>

                <main className="p-6 md:p-10 max-w-[1800px] mx-auto">
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <h1 className="text-4xl font-bold tracking-tight">Dashboard Overview</h1>
                            <div className="flex gap-3">
                                <Button variant="outline" className="gap-2 h-11 text-base" onClick={() => navigate('/export-opportunities')}>
                                    <Download className="h-5 w-5" />
                                    Export Opportunities
                                </Button>
                                <Button className="gap-2 h-11 text-base" onClick={() => navigate('/export-opportunities')}>
                                    <Phone className="h-5 w-5" />
                                    Contact Expert
                                </Button>
                            </div>
                        </div>

                        {/* Top Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <motion.div variants={item}>
                                <WeatherWidget lat={coords.lat} lon={coords.lon} cropName={cropName} />
                            </motion.div>
                            <motion.div variants={item}>
                                <Card
                                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => navigate(`/market-opportunities?crop=${encodeURIComponent(firstCrop?.name || 'Rice')}&state=${encodeURIComponent(firstCrop?.state || 'Kerala')}`)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium">Market Opportunities</CardTitle>
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        {moLoading ? (
                                            <>
                                                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                                                <div className="h-4 w-48 bg-muted animate-pulse rounded mb-2" />
                                                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                                            </>
                                        ) : marketOpportunity ? (
                                            <>
                                                <div className="text-2xl font-bold leading-tight">
                                                    {marketOpportunity.priceGapPercent > 0 ? `+${marketOpportunity.priceGapPercent}%` : `${marketOpportunity.priceGapPercent}%`}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {marketOpportunity.bestName}, {marketOpportunity.bestState}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {marketOpportunity.netGain > 0
                                                        ? `Net gain ~₹${marketOpportunity.netGain}/qt after transport`
                                                        : `Below transport breakeven — check other markets`}
                                                </p>
                                                <Badge
                                                    variant="secondary"
                                                    className={`mt-2 text-xs font-semibold border ${marketOpportunity.profitPotential === 'High'
                                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                            : marketOpportunity.profitPotential === 'Medium'
                                                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                : 'bg-red-100 text-red-600 border-red-200'
                                                        }`}
                                                >
                                                    {marketOpportunity.profitPotential === 'High' ? '🔥 High Potential' :
                                                        marketOpportunity.profitPotential === 'Medium' ? '📊 Medium Potential' :
                                                            '⚠ Low Potential'}
                                                </Badge>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-bold">No Data</div>
                                                <p className="text-sm text-muted-foreground mt-1">Add crops to see opportunities</p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                            <motion.div variants={item}>
                                <Card
                                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => navigate('/plant-health')}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-medium">Plant Health</CardTitle>
                                        <Leaf className="h-5 w-5 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {crops.length} {crops.length === 1 ? 'Crop' : 'Crops'}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">AI-powered health tips for your crops.</p>
                                        <p className="text-sm text-emerald-600 font-medium mt-2">View Health Report →</p>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={item}>
                                <MarketPriceWidget
                                    cropName={firstCrop?.name || 'Rice'}
                                    state={firstCrop?.state || 'Kerala'}
                                    district={firstCrop?.district}
                                />
                            </motion.div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Left Column (2/3) */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* My Crops */}
                                <motion.div variants={item}>
                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-3 text-2xl">
                                                <Sprout className="h-6 w-6 text-green-600" />
                                                My Crops
                                            </CardTitle>
                                            <CardDescription className="text-base">Current active cultivation status</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {crops.length === 0 ? (
                                                    <p className="text-center text-sm text-muted-foreground py-4">No active crops found. Add your first crop!</p>
                                                ) : (
                                                    crops.map((crop, i) => (
                                                        <div key={i} className="flex items-center justify-between p-5 bg-muted/20 rounded-lg border">
                                                            <div>
                                                                <h4 className="font-semibold text-lg">{crop.name}</h4>
                                                                <p className="text-base text-muted-foreground">Stage: {crop.phase} • Area: {crop.landVolume} {crop.landUnit}</p>
                                                                <p className="text-sm text-muted-foreground mt-1">{crop.place}, {crop.district}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <Badge className={`text-sm px-3 py-1 ${crop.phase === 'Harvest Stage' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                                                    {crop.phase === 'Harvest Stage' ? 'Ready' : 'Growing'}
                                                                </Badge>
                                                                <div className="flex gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-background/80" onClick={() => navigate(`/edit-crop/${crop.id}`)}>
                                                                        <Pencil className="h-5 w-5 text-muted-foreground hover:text-primary" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-background/80" onClick={() => handleDelete(crop.id)}>
                                                                        <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                <Button variant="outline" className="w-full border-dashed h-12 text-base" onClick={() => navigate('/add-crop')}>
                                                    + Add New Crop
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Market Intelligence */}
                                <motion.div variants={item}>
                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-3 text-2xl">
                                                <BarChart3 className="h-6 w-6 text-blue-600" />
                                                Market Intelligence
                                            </CardTitle>
                                            <CardDescription className="text-base">Price trend analysis for your region</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <MarketIntelligenceChart
                                                cropName={firstCrop?.name || 'Rice'}
                                                state={firstCrop?.state || 'Kerala'}
                                                district={firstCrop?.district}
                                                compact={true}
                                            />
                                            {/* AI Report CTA */}
                                            <button
                                                onClick={() => navigate('/market-report')}
                                                className="mt-5 w-full flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                                                        <Brain className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm">Get AI Market Report</p>
                                                        <p className="text-indigo-200 text-xs">Personalised verdict • Crop advice • What to grow next</p>
                                                    </div>
                                                </div>
                                                <Sparkles className="h-5 w-5 text-indigo-200 group-hover:text-white transition-colors" />
                                            </button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Right Column (1/3) */}
                            <div className="space-y-6">

                                {/* Actions / Export */}
                                <motion.div variants={item}>
                                    <Card className="bg-primary/5 border-primary/20 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-xl">Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button className="w-full justify-start bg-white hover:bg-white/90 text-primary border border-primary/10 shadow-sm h-11 text-base" variant="outline" onClick={() => navigate('/monthly-report')}>
                                                <FileText className="mr-2 h-5 w-5" />
                                                Generate Monthly Report
                                            </Button>
                                            <Button className="w-full justify-start bg-white hover:bg-white/90 text-primary border border-primary/10 shadow-sm h-11 text-base" variant="outline" onClick={() => setShowExpenseModal(true)}>
                                                <ArrowDownRight className="mr-2 h-5 w-5" />
                                                Record Expense
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Government Schemes */}
                                <motion.div variants={item}>
                                    <Card className="bg-orange-50/50 border-orange-100 shadow-sm">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-3 text-lg">
                                                <Landmark className="h-5 w-5 text-orange-600" />
                                                Government Schemes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white rounded-lg border border-orange-100 shadow-sm">
                                                    <h4 className="font-semibold text-base text-foreground">PM-KISAN Samman Nidhi</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">Next installment of ₹2,000 due next month. Check eligibility.</p>
                                                </div>
                                                <Button variant="link" className="p-0 h-auto text-sm text-orange-600 font-medium" onClick={() => navigate('/schemes')}>
                                                    View All Active Schemes &rarr;
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Recent Alerts */}
                                <motion.div variants={item}>
                                    <Card className="shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-3 text-lg">
                                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                                Recent Alerts
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-5">
                                                <div className="pb-5 border-b last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-base font-medium text-orange-700">Pest Alert</h4>
                                                        <span className="text-xs text-muted-foreground">2h ago</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">High probability of aphid attack in Wheat due to rising humidity.</p>
                                                </div>
                                                <div className="pb-5 border-b last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="text-base font-medium text-blue-700">Irrigation</h4>
                                                        <span className="text-xs text-muted-foreground">Yesterday</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Time to irrigate Mustard fields for optimal pod formation.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Contact */}
                                <motion.div variants={item}>
                                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md border-0">
                                        <CardContent className="pt-8">
                                            <div className="mb-6 h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                <Phone className="h-6 w-6 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Export Opportunities</h3>
                                            <p className="text-indigo-100 text-base mb-6">Connect with verified exporters & agri-brokers to sell your produce globally at premium prices.</p>
                                            <Button variant="secondary" className="w-full font-semibold text-indigo-700 hover:text-indigo-800 h-11 text-base" onClick={() => navigate('/export-opportunities')}>
                                                View Export Contacts
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>

            {/* Record Expense Modal */}
            <RecordExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
            />
        </>
    );
}
