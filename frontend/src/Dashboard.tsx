import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
    Leaf, LogOut, Sprout, TrendingUp, DollarSign, BarChart3,
    CloudSun, Download, Warehouse, Phone, Wind, Droplets,
    AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Landmark
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ username: string, email: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

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
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                        <Leaf className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">Agro<span className="text-primary">Intel</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">Welcome back, <span className="font-semibold text-foreground">{user.username}</span></span>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                    </Button>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export Report
                            </Button>
                            <Button className="gap-2">
                                <Phone className="h-4 w-4" />
                                Contact Expert
                            </Button>
                        </div>
                    </div>

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div variants={item}>
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-green-900">Weather Alert</CardTitle>
                                    <CloudSun className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-800">28°C</div>
                                    <p className="text-xs text-green-600 mt-1 flex items-center">
                                        <Wind className="h-3 w-3 mr-1" /> 12km/h
                                        <Droplets className="h-3 w-3 ml-2 mr-1" /> 45%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">Sunny intervals expected today.</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Market Opportunities</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">High Demand</div>
                                    <p className="text-xs text-muted-foreground mt-1">Wheat prices up by 5% in local mandis.</p>
                                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary hover:bg-primary/20">Sell Recommended</Badge>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
                                    <Warehouse className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">85% Full</div>
                                    <p className="text-xs text-muted-foreground mt-1">Silo A needs maintenance check.</p>
                                    <p className="text-xs text-blue-600 font-medium mt-2 cursor-pointer hover:underline">View Strategy &gt;</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div variants={item}>
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Today's Price</CardTitle>
                                    <DollarSign className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">₹2,150<span className="text-sm font-normal text-muted-foreground">/qt</span></div>
                                    <div className="flex items-center text-xs text-green-600 mt-1">
                                        <ArrowUpRight className="h-3 w-3 mr-1" />
                                        +2.4% vs yesterday
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">Wheat (Common)</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* My Crops */}
                            <motion.div variants={item}>
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Sprout className="h-5 w-5 text-green-600" />
                                            My Crops
                                        </CardTitle>
                                        <CardDescription>Current active cultivation status</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {[
                                                { name: "Wheat (HD-2967)", stage: "Heading", health: "Good", area: "12 Acres", harvest: "15 Days" },
                                                { name: "Mustard (Pusa-31)", stage: "Flowering", health: "Excellent", area: "8 Acres", harvest: "30 Days" },
                                            ].map((crop, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                                                    <div>
                                                        <h4 className="font-semibold">{crop.name}</h4>
                                                        <p className="text-sm text-muted-foreground">Stage: {crop.stage} • Area: {crop.area}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className={crop.health === 'Excellent' ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}>{crop.health}</Badge>
                                                        <p className="text-xs text-muted-foreground mt-1">Harvest in {crop.harvest}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button variant="outline" className="w-full border-dashed">
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
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                            Market Intelligence
                                        </CardTitle>
                                        <CardDescription>Price trend analysis for your region</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[200px] w-full flex items-center justify-center bg-muted/20 rounded-lg border-dashed border-2 border-muted">
                                            <p className="text-muted-foreground text-sm flex items-center">
                                                <BarChart3 className="mr-2 h-4 w-4" />
                                                Interactive Price Chart Component Loading...
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <p className="text-xs text-muted-foreground">Highest Price (Month)</p>
                                                <p className="font-semibold text-blue-700">₹2,300/qt</p>
                                            </div>
                                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                <p className="text-xs text-muted-foreground">Lowest Price (Month)</p>
                                                <p className="font-semibold text-blue-700">₹2,050/qt</p>
                                            </div>
                                        </div>
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
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Button className="w-full justify-start bg-white hover:bg-white/90 text-primary border border-primary/10 shadow-sm" variant="outline">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Generate Monthly Report
                                        </Button>
                                        <Button className="w-full justify-start bg-white hover:bg-white/90 text-primary border border-primary/10 shadow-sm" variant="outline">
                                            <ArrowDownRight className="mr-2 h-4 w-4" />
                                            Record Expense
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Government Schemes */}
                            <motion.div variants={item}>
                                <Card className="bg-orange-50/50 border-orange-100 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Landmark className="h-4 w-4 text-orange-600" />
                                            Government Schemes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                                                <h4 className="font-semibold text-sm text-foreground">PM-KISAN Samman Nidhi</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Next installment of ₹2,000 due next month. Check eligibility.</p>
                                            </div>
                                            <Button variant="link" className="p-0 h-auto text-xs text-orange-600 font-medium">
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
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            Recent Alerts
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="pb-4 border-b last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-medium text-orange-700">Pest Alert</h4>
                                                    <span className="text-[10px] text-muted-foreground">2h ago</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">High probability of aphid attack in Wheat due to rising humidity.</p>
                                            </div>
                                            <div className="pb-4 border-b last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-sm font-medium text-blue-700">Irrigation</h4>
                                                    <span className="text-[10px] text-muted-foreground">Yesterday</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Time to irrigate Mustard fields for optimal pod formation.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Contact */}
                            <motion.div variants={item}>
                                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md border-0">
                                    <CardContent className="pt-6">
                                        <div className="mb-4 h-10 w-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <Phone className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-1">Need Expert Help?</h3>
                                        <p className="text-indigo-100 text-sm mb-4">Connect with our agricultural scientists for personalized advice.</p>
                                        <Button variant="secondary" className="w-full font-semibold text-indigo-700 hover:text-indigo-800">
                                            Call Support
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>

                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
