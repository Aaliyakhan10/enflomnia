"use client";
import { useState, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw, Loader } from "lucide-react";
import { workloadApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const SIGNAL_CONFIG = {
    reduce: { color: "#ef4444", icon: TrendingDown, label: "Reduce Posting", bg: "rgba(239,68,68,0.1)" },
    maintain: { color: "#f59e0b", icon: Minus, label: "Maintain Rhythm", bg: "rgba(245,158,11,0.1)" },
    increase: { color: "#22c55e", icon: TrendingUp, label: "Increase Posting", bg: "rgba(34,197,94,0.1)" },
};

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function HeatmapCell({ value }: { value: number }) {
    const opacity = Math.max(0.05, Math.min(value, 1));
    return (
        <div className="w-full aspect-square rounded-[3px]"
            style={{ background: `rgba(99, 102, 241, ${opacity})` }}
            title={`${(value * 100).toFixed(0)}%`} />
    );
}

export default function WorkloadPage() {
    const [signal, setSignal] = useState<any>(null);
    const [heatmap, setHeatmap] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [sRes, hRes] = await Promise.all([
                workloadApi.getSignal(CREATOR_ID),
                workloadApi.getHeatmap(CREATOR_ID),
            ]);
            setSignal(sRes.data);
            setHeatmap(hRes.data);
        } catch { }
        setLoading(false);
    }

    async function handleGenerateSignal() {
        setGenerating(true);
        try {
            const res = await workloadApi.analyze(CREATOR_ID);
            setSignal(res.data);
            fetchData();
        } catch { }
        setGenerating(false);
    }

    const cfg = SIGNAL_CONFIG[signal?.signal_type as keyof typeof SIGNAL_CONFIG] || SIGNAL_CONFIG.maintain;
    const SignalIcon = cfg.icon;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap size={22} className="text-indigo-400" /> Workload Signals
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">AI-powered engagement pattern analysis & schedule advice</p>
                </div>
                <button onClick={handleGenerateSignal} disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all">
                    {generating ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {generating ? "Generating…" : "Generate Signal"}
                </button>
            </div>

            {/* Signal Card */}
            {signal ? (
                <div className="card" style={{ border: `1px solid ${cfg.color}30` }}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl flex-shrink-0" style={{ background: cfg.bg }}>
                            <SignalIcon size={24} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-lg font-bold text-gray-900">{cfg.label}</h2>
                                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                                    {signal.recommended_posts_per_week}x / week
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3">{signal.reasoning}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500">Best days:</span>
                                {(signal.best_days || []).map((day: string) => (
                                    <span key={day} className="badge badge-high-value">{day}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : !loading && (
                <div className="card text-center py-10">
                    <p className="text-gray-500 text-sm">No signal generated yet. Click "Generate Signal" to analyse your engagement patterns.</p>
                </div>
            )}

            {/* Engagement Heatmap */}
            <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                    30-Day Engagement Heatmap <span className="text-gray-500 font-normal normal-case">(darker = higher engagement)</span>
                </h2>
                {heatmap ? (
                    <div className="space-y-1.5">
                        {/* Hour labels (top) */}
                        <div className="flex gap-1 ml-20">
                            {[0, 6, 12, 18, 23].map(h => (
                                <div key={h} className="text-[10px] text-gray-600" style={{ width: `${100 / 24}%` }}>{h}h</div>
                            ))}
                        </div>
                        {DAYS.map(day => (
                            <div key={day} className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{day.slice(0, 3)}</span>
                                <div className="flex gap-0.5 flex-1">
                                    {(heatmap[day] || Array(24).fill(0)).map((v: number, h: number) => (
                                        <HeatmapCell key={h} value={v} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
                        {loading ? <Loader size={16} className="animate-spin mr-2" /> : null}
                        {loading ? "Loading heatmap…" : "No data yet. Add some reach snapshots first."}
                    </div>
                )}
            </div>
        </div>
    );
}
