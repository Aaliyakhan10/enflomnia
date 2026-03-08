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
    const [syncing, setSyncing] = useState(false);

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

    async function handleSync() {
        setSyncing(true);
        try {
            await reachApi.syncFromInstagram(CREATOR_ID);
            await fetchData();
        } catch { }
        setSyncing(false);
    }

    const status = STATUS_MAP[analysis?.anomaly_type as keyof typeof STATUS_MAP] || STATUS_MAP.none;
    const Icon = status.icon;
    const chartData = snapshots.map((s, i) => ({
        name: new Date(s.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        reach: s.reach
    }));

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
        <div className="p-8 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <BarChart2 size={24} className="text-violet-500" />
                        Reach Health Deep-Scan
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Inflomnia AI automatically monitors your Instagram patterns. No manual data entry required.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} disabled={loading || syncing} className="btn bg-white border-gray-100 text-gray-400 hover:text-gray-600">
                        <RefreshCw size={13} className={loading && !syncing ? "animate-spin" : ""} />
                    </button>
                    <button onClick={handleSync} disabled={syncing}
                        className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-violet-500/20"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                        {syncing ? <RefreshCw size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                        {syncing ? "Scanning Instagram..." : "AI Intelligence Sync"}
                    </button>
                </div>
            </div>

            {/* Status card */}
            {analysis && (
                <div className="card flex items-start gap-5 p-6" style={{ borderColor: status.color + "25" }}>
                    <div className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ background: status.bg }}>
                        <Icon size={22} style={{ color: status.color }} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-gray-900 tracking-tight">{status.label}</p>
                            {analysis.anomaly_type !== 'none' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white" style={{ background: status.color }}>Action Needed</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{analysis.reasoning}</p>

                        {analysis.baseline_reach && (
                            <div className="flex gap-6 mt-5 py-4 border-t border-gray-50">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Typical Performance</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter">{analysis.baseline_reach.toLocaleString()} <span className="text-[10px] text-gray-400">avg</span></p>
                                </div>
                                <div className="space-y-1 border-l pl-6 border-gray-100">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Latest Window</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter" style={{ color: analysis.drop_percentage > 20 ? status.color : 'inherit' }}>
                                        {analysis.current_reach?.toLocaleString()}
                                        {analysis.drop_percentage && (
                                            <span className="text-xs ml-2 font-bold opacity-80 decoration-2 underline-offset-4 underline">{analysis.drop_percentage}% diff</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="card p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Reach Distribution</h2>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Daily Reach</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border border-violet-500 border-dashed" /> Baseline</div>
                    </div>
                </div>

                {chartData.length >= 2 ? (
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name"
                                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                {analysis?.baseline_reach && (
                                    <ReferenceLine y={analysis.baseline_reach} stroke="#7c3aed"
                                        strokeDasharray="4 4"
                                        opacity={0.4}
                                    />
                                )}
                                <Line type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={3}
                                    dot={{ fill: "#fff", stroke: "#7c3aed", strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: "#7c3aed", stroke: "#ede9fe", strokeWidth: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[280px] flex flex-col items-center justify-center gap-4 text-gray-300 border-dashed border-2 rounded-2xl bg-gray-50/30">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                            <BarChart2 size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-gray-500">Awaiting Historical Intelligence</p>
                            <p className="text-[11px] font-medium mt-1">Run an AI Sync to pull your latest performance metrics.</p>
                            <button onClick={handleSync} className="text-violet-500 font-bold text-[11px] mt-4 decoration-2 underline-offset-4 underline">Start First Deep Scan</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Removed manual snapshot form — fully automated */}
        </div>
    );
}
