import { useEffect, useState, useCallback } from "react";
import {
    ComposedChart, Line, ReferenceLine, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Area
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TrendPoint {
    date: string;
    localPrice: number | null;
    nationalAvg: number | null;
    msp: number;
}

interface TrendResponse {
    crop: string;
    state: string;
    source: "real" | "simulated";
    msp: number;
    trend: TrendPoint[];
    metadata: { fetchedAt: string };
}

interface Props {
    cropName: string;
    state: string;
    district?: string;
    compact?: boolean; // for dashboard usage (smaller height)
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border bg-white shadow-lg p-3 text-sm min-w-[190px]">
            <p className="font-semibold text-foreground mb-2">{label}</p>
            {payload.map((entry: any) => (
                entry.value != null && (
                    <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}</span>
                        </span>
                        <span className="font-bold" style={{ color: entry.color }}>
                            ₹{Number(entry.value).toLocaleString("en-IN")}
                        </span>
                    </div>
                )
            ))}
        </div>
    );
}

export function MarketIntelligenceChart({ cropName, state, district: _district, compact = false }: Props) {
    const [data, setData] = useState<TrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrend = useCallback(async () => {
        if (!cropName || !state) return;
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ crop: cropName, state });
            const res = await fetch(`http://localhost:3000/api/market/trend?${params}`);
            if (!res.ok) throw new Error("Failed to fetch trend");
            const json: TrendResponse = await res.json();
            setData(json);
        } catch (e: any) {
            setError(e.message || "Failed to load trend data");
        } finally {
            setLoading(false);
        }
    }, [cropName, state]);

    useEffect(() => { fetchTrend(); }, [fetchTrend]);

    // Compute stats from local trend
    const localPrices = data?.trend.map(p => p.localPrice).filter((v): v is number => v !== null) ?? [];
    const highPrice = localPrices.length ? Math.max(...localPrices) : null;
    const lowPrice = localPrices.length ? Math.min(...localPrices) : null;
    const latestLocal = localPrices[localPrices.length - 1] ?? null;
    const prevLocal = localPrices[localPrices.length - 2] ?? null;
    const pctChange = latestLocal && prevLocal && prevLocal > 0
        ? (((latestLocal - prevLocal) / prevLocal) * 100).toFixed(1)
        : null;

    const chartHeight = compact ? 200 : 300;

    if (loading) return (
        <div className={`flex items-center justify-center bg-muted/20 rounded-xl border-dashed border-2 border-muted animate-pulse`}
            style={{ height: chartHeight }}>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-6 w-6 animate-bounce" />
                <p className="text-sm">Loading market trends…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTrend}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Source badge */}
                <Badge
                    variant="outline"
                    className={`gap-1.5 ${data.source === "real" ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-blue-600 border-blue-200 bg-blue-50"}`}
                >
                    {data.source === "real"
                        ? <><Wifi className="h-3 w-3" /> Live AGMARKNET Data</>
                        : <><WifiOff className="h-3 w-3" /> MSP-Anchored Simulation</>
                    }
                </Badge>

                {/* Trend indicator */}
                {pctChange !== null && (
                    <Badge variant="outline" className={Number(pctChange) >= 0 ? "text-emerald-700 border-emerald-200" : "text-red-600 border-red-200"}>
                        {Number(pctChange) > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : Number(pctChange) < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                        {Number(pctChange) > 0 ? "+" : ""}{pctChange}% today
                    </Badge>
                )}

                {!compact && (
                    <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1.5 text-xs" onClick={fetchTrend}>
                        <RefreshCw className="h-3.5 w-3.5" />Refresh
                    </Button>
                )}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={data.trend} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="localGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        interval={compact ? 6 : 4}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`}
                        width={52}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                        iconType="circle"
                        iconSize={8}
                    />

                    {/* MSP Reference Line */}
                    <ReferenceLine
                        y={data.msp}
                        label={{ value: `MSP ₹${data.msp.toLocaleString("en-IN")}`, position: "insideTopRight", fontSize: 11, fill: "#f97316" }}
                        stroke="#f97316"
                        strokeDasharray="5 3"
                        strokeWidth={1.5}
                    />

                    {/* Local price area + line */}
                    <Area
                        type="monotone"
                        dataKey="localPrice"
                        name={`Local (${state})`}
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#localGrad)"
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                    />

                    {/* National average dashed line */}
                    <Line
                        type="monotone"
                        dataKey="nationalAvg"
                        name="National Avg"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            {!compact && (
                <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                        <p className="text-xs text-muted-foreground mb-1">30-Day High</p>
                        <p className="text-lg font-bold text-blue-700">
                            {highPrice ? `₹${highPrice.toLocaleString("en-IN")}` : "—"}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xs text-muted-foreground mb-1">MSP</p>
                        <p className="text-lg font-bold text-orange-600">₹{data.msp.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="p-3 bg-red-50/40 rounded-xl border border-red-100 text-center">
                        <p className="text-xs text-muted-foreground mb-1">30-Day Low</p>
                        <p className="text-lg font-bold text-red-600">
                            {lowPrice ? `₹${lowPrice.toLocaleString("en-IN")}` : "—"}
                        </p>
                    </div>
                </div>
            )}

            {/* Compact stats */}
            {compact && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                        <p className="text-xs text-muted-foreground">Highest Price (Month)</p>
                        <p className="text-lg font-semibold text-blue-700">
                            {highPrice ? `₹${highPrice.toLocaleString("en-IN")}/qt` : "Loading…"}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                        <p className="text-xs text-muted-foreground">Lowest Price (Month)</p>
                        <p className="text-lg font-semibold text-blue-700">
                            {lowPrice ? `₹${lowPrice.toLocaleString("en-IN")}/qt` : "Loading…"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
