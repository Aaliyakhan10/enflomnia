"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, CheckCircle, Plus, RefreshCw } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { reachApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001"; // hard-coded for Phase 1 demo

const ANOMALY_CONFIG = {
    none: { color: "#22c55e", label: "Normal", icon: CheckCircle, badge: "badge-safe" },
    creator_specific: { color: "#f59e0b", label: "Creator-Specific Drop", icon: AlertTriangle, badge: "badge-toxic" },
    platform_wide: { color: "#ef4444", label: "Platform-Wide Issue", icon: TrendingDown, badge: "badge-spam" },
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
            const snaps = snapRes.data.slice().reverse(); // oldest first for chart
            setSnapshots(snaps);
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

    const cfg = ANOMALY_CONFIG[analysis?.anomaly_type as keyof typeof ANOMALY_CONFIG] || ANOMALY_CONFIG.none;
    const Icon = cfg.icon;

    const chartData = snapshots.map((s, i) => ({
        name: `D-${snapshots.length - 1 - i}`,
        reach: s.reach,
    }));

    const baseline = analysis?.baseline_reach;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reach Health</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Detects creator-specific vs platform-wide drops</p>
                </div>
                <button onClick={fetchData} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Anomaly Alert */}
            {analysis && (
                <div className={`card flex items-start gap-4 ${analysis.anomaly_type !== "none" ? "border-yellow-500/30" : ""}`}>
                    <div className="mt-0.5 p-2 rounded-lg" style={{ background: `${cfg.color}20` }}>
                        <Icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{cfg.label}</span>
                            {analysis.drop_percentage && (
                                <span className={`badge ${cfg.badge}`}>
                                    ▼ {analysis.drop_percentage}% drop
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{analysis.reasoning}</p>
                        {analysis.baseline_reach && (
                            <div className="flex gap-6 mt-3 text-xs text-gray-500">
                                <span>Baseline: <strong className="text-gray-300">{analysis.baseline_reach.toLocaleString()}</strong></span>
                                <span>Current: <strong className="text-gray-300">{analysis.current_reach?.toLocaleString()}</strong></span>
                                <span>Confidence: <strong className="text-gray-300">{(analysis.confidence * 100).toFixed(0)}%</strong></span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reach Chart */}
            <div className="card">
                <h2 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Reach Trend (last {snapshots.length} points)</h2>
                {chartData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: "#1e1e32", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                                labelStyle={{ color: "#fff" }}
                            />
                            {baseline && <ReferenceLine y={baseline} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "Baseline", fill: "#6366f1", fontSize: 11 }} />}
                            <Line type="monotone" dataKey="reach" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
                        Add at least 2 snapshots to see the chart
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="card">
                <h2 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Simulate Reach Data</h2>
                <form className="flex gap-3 items-end" onSubmit={handleIngest}>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Reach *</label>
                        <input type="number" placeholder="e.g. 12000" value={form.reach}
                            onChange={e => setForm(f => ({ ...f, reach: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Impressions</label>
                        <input type="number" placeholder="e.g. 50000" value={form.impressions}
                            onChange={e => setForm(f => ({ ...f, impressions: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <button type="submit"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all">
                        <Plus size={14} /> Add Snapshot
                    </button>
                </form>
            </div>
        </div>
    );
}
