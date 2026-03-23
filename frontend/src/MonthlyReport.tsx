import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, FileText, TrendingUp, TrendingDown, Minus,
    Leaf, IndianRupee, BarChart2, Loader2, AlertCircle,
    Download, Trash2, Calendar, Tag, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecordExpenseModal from "@/components/RecordExpenseModal";

interface Expense {
    id: number;
    category: string;
    amount: number;
    description: string;
    date: string;
    crop?: { id: number; name: string } | null;
}

interface CategoryBreakdown {
    category: string;
    total: number;
    percentage: number;
}

interface ReportData {
    reportMonth: number;
    reportYear: number;
    generatedAt: string;
    user: { username: string; email: string };
    summary: {
        totalExpenses: number;
        totalCrops: number;
        expenseCount: number;
        lastMonthTotal: number;
        changePercent: number | null;
    };
    crops: Array<{ id: number; name: string; phase: string }>;
    categoryBreakdown: CategoryBreakdown[];
    cropBreakdown: Array<{ cropName: string; total: number }>;
    expenses: Expense[];
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const CATEGORY_COLORS: Record<string, string> = {
    Seeds: "#10b981",
    Fertilizer: "#3b82f6",
    Labor: "#f59e0b",
    Irrigation: "#06b6d4",
    Pesticides: "#ef4444",
    Equipment: "#f97316",
    Other: "#8b5cf6",
};

const CATEGORY_EMOJIS: Record<string, string> = {
    Seeds: "🌱", Fertilizer: "🧪", Labor: "👷",
    Irrigation: "💧", Pesticides: "🛡️", Equipment: "🚜", Other: "📦"
};

export default function MonthlyReport() {
    const navigate = useNavigate();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `http://localhost:3000/api/expenses/monthly-report?month=${month}&year=${year}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                setReport(await res.json());
            } else {
                setError("Failed to load report.");
            }
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (!user) { navigate("/login"); return; }
        fetchReport();
    }, [fetchReport, navigate]);

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this expense?")) return;
        setDeletingId(id);
        try {
            const token = localStorage.getItem("token");
            await fetch(`http://localhost:3000/api/expenses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchReport();
        } finally {
            setDeletingId(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const totalBar = report?.summary.totalExpenses || 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 print:bg-white">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 print:hidden">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg text-gray-900">Monthly Farm Report</h1>
                                <p className="text-xs text-gray-500">Expense tracking & analysis</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowExpenseModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
                        >
                            + Record Expense
                        </Button>
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Download className="h-4 w-4" /> Export PDF
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Month/Year Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border print:hidden"
                >
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-gray-700">Viewing report for:</span>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {MONTH_NAMES.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {[2023, 2024, 2025, 2026].map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={fetchReport} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                </motion.div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
                        </div>
                        <p className="text-gray-500 font-medium">Generating your farm report...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {report && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Report Header (printable) */}
                        <div className="hidden print:block text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">AgroIntel Farm Report</h2>
                            <p className="text-gray-500">{MONTH_NAMES[report.reportMonth - 1]} {report.reportYear} • {report.user.username}</p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Total Spent */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-lg"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <IndianRupee className="h-4 w-4 opacity-80" />
                                    <span className="text-emerald-100 text-sm font-medium">Total Spent</span>
                                </div>
                                <div className="text-3xl font-bold">₹{report.summary.totalExpenses.toLocaleString()}</div>
                                <div className="text-emerald-100 text-xs mt-1">{MONTH_NAMES[report.reportMonth - 1]} {report.reportYear}</div>
                            </motion.div>

                            {/* MoM Change */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl p-5 shadow-sm border"
                            >
                                <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
                                    <BarChart2 className="h-4 w-4" /> vs Last Month
                                </div>
                                {report.summary.changePercent !== null ? (
                                    <div className={`flex items-center gap-1 text-2xl font-bold ${report.summary.changePercent > 0 ? "text-red-600" : "text-emerald-600"}`}>
                                        {report.summary.changePercent > 0
                                            ? <TrendingUp className="h-5 w-5" />
                                            : report.summary.changePercent < 0
                                                ? <TrendingDown className="h-5 w-5" />
                                                : <Minus className="h-5 w-5 text-gray-400" />}
                                        {Math.abs(report.summary.changePercent)}%
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-sm mt-2">No data for last month</div>
                                )}
                                <div className="text-gray-400 text-xs mt-1">Last month: ₹{report.summary.lastMonthTotal.toLocaleString()}</div>
                            </motion.div>

                            {/* Active Crops */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-2xl p-5 shadow-sm border"
                            >
                                <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
                                    <Leaf className="h-4 w-4" /> Active Crops
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{report.summary.totalCrops}</div>
                                <div className="text-gray-400 text-xs mt-1">{report.crops.map(c => c.name).join(", ") || "No crops"}</div>
                            </motion.div>

                            {/* Transactions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-2xl p-5 shadow-sm border"
                            >
                                <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
                                    <Tag className="h-4 w-4" /> Transactions
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{report.summary.expenseCount}</div>
                                <div className="text-gray-400 text-xs mt-1">in {MONTH_NAMES[report.reportMonth - 1]}</div>
                            </motion.div>
                        </div>

                        {/* Breakdown Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-white rounded-2xl p-6 shadow-sm border"
                            >
                                <h3 className="font-bold text-gray-900 text-lg mb-5">Spending by Category</h3>
                                {report.categoryBreakdown.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No expenses recorded this month</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {report.categoryBreakdown.map((cat) => (
                                            <div key={cat.category}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span>{CATEGORY_EMOJIS[cat.category] || "📦"}</span>
                                                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-gray-900">₹{cat.total.toLocaleString()}</span>
                                                        <span className="text-xs text-gray-400 ml-1">({cat.percentage}%)</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || "#8b5cf6" }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.percentage}%` }}
                                                        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Crop Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-2xl p-6 shadow-sm border"
                            >
                                <h3 className="font-bold text-gray-900 text-lg mb-5">Spending by Crop</h3>
                                {report.cropBreakdown.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        <Leaf className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No expenses recorded this month</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {report.cropBreakdown.map((crop, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                        <Leaf className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">{crop.cropName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">₹{crop.total.toLocaleString()}</span>
                                                    <div className="text-xs text-gray-400">
                                                        {totalBar > 0 ? Math.round((crop.total / report.summary.totalExpenses) * 100) : 0}%
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Expense List */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 text-lg">Transaction History</h3>
                                <Badge variant="outline" className="text-xs">{report.expenses.length} transactions</Badge>
                            </div>

                            {report.expenses.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-7 w-7 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No expenses this month</p>
                                    <p className="text-gray-400 text-sm mt-1">Click "Record Expense" to add your first one</p>
                                    <Button
                                        className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                                        onClick={() => setShowExpenseModal(true)}
                                    >
                                        + Record First Expense
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {report.expenses.map((exp, i) => (
                                        <motion.div
                                            key={exp.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="h-10 w-10 rounded-xl flex items-center justify-center text-xl"
                                                    style={{ backgroundColor: `${CATEGORY_COLORS[exp.category] || "#8b5cf6"}18` }}
                                                >
                                                    {CATEGORY_EMOJIS[exp.category] || "📦"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{exp.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span
                                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: `${CATEGORY_COLORS[exp.category] || "#8b5cf6"}18`,
                                                                color: CATEGORY_COLORS[exp.category] || "#8b5cf6"
                                                            }}
                                                        >
                                                            {exp.category}
                                                        </span>
                                                        {exp.crop && (
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <Leaf className="h-3 w-3" /> {exp.crop.name}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900 text-base">₹{exp.amount.toLocaleString()}</span>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    disabled={deletingId === exp.id}
                                                    className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-all print:hidden"
                                                >
                                                    {deletingId === exp.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Print footer */}
                        <div className="hidden print:block text-center text-sm text-gray-400 mt-8 pt-4 border-t">
                            Generated by AgroIntel • {new Date(report.generatedAt).toLocaleString()}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Record Expense Modal */}
            <RecordExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                onSaved={fetchReport}
            />
        </div>
    );
}
