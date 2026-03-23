import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketWidgetData {
    crop: string;
    nearestMarket: {
        name: string;
        district: string;
        state: string;
        distance: number;
        price: number;
        trend: number;
    };
}

interface Props {
    cropName: string;
    state: string;
    district?: string;
}

export function MarketPriceWidget({ cropName, state, district }: Props) {
    const navigate = useNavigate();
    const [data, setData] = useState<MarketWidgetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({ crop: cropName, state });
                if (district) params.set("district", district);
                const res = await fetch(`http://localhost:3000/api/market/prices?${params}`);
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData({ crop: json.crop, nearestMarket: json.nearestMarket });
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, [cropName, state, district]);

    const isPositive = (data?.nearestMarket?.trend ?? 0) >= 0;

    return (
        <Card
            className="shadow-sm border cursor-pointer group transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 relative overflow-hidden"
            onClick={() =>
                navigate("/market", {
                    state: { crop: cropName, state, district },
                })
            }
        >
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-transparent pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Live Market Price</CardTitle>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">Live</span>
                </div>
            </CardHeader>

            <CardContent>
                {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Fetching prices...</span>
                    </div>
                )}
                {error && !loading && (
                    <div className="text-sm text-muted-foreground py-3">
                        Price data unavailable
                    </div>
                )}
                {data && !loading && (
                    <>
                        <div className="text-3xl font-bold tracking-tight">
                            ₹{data.nearestMarket.price.toLocaleString("en-IN")}
                            <span className="text-lg font-normal text-muted-foreground">/qt</span>
                        </div>

                        <div
                            className={`flex items-center text-sm mt-1 font-medium ${isPositive ? "text-emerald-600" : "text-red-500"
                                }`}
                        >
                            {isPositive ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                                <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            {isPositive ? "+" : ""}
                            {data.nearestMarket.trend}% vs yesterday
                        </div>

                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {data.nearestMarket.name} · {data.nearestMarket.distance} km
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                            {data.crop}
                        </p>

                        <div className="mt-3 flex items-center text-xs text-primary font-medium group-hover:gap-1.5 gap-1 transition-all">
                            View Market Analysis
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
