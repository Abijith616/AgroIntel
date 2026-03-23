import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, DollarSign, Leaf, Calendar, Tag, FileText,
    CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Crop {
    id: number;
    name: string;
}

interface RecordExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

const CATEGORIES = [
    { label: "Seeds", emoji: "🌱", color: "bg-green-100 text-green-700" },
    { label: "Fertilizer", emoji: "🧪", color: "bg-blue-100 text-blue-700" },
    { label: "Labor", emoji: "👷", color: "bg-yellow-100 text-yellow-700" },
    { label: "Irrigation", emoji: "💧", color: "bg-cyan-100 text-cyan-700" },
    { label: "Pesticides", emoji: "🛡️", color: "bg-red-100 text-red-700" },
    { label: "Equipment", emoji: "🚜", color: "bg-orange-100 text-orange-700" },
    { label: "Other", emoji: "📦", color: "bg-gray-100 text-gray-700" },
];

export default function RecordExpenseModal({ isOpen, onClose, onSaved }: RecordExpenseModalProps) {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [form, setForm] = useState({
        cropId: "",
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        const token = localStorage.getItem("token");
        fetch("http://localhost:3000/api/crops", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then(setCrops)
            .catch(() => { });
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category) { setErrorMsg("Please select a category."); return; }
        if (!form.amount || parseFloat(form.amount) <= 0) { setErrorMsg("Please enter a valid amount."); return; }
        if (!form.description.trim()) { setErrorMsg("Please enter a description."); return; }
        setErrorMsg("");
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3000/api/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cropId: form.cropId || null,
                    category: form.category,
                    amount: parseFloat(form.amount),
                    description: form.description,
                    date: form.date,
                }),
            });
            if (res.ok) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                    setForm({ cropId: "", category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
                    onSaved?.();
                    onClose();
                }, 1500);
            } else {
                const d = await res.json();
                setErrorMsg(d.error || "Failed to save expense.");
                setStatus("error");
            }
        } catch {
            setErrorMsg("Network error. Please try again.");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Record Expense</h2>
                                        <p className="text-emerald-100 text-sm">Log a new farm expense</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.label}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, category: cat.label }))}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${form.category === cat.label
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 scale-105 shadow-md"
                                                    : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className="text-lg">{cat.emoji}</span>
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount & Date row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="inline h-3.5 w-3.5 mr-1" />Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                                    />
                                </div>
                            </div>

                            {/* Linked Crop */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Leaf className="inline h-3.5 w-3.5 mr-1" />Linked Crop (optional)
                                </label>
                                <select
                                    value={form.cropId}
                                    onChange={(e) => setForm((f) => ({ ...f, cropId: e.target.value }))}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                                >
                                    <option value="">General expense (no specific crop)</option>
                                    {crops.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <FileText className="inline h-3.5 w-3.5 mr-1" />Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder="e.g. Purchased 50kg urea fertilizer from local supplier"
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 resize-none"
                                />
                            </div>

                            {/* Error */}
                            {errorMsg && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm border border-red-100">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            {/* Success */}
                            {status === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl text-sm border border-emerald-100"
                                >
                                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                    Expense recorded successfully!
                                </motion.div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-1">
                                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || status === "success"}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                                >
                                    {loading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Tag className="h-4 w-4 mr-2" /> Record Expense</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
