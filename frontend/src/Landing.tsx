import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
    Menu,
    Leaf,
    TrendingUp,
    ArrowRight,
    Play,
    BarChart3,
    Sprout,
    Globe,
    TrendingDown,
    Users,
    Building2,
    Lock,
    Zap,
    CloudSun,
    FileCheck,
    Warehouse,
    Bot,
    Calculator,
    MapPin,
    FileText,
    Brain,
    CloudLightning,
    MessageSquare,
    Thermometer,
    Shield,
    IndianRupee,
    Quote,
    Sparkles,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ============ DATA ============

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#impact", label: "Impact" },
    { href: "#about", label: "About" },
];

const problems = [
    {
        icon: TrendingDown,
        title: "Market Price Apps",
        description: "Shows prices, no strategy. You see numbers but don't know when to sell or where to get better rates.",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
    },
    {
        icon: Users,
        title: "Advisory Platforms",
        description: "Agronomy only, ignores timing. Experts tell you what to grow, not when to sell or how to maximize profits.",
        color: "text-warning",
        bgColor: "bg-warning/10",
    },
    {
        icon: Building2,
        title: "Government Portals",
        description: "Static schemes, no auto-matching. Buried in bureaucratic websites, impossible to discover what applies to you.",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
    },
    {
        icon: Lock,
        title: "Export Data",
        description: "Inaccessible to individual farmers. Trade intelligence locked behind expensive subscriptions and corporate walls.",
        color: "text-warning",
        bgColor: "bg-warning/10",
    },
];

const features = [
    { icon: TrendingUp, title: "Market Arbitrage Detection", description: "Automatically find price differences across markets to maximize profit margins." },
    { icon: Zap, title: "Real-time Price Intelligence", description: "Live market prices updated continuously from 100+ markets nationwide." },
    { icon: CloudSun, title: "Climate Risk Alerts", description: "Hyperlocal weather forecasts and crop-specific risk warnings." },
    { icon: FileCheck, title: "Auto-matched Government Schemes", description: "Never miss applicable subsidies, loans, or support programs." },
    { icon: Warehouse, title: "Storage Strategy Optimization", description: "AI recommendations on when to hold vs. sell based on price trends." },
    { icon: Bot, title: "AI-Powered Expert Advisor", description: "Ask anything, get strategic answers with clear reasoning." },
    { icon: Calculator, title: "Profit Impact Calculation", description: "See exactly how much more you can earn with each decision." },
    { icon: MapPin, title: "Multi-location Comparison", description: "Compare prices across multiple markets to find the best buyer." },
    { icon: FileText, title: "Strategic Decision Reports", description: "Weekly intelligence reports tailored to your crops and region." },
];

const modules: any[] = [
    {
        id: "market",
        title: "Market Intelligence",
        subtitle: "Find ₹2,000+ arbitrage opportunities automatically",
        icon: TrendingUp,
        color: "text-primary",
        bgColor: "bg-primary/10",
        features: ["Real-time price tracking across 100+ markets", "Arbitrage alerts when price gaps exceed thresholds", "Historical price trends and seasonal patterns", "Best buyer recommendations by location"],
        mockup: { title: "Price Arbitrage Detected", data: [{ market: "Delhi Azadpur", price: "₹3,250/qtl", diff: "+₹0" }, { market: "Jaipur Market", price: "₹3,050/qtl", diff: "-₹200" }, { market: "Lucknow", price: "₹2,890/qtl", diff: "-₹360" }] },
    },
    {
        id: "expert",
        title: "Expert AI",
        subtitle: "Ask anything, get strategic answers with reasoning",
        icon: Brain,
        color: "text-accent-foreground",
        bgColor: "bg-accent",
        features: ["Natural language queries about any agricultural topic", "Contextual answers based on your crops and region", "Step-by-step reasoning for every recommendation", "24/7 availability for time-sensitive decisions"],
        mockup: { question: "Should I sell my wheat now or store it?", answer: "Based on current market trends and your location, I recommend storing for 3-4 weeks. Here's why..." },
    },
    {
        id: "weather",
        title: "Weather & Risk",
        subtitle: "Protect crops with hyperlocal climate alerts",
        icon: CloudLightning,
        color: "text-warning",
        bgColor: "bg-warning/10",
        features: ["Hyperlocal weather forecasts for your exact fields", "Crop-specific risk assessments and warnings", "Advance alerts for frost, hail, and heavy rain", "Optimal spraying and harvesting windows"],
        mockup: { alert: "Heavy Rain Warning", location: "Haryana, Karnal District", timing: "Next 48 hours", action: "Complete harvesting before Saturday" },
    },
    {
        id: "policy",
        title: "Policy Integration",
        subtitle: "Never miss applicable government schemes",
        icon: FileCheck,
        color: "text-primary",
        bgColor: "bg-primary/10",
        features: ["Automatic scheme matching based on your profile", "Application deadline reminders", "Step-by-step application guidance", "Subsidy calculation for your specific case"],
        mockup: { schemes: [{ name: "PM-KISAN", status: "Eligible", amount: "₹6,000/year" }, { name: "Crop Insurance", status: "Apply Now", deadline: "15 days left" }, { name: "Solar Pump Subsidy", status: "Matched", amount: "₹40,000" }] },
    },
];

const stats = [
    { icon: TrendingUp, value: "15-25%", label: "Higher Returns", description: "Average increase in farmer profits" },
    { icon: Globe, value: "100+", label: "Markets Connected", description: "Real-time data from across India" },
    { icon: IndianRupee, value: "₹10,000+", label: "Avg. Profit Increase", description: "Per season, per farmer" },
    { icon: Users, value: "Strategic", label: "Intelligence for All", description: "From small farmers to large operations" },
];

// ============ ANIMATION VARIANTS ============

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// ============ HELPER COMPONENTS ============

const AnimatedNumber = ({ value }: { value: string }) => {
    const [displayValue, setDisplayValue] = useState("0");
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (!isInView) return;
        if (value === "Strategic" || value === "100+") {
            setTimeout(() => setDisplayValue(value), 300);
            return;
        }
        const numericMatch = value.match(/[\d,]+/);
        if (!numericMatch) {
            setDisplayValue(value);
            return;
        }
        const targetNumber = parseInt(numericMatch[0].replace(/,/g, ""));
        const prefix = value.split(numericMatch[0])[0];
        const suffix = value.split(numericMatch[0])[1];
        let current = 0;
        const increment = targetNumber / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNumber) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(`${prefix}${Math.floor(current).toLocaleString()}${suffix}`);
            }
        }, 50);
        return () => clearInterval(timer);
    }, [isInView, value]);

    return <span ref={ref}>{displayValue}</span>;
};

// ============ MAIN COMPONENT ============

const Index = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("market");

    return (
        <div className="min-h-screen bg-background">
            {/* ========== NAVBAR ========== */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
            >
                <div className="container mx-auto px-4">
                    <nav className="flex h-16 items-center justify-between lg:h-20">
                        <a href="/" className="flex items-center gap-2 group">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-105">
                                <Leaf className="h-5 w-5" />
                                <TrendingUp className="absolute h-3 w-3 right-1 bottom-1 opacity-80" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Agro<span className="text-primary">Intel</span></span>
                        </a>
                        <div className="hidden lg:flex lg:items-center lg:gap-8">
                            {navLinks.map((link) => (
                                <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">{link.label}</a>
                            ))}
                        </div>
                        <div className="hidden lg:flex lg:items-center lg:gap-4">
                            <Button variant="ghost" size="sm" asChild><Link to="/login">Log In</Link></Button>
                            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild><Link to="/register">Get Started</Link></Button>
                        </div>
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild className="lg:hidden">
                                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /><span className="sr-only">Toggle menu</span></Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full max-w-xs">
                                <div className="flex flex-col gap-6 pt-8">
                                    {navLinks.map((link, index) => (
                                        <motion.a key={link.href} href={link.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground transition-colors hover:text-primary">{link.label}</motion.a>
                                    ))}
                                    <div className="mt-4 flex flex-col gap-3">
                                        <Button variant="outline" asChild><Link to="/login">Log In</Link></Button>
                                        <Button className="bg-primary hover:bg-primary/90" asChild><Link to="/register">Get Started</Link></Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </nav>
                </div>
            </motion.header>

            <main>
                {/* ========== HERO SECTION ========== */}
                <section className="relative min-h-screen overflow-hidden pt-20 lg:pt-24">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
                        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-accent/30 blur-3xl" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_70%)]" />
                    </div>
                    <div className="container mx-auto px-4 py-16 lg:py-24">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center lg:text-left">
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                                    <Sprout className="h-4 w-4" />AI-Powered Agricultural Intelligence
                                </motion.div>
                                <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
                                    Transform Your Farm Data Into <span className="text-primary">Strategic Profit Decisions</span>
                                </h1>
                                <p className="mb-8 text-lg text-muted-foreground md:text-xl lg:max-w-xl">The Bloomberg for Farmers — AI-powered market intelligence that turns crops into strategic business assets</p>
                                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                                    <Button size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25" asChild>
                                        <Link to="/register">Start Making Smarter Decisions<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                                    </Button>
                                    <Button size="lg" variant="outline" className="group" asChild>
                                        <Link to="/#how-it-works"><Play className="mr-2 h-4 w-4" />Watch How It Works</Link>
                                    </Button>
                                </div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-12 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                                    {["Live Market Data", "100+ Markets", "Real-time Alerts"].map((text) => (
                                        <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground"><div className="h-2 w-2 rounded-full bg-primary animate-pulse" />{text}</div>
                                    ))}
                                </motion.div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }} className="relative">
                                <div className="relative mx-auto max-w-lg lg:max-w-none">
                                    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-2xl">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-primary" /></div>
                                                <div><p className="text-sm font-semibold text-foreground">Market Overview</p><p className="text-xs text-muted-foreground">Live Price Intelligence</p></div>
                                            </div>
                                            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">+15.2%</div>
                                        </div>
                                        <div className="mb-6 h-40 rounded-lg bg-muted/50 flex items-end justify-between gap-2 p-4">
                                            {[65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 92].map((height, i) => (
                                                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }} className="flex-1 rounded-t bg-gradient-to-t from-primary to-primary/60" />
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Arbitrage</p><p className="text-lg font-bold text-primary">₹2,450</p></div>
                                            <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Markets</p><p className="text-lg font-bold text-foreground">127</p></div>
                                            <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Alerts</p><p className="text-lg font-bold text-warning">8</p></div>
                                        </div>
                                    </div>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} className="absolute -left-8 top-1/4 hidden rounded-xl border border-border bg-card p-4 shadow-lg lg:block animate-float">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-primary" /></div>
                                            <div><p className="text-xs text-muted-foreground">Wheat Price</p><p className="font-semibold text-foreground">₹2,845/qtl</p></div>
                                        </div>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.5 }} className="absolute -right-4 bottom-1/4 hidden rounded-xl border border-border bg-card p-4 shadow-lg lg:block animate-float-delayed">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center"><Globe className="h-4 w-4 text-accent-foreground" /></div>
                                            <div><p className="text-xs text-muted-foreground">Export Alert</p><p className="font-semibold text-primary">+23% Demand</p></div>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ========== PROBLEM SECTION ========== */}
                <section className="relative py-20 lg:py-32 overflow-hidden" id="about">
                    <div className="absolute inset-0 -z-10 bg-muted/30" />
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center mb-16">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">Why Farmers Leave <span className="text-destructive">Money on the Table</span></h2>
                            <p className="text-lg text-muted-foreground">Existing tools solve fragments of the problem. None provide complete strategic intelligence.</p>
                        </motion.div>
                        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {problems.map((problem, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5">
                                        <CardContent className="p-6">
                                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${problem.bgColor}`}><problem.icon className={`h-6 w-6 ${problem.color}`} /></div>
                                            <h3 className="mb-2 text-lg font-semibold text-foreground">{problem.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{problem.description}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ========== SOLUTION SECTION ========== */}
                <section className="relative py-20 lg:py-32" id="features">
                    <div className="absolute inset-0 -z-10"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" /></div>
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center mb-16">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">One Platform. <span className="text-primary">Complete Strategic Intelligence.</span></h2>
                            <p className="text-lg text-muted-foreground">AgroIntel synthesizes market, policy, climate, and trade data into actionable profit-maximization decisions</p>
                        </motion.div>
                        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <motion.div key={index} variants={itemVariants} className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5">
                                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"><feature.icon className="h-6 w-6" /></div>
                                    <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                    <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ========== MODULES SHOWCASE ========== */}
                <section className="relative py-20 lg:py-32 bg-muted/30" id="how-it-works">
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center mb-12">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">Key Modules That <span className="text-primary">Drive Results</span></h2>
                            <p className="text-lg text-muted-foreground">Four powerful modules working together to maximize your agricultural profits</p>
                        </motion.div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mx-auto mb-12 grid w-full max-w-2xl grid-cols-2 gap-2 bg-transparent lg:grid-cols-4">
                                {modules.map((module) => (
                                    <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                        <module.icon className="h-4 w-4" /><span className="hidden sm:inline">{module.title}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <AnimatePresence mode="wait">
                                {modules.map((module) => (
                                    <TabsContent key={module.id} value={module.id} className="mt-0">
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                                            <div>
                                                <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${module.bgColor}`}><module.icon className={`h-7 w-7 ${module.color}`} /></div>
                                                <h3 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">{module.title}</h3>
                                                <p className="mb-6 text-lg text-muted-foreground">{module.subtitle}</p>
                                                <ul className="mb-8 space-y-3">
                                                    {module.features.map((feature: any, index: number) => (
                                                        <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-3 text-muted-foreground">
                                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />{feature}
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                                <Button className="group" asChild><Link to="/register">Try {module.title}<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></Button>
                                            </div>
                                            <div className="relative">
                                                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                                                    {module.id === "market" && (
                                                        <div>
                                                            <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><span className="font-semibold">{module.mockup.title}</span></div><Badge variant="secondary" className="bg-primary/10 text-primary">Live</Badge></div>
                                                            <div className="space-y-3">{module.mockup.data.map((item: any, i: number) => (<div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><span className="text-sm font-medium">{item.market}</span><div className="text-right"><p className="font-semibold">{item.price}</p><p className={`text-xs ${i === 0 ? 'text-primary' : 'text-destructive'}`}>{item.diff}</p></div></div>))}</div>
                                                        </div>
                                                    )}
                                                    {module.id === "expert" && (
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-3"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><MessageSquare className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-none bg-muted p-3"><p className="text-sm">{module.mockup.question}</p></div></div>
                                                            <div className="flex items-start gap-3 flex-row-reverse"><div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><Brain className="h-4 w-4 text-primary-foreground" /></div><div className="rounded-2xl rounded-tr-none bg-primary/10 p-3"><p className="text-sm text-foreground">{module.mockup.answer}</p></div></div>
                                                        </div>
                                                    )}
                                                    {module.id === "weather" && (
                                                        <div>
                                                            <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning/10 p-3"><Thermometer className="h-5 w-5 text-warning" /><span className="font-semibold text-warning">{module.mockup.alert}</span></div>
                                                            <div className="space-y-3"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="font-medium">{module.mockup.location}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Timing</span><span className="font-medium">{module.mockup.timing}</span></div><div className="mt-4 rounded-lg bg-primary/10 p-3"><p className="text-sm font-medium text-primary">Recommended Action:</p><p className="text-sm text-muted-foreground">{module.mockup.action}</p></div></div>
                                                        </div>
                                                    )}
                                                    {module.id === "policy" && (
                                                        <div>
                                                            <div className="mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /><span className="font-semibold">Matched Schemes</span></div>
                                                            <div className="space-y-3">{module.mockup.schemes.map((scheme: any, i: number) => (<div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-3"><div><p className="font-medium">{scheme.name}</p><p className="text-xs text-muted-foreground">{scheme.amount || scheme.deadline}</p></div><Badge variant={scheme.status === "Eligible" ? "default" : "secondary"} className={scheme.status === "Apply Now" ? "bg-warning text-warning-foreground" : ""}>{scheme.status}</Badge></div>))}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </TabsContent>
                                ))}
                            </AnimatePresence>
                        </Tabs>
                    </div>
                </section>

                {/* ========== IMPACT SECTION ========== */}
                <section className="relative py-20 lg:py-32" id="impact">
                    <div className="absolute inset-0 -z-10"><div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" /></div>
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="mx-auto max-w-3xl text-center mb-16">
                            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">Built for <span className="text-primary">Real Impact</span></h2>
                            <p className="text-lg text-muted-foreground">Measurable results that transform agricultural operations into profitable businesses</p>
                        </motion.div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.1, duration: 0.6 }} className="group relative text-center">
                                    <div className="relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/5">
                                        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110"><stat.icon className="h-7 w-7" /></div>
                                        <div className="mb-2 text-4xl font-bold text-foreground lg:text-5xl"><AnimatedNumber value={stat.value} /></div>
                                        <p className="mb-1 text-lg font-semibold text-foreground">{stat.label}</p>
                                        <p className="text-sm text-muted-foreground">{stat.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========== INNOVATION QUOTE ========== */}
                <section className="relative py-20 lg:py-32 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="mx-auto max-w-4xl">
                            <div className="relative rounded-3xl border-l-4 border-primary bg-card p-8 shadow-xl lg:p-12">
                                <div className="absolute -left-6 -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"><Quote className="h-6 w-6" /></div>
                                <blockquote className="relative">
                                    <p className="mb-6 text-xl font-medium leading-relaxed text-foreground md:text-2xl lg:text-3xl">"Before Bloomberg, stock prices existed in newspapers. <span className="text-primary">Bloomberg integrated and operationalized information.</span> AgroIntel is Bloomberg for Farmers."</p>
                                    <footer className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-lg font-bold text-primary">AI</span></div>
                                        <div><p className="font-semibold text-foreground">The AgroIntel Vision</p><p className="text-sm text-muted-foreground">Democratizing Agricultural Intelligence</p></div>
                                    </footer>
                                </blockquote>
                                <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                                <div className="absolute right-8 top-8 h-16 w-16 rounded-full bg-accent/50 blur-xl" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ========== FINAL CTA ========== */}
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-slate-deep">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
                        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
                    </div>
                    <div className="container mx-auto px-4">
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />Start Your Free Trial Today</div>
                            <h2 className="mb-6 text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl lg:text-5xl xl:text-6xl">Ready to Operate Agriculture as <span className="text-primary">Strategic Business?</span></h2>
                            <p className="mb-8 text-lg text-primary-foreground/70 md:text-xl">Join farmers who are maximizing profits through AI-powered market intelligence</p>
                            <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                                <Button size="lg" className="group relative bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 text-lg px-8 py-6" asChild>
                                    <Link to="/register">Get Started Free<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link>
                                </Button>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/60">
                                {["No credit card required", "Setup in 5 minutes", "Cancel anytime"].map((text) => (
                                    <div key={text} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{text}</div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Index;
