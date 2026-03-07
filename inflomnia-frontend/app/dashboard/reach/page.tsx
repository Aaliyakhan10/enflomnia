"use client";
import { useState, useEffect } from "react";
import { BarChart2, AlertTriangle, CheckCircle, TrendingDown, Plus, RefreshCw } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from "recharts";
import { reachApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const STATUS_MAP = {
    none: { color: "#059669", bg: "#d1fae5", label: "Your reach looks healthy 🎉", icon: CheckCircle },
    creator_specific: { color: "#d97706", bg: "#fef3c7", label: "Your reach dropped — something might be off", icon: AlertTriangle },
    platform_wide: { color: "#dc2626", bg: "#fee2e2", label: "Platform-wide drop — not just you", icon: TrendingDown },
};

export default function ReachPage() {
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ reach: "", impressions: "" });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [snapRes, analyzeRes] = await Promise.all([
                reachApi.getSnapshots(CREATOR_ID),
                reachApi.analyze(CREATOR_ID),
            ]);
            setSnapshots(snapRes.data.slice().reverse());
            setAnalysis(analyzeRes.data);
        } catch { }
        setLoading(false);
    }

    async function handleIngest(e: React.FormEvent) {
        e.preventDefault();
        if (!form.reach) return;
        try {
            await reachApi.ingestSnapshot({
                creator_id: CREATOR_ID,
                reach: parseInt(form.reach),
                impressions: parseInt(form.impressions) || 0,
            });
            setForm({ reach: "", impressions: "" });
            fetchData();
        } catch { }
    }

    const status = STATUS_MAP[analysis?.anomaly_type as keyof typeof STATUS_MAP] || STATUS_MAP.none;
    const Icon = status.icon;
    const chartData = snapshots.map((s, i) => ({ name: `Day ${snapshots.length - i}`, reach: s.reach }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-sm">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    <p className="font-bold text-gray-900">{payload[0].value?.toLocaleString()} reach</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
                        <BarChart2 size={22} style={{ color: "#7c3aed" }} />
                        Reach Health
                    </h1>
                    <p className="text-sm text-gray-500">
                        Inflomnia tracks your reach daily and alerts you the moment something looks off.
                    </p>
                </div>
                <button onClick={fetchData} disabled={loading} className="btn btn-outline gap-2">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Status card */}
            {analysis && (
                <div className="card flex items-start gap-4" style={{ borderColor: status.color + "30" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: status.bg }}>
                        <Icon size={18} style={{ color: status.color }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{status.label}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{analysis.reasoning}</p>
                        {analysis.baseline_reach && (
                            <div className="flex gap-5 mt-3 text-xs">
                                <span className="text-gray-400">Baseline  <strong className="text-gray-700">{analysis.baseline_reach.toLocaleString()}</strong></span>
                                <span className="text-gray-400">Current   <strong className="text-gray-700">{analysis.current_reach?.toLocaleString()}</strong></span>
                                {analysis.drop_percentage && (
                                    <span className="text-gray-400">Drop  <strong style={{ color: status.color }}>▼ {analysis.drop_percentage}%</strong></span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Your Reach Over Time</h2>
                {chartData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                            <Tooltip content={<CustomTooltip />} />
                            {analysis?.baseline_reach && (
                                <ReferenceLine y={analysis.baseline_reach} stroke="#7c3aed"
                                    strokeDasharray="5 5"
                                    label={{ value: "baseline", fill: "#7c3aed", fontSize: 10 }} />
                            )}
                            <Line type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={2.5}
                                dot={{ fill: "#7c3aed", r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: "#7c3aed", stroke: "#ede9fe", strokeWidth: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-gray-400">
                        <BarChart2 size={28} className="text-gray-200" />
                        <p className="text-sm">Add at least 2 data points to see your chart</p>
                    </div>
                )}
            </div>

            {/* Simulate form */}
            <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Add a Reach Snapshot</h2>
                <form className="flex gap-3 items-end" onSubmit={handleIngest}>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1.5 block font-medium">Reach *</label>
                        <input type="number" placeholder="e.g. 12,000" value={form.reach}
                            onChange={e => setForm(f => ({ ...f, reach: e.target.value }))} />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1.5 block font-medium">Impressions</label>
                        <input type="number" placeholder="e.g. 50,000" value={form.impressions}
                            onChange={e => setForm(f => ({ ...f, impressions: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn btn-brand" style={{ flexShrink: 0 }}>
                        <Plus size={14} /> Add
                    </button>
                </form>
            </div>

        </div>
    );
}
