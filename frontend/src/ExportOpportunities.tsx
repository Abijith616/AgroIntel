import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Leaf, ArrowLeft, Globe, Phone, Mail, ExternalLink,
    TrendingUp, PackageCheck, Truck, Star, Filter, Search,
    Building2, MapPin, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExportContact {
    id: number;
    name: string;
    type: "Exporter" | "Agri-Broker" | "Trade Board" | "Government";
    crops: string[];
    description: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    rating: number;
    verified: boolean;
    priceRange: string;
    tag: string;
    tagColor: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const exportContacts: ExportContact[] = [
    {
        id: 1,
        name: "APEDA – Agricultural & Processed Food Export Development Authority",
        type: "Government",
        crops: ["Rice", "Wheat", "Spices", "Fruits", "Vegetables"],
        description:
            "India's premier government body promoting exports of agricultural and processed food products. Provides financial assistance, market development support, and quality certification.",
        email: "apeda@apeda.gov.in",
        phone: "+91-11-26534186",
        website: "https://apeda.gov.in",
        location: "New Delhi, India",
        rating: 4.8,
        verified: true,
        priceRange: "Government rates",
        tag: "Govt. Authority",
        tagColor: "bg-blue-100 text-blue-700",
    },
    {
        id: 2,
        name: "Kisan Exports Pvt. Ltd.",
        type: "Exporter",
        crops: ["Rice", "Wheat", "Corn", "Pulses"],
        description:
            "One of India's leading grain exporters with 20+ years of experience. Handles bulk orders, logistics, and international documentation for Southeast Asia and Gulf markets.",
        email: "trade@kisanexports.com",
        phone: "+91-98400-12345",
        website: "https://kisanexports.com",
        location: "Chennai, Tamil Nadu",
        rating: 4.5,
        verified: true,
        priceRange: "₹25,000 – ₹60,000/MT",
        tag: "Top Exporter",
        tagColor: "bg-green-100 text-green-700",
    },
    {
        id: 3,
        name: "SpiceRoute Global Trading",
        type: "Exporter",
        crops: ["Spices", "Turmeric", "Cardamom", "Pepper", "Ginger"],
        description:
            "Specialises in premium spice exports to Europe and the US. Certified organic options available. Direct farm-to-ship supply chain ensuring freshness and traceability.",
        email: "export@spicerouteglobal.in",
        phone: "+91-484-2367890",
        website: "https://spicerouteglobal.in",
        location: "Kochi, Kerala",
        rating: 4.7,
        verified: true,
        priceRange: "₹3,000 – ₹15,000/kg",
        tag: "Organic Certified",
        tagColor: "bg-emerald-100 text-emerald-700",
    },
    {
        id: 4,
        name: "Punjab AgriTrade Hub",
        type: "Agri-Broker",
        crops: ["Wheat", "Basmati Rice", "Mustard", "Cotton"],
        description:
            "Regional agri-broker connecting North Indian farmers with international buyers. Competitive commission-based model with transparent pricing and same-week payments.",
        email: "connect@punjabagritrade.in",
        phone: "+91-161-4567890",
        website: "https://punjabagritrade.in",
        location: "Ludhiana, Punjab",
        rating: 4.3,
        verified: true,
        priceRange: "₹20,000 – ₹55,000/MT",
        tag: "Fast Payments",
        tagColor: "bg-yellow-100 text-yellow-700",
    },
    {
        id: 5,
        name: "Agri Export India – FIEO Member",
        type: "Trade Board",
        crops: ["All Crops", "Organic Produce", "Processed Foods"],
        description:
            "Federation of Indian Export Organisations member. Facilitates connections between Indian farmers and over 3,000 global importers. Provides export licensing and trade finance guidance.",
        email: "agriexport@fieo.org",
        phone: "+91-11-26288888",
        website: "https://fieo.org/agriculture",
        location: "Mumbai, Maharashtra",
        rating: 4.6,
        verified: true,
        priceRange: "Market-linked pricing",
        tag: "FIEO Registered",
        tagColor: "bg-indigo-100 text-indigo-700",
    },
    {
        id: 6,
        name: "FreshLink International",
        type: "Exporter",
        crops: ["Fruits", "Vegetables", "Mangoes", "Grapes", "Pomegranate"],
        description:
            "Leading fresh produce exporter specialising in horticulture. Maintains cold-chain infrastructure and exports to UAE, UK, Germany, and Singapore. Minimum order: 5 MT.",
        email: "info@freshlinkinternational.com",
        phone: "+91-20-67901234",
        website: "https://freshlinkinternational.com",
        location: "Pune, Maharashtra",
        rating: 4.4,
        verified: true,
        priceRange: "Seasonal pricing",
        tag: "Cold Chain",
        tagColor: "bg-cyan-100 text-cyan-700",
    },
    {
        id: 7,
        name: "GrainBridge Commodities",
        type: "Agri-Broker",
        crops: ["Soybean", "Corn", "Groundnut", "Sesame", "Sunflower"],
        description:
            "Oilseed and pulse export specialist with decade-long experience. Connects farmers in Gujarat and Rajasthan with buyers in Middle East and African markets.",
        email: "sales@grainbridge.co.in",
        phone: "+91-79-26578900",
        website: "https://grainbridge.co.in",
        location: "Ahmedabad, Gujarat",
        rating: 4.2,
        verified: false,
        priceRange: "₹4,000 – ₹12,000/quintal",
        tag: "Oilseeds Expert",
        tagColor: "bg-orange-100 text-orange-700",
    },
    {
        id: 8,
        name: "Karnataka Agri Export Corporation",
        type: "Government",
        crops: ["Coffee", "Cardamom", "Silk", "Vegetables", "Flowers"],
        description:
            "State government body promoting Karnataka's agriculture exports. Assists with quality certification, packaging subsidies, and connects farmers to international trade fairs.",
        email: "kaec@karnataka.gov.in",
        phone: "+91-80-22251234",
        website: "https://kstdc.co",
        location: "Bengaluru, Karnataka",
        rating: 4.1,
        verified: true,
        priceRange: "Subsidy-linked rates",
        tag: "State Govt.",
        tagColor: "bg-blue-100 text-blue-700",
    },
];

const ALL_CROPS = ["All", "Rice", "Wheat", "Spices", "Fruits", "Vegetables", "Pulses", "Oilseeds", "Cotton"];
const ALL_TYPES = ["All", "Exporter", "Agri-Broker", "Trade Board", "Government"];

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
        </div>
    );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ExportCard({ contact, index }: { contact: ExportContact; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
        >
            <Card className="hover:shadow-lg transition-all duration-300 border hover:border-primary/30 group">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-bold text-base text-foreground leading-snug">{contact.name}</h3>
                                {contact.verified && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${contact.tagColor}`}>
                                    {contact.tag}
                                </span>
                                <span className="text-xs text-muted-foreground px-2.5 py-0.5 bg-muted rounded-full">
                                    {contact.type}
                                </span>
                            </div>
                        </div>
                        <StarRating rating={contact.rating} />
                    </div>

                    {/* Location & Price */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {contact.location}
                        </span>
                        <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            {contact.priceRange}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{contact.description}</p>

                    {/* Crops */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {contact.crops.map((crop) => (
                            <Badge key={crop} variant="secondary" className="text-xs bg-primary/8 text-primary border border-primary/15">
                                {crop}
                            </Badge>
                        ))}
                    </div>

                    {/* Contact Details */}
                    <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Details</h4>

                        <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group/link"
                        >
                            <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Mail className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="truncate group-hover/link:underline">{contact.email}</span>
                        </a>

                        <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group/link"
                        >
                            <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <span className="group-hover/link:underline">{contact.phone}</span>
                        </a>

                        <a
                            href={contact.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group/link"
                        >
                            <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Globe className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="truncate group-hover/link:underline">{contact.website.replace("https://", "")}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-2 mt-4">
                        <a href={`mailto:${contact.email}`} className="flex-1">
                            <Button className="w-full h-9 text-sm" size="sm">
                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                Send Inquiry
                            </Button>
                        </a>
                        <a href={contact.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-9 text-sm">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExportOpportunities() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [selectedCrop, setSelectedCrop] = useState("All");
    const [selectedType, setSelectedType] = useState("All");

    const filtered = exportContacts.filter((c) => {
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
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            Agro<span className="text-primary">Intel</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PackageCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{filtered.length}</span> export partners found
                </div>
            </header>

            <main className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
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
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">Export Opportunities</h1>
                                <p className="text-emerald-100 text-base max-w-lg">
                                    Connect directly with verified exporters, trade boards, and agri-brokers to sell your produce internationally at premium prices.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                                {[
                                    { label: "Export Partners", value: "8+" },
                                    { label: "Countries", value: "30+" },
                                    { label: "Verified", value: "7" },
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

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="bg-background rounded-xl border p-4 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search exporters, crops, locations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    {/* Crop filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {ALL_CROPS.map((c) => (
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
                </motion.div>

                {/* Cards Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No export partners found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filtered.map((contact, i) => (
                            <ExportCard key={contact.id} contact={contact} index={i} />
                        ))}
                    </div>
                )}

                {/* Bottom Banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                    <div>
                        <h3 className="font-bold text-lg text-foreground mb-1">Want to register your produce for export?</h3>
                        <p className="text-sm text-muted-foreground">
                            Visit APEDA's portal to register your farm, get quality certification, and access export incentives.
                        </p>
                    </div>
                    <a href="https://apeda.gov.in" target="_blank" rel="noopener noreferrer">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-11 px-6">
                            <Globe className="h-4 w-4" />
                            Visit APEDA Portal
                        </Button>
                    </a>
                </motion.div>
            </main>
        </div>
    );
}
