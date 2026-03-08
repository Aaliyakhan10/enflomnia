"use client";
import { useState, useEffect } from "react";
import {
    BatteryCharging, TrendingUp, TrendingDown, Minus,
    RefreshCw, Loader2, Calendar, Clock, AlertTriangle,
    Info, Sparkles, CheckCircle2, Zap
} from "lucide-react";
import { workloadApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const SIGNAL_CONFIG = {
    reduce: { color: "#dc2626", icon: TrendingDown, label: "Take a Break", bg: "#fee2e2", desc: "Your engagement is dipping. Scaling back helps preserve your reach for the long term." },
    maintain: { color: "#d97706", icon: Minus, label: "Keep the Rhythm", bg: "#fef3c7", desc: "You're in the sweet spot! Consistent posting is your best ally right now." },
    increase: { color: "#059669", icon: TrendingUp, label: "Go Big", bg: "#d1fae5", desc: "Your audience is hungry for more! This is the perfect time to increase your frequency." },
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function HeatmapCell({ value }: { value: number }) {
    // Elegant violet scale for better white-theme visibility
    const opacity = Math.max(0.04, Math.min(value, 1));
    const isHigh = value > 0.7;
    return (
        <div className={`w-full aspect-square rounded-[4px] transition-all hover:scale-110 cursor-pointer ${isHigh ? 'shadow-sm border border-violet-200/50' : ''}`}
            style={{ background: isHigh ? `rgba(124, 58, 237, ${opacity})` : `rgba(139, 92, 246, ${opacity})` }}
            title={`${(value * 100).toFixed(0)}% engagement`} />
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
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <BatteryCharging size={24} className="text-violet-500" />
                        Creator Burnout Protection
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Inflomnia AI analyses your engagement patterns to tell you exactly when to push and when to take a break.
                    </p>
                </div>
                <button onClick={handleGenerateSignal} disabled={generating}
                    className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-violet-500/20"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {generating ? "Analysing patterns..." : "Check My Signal"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Signal Card */}
                <div className="lg:col-span-2 space-y-6">
                    {signal ? (
                        <div className="card overflow-hidden transition-all hover:shadow-lg pt-0 px-0"
                            style={{ border: `1px solid ${cfg.color}25` }}>
                            <div className="p-1 px-4 text-[10px] font-bold uppercase tracking-widest text-white mb-6 flex items-center justify-between"
                                style={{ background: cfg.color }}>
                                <span>Inflomnia AI Recommendation</span>
                                <CheckCircle2 size={10} />
                            </div>
                            <div className="px-6 pb-6">
                                <div className="flex items-start gap-5">
                                    <div className="w-16 h-16 rounded-[22px] flex items-center justify-center flex-shrink-0 shadow-sm"
                                        style={{ background: cfg.bg, color: cfg.color }}>
                                        <SignalIcon size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{cfg.label}</h2>
                                            <div className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                                                style={{ background: "#f8fafc", color: "var(--brand)", border: "1px solid #e2e8f0" }}>
                                                {signal.recommended_posts_per_week} Posts / Week
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{cfg.desc}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 italic text-sm text-gray-500 leading-relaxed">
                                        <Info size={16} className="text-violet-400 mt-0.5 flex-shrink-0" />
                                        &ldquo;{signal.reasoning}&rdquo;
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="card border-dashed border-2 bg-transparent py-14 text-center">
                            <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-300 flex items-center justify-center mx-auto mb-4">
                                <Zap size={20} />
                            </div>
                            <p className="text-gray-400 font-medium">Ready to see your posting strategy?</p>
                            <p className="text-xs text-gray-300 mt-1">We need to analyse your recent engagement first.</p>
                            <button onClick={handleGenerateSignal} className="text-violet-500 font-bold text-xs mt-3 underline decoration-2 underline-offset-4">Run Analysis Now</button>
                        </div>
                    )}

                    {/* Heatmap Section */}
                    <div className="card shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100/50 flex items-center justify-center">
                                    <Calendar size={16} className="text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900 leading-none mb-1">Weekly Pulse</h3>
                                    <p className="text-[11px] text-gray-400 font-medium">When your audience is most active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <span>Low</span>
                                    <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-violet-50 to-violet-600" />
                                    <span>Hot</span>
                                </div>
                            </div>
                        </div>

                        {heatmap ? (
                            <div className="space-y-2">
                                <div className="flex gap-1 ml-16 mb-1">
                                    {[0, 6, 12, 18, 23].map(h => (
                                        <div key={h} className="text-[9px] font-black text-gray-300 uppercase" style={{ width: `${100 / 24}%` }}>{h}h</div>
                                    ))}
                                </div>
                                {DAYS.map(day => (
                                    <div key={day} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 w-14 uppercase tracking-tighter flex-shrink-0">{day.slice(0, 3)}</span>
                                        <div className="flex gap-1 flex-1">
                                            {(heatmap[day] || Array(24).fill(0)).map((v: number, h: number) => (
                                                <HeatmapCell key={h} value={v} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2 border-dashed border-2 rounded-2xl">
                                <Loader2 size={24} className="animate-spin text-violet-200" />
                                <span className="text-xs font-medium">Crunching your reach data...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Tips */}
                <div className="space-y-4">
                    <div className="card bg-violet-600 text-white shadow-lg shadow-violet-500/20 border-0">
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <Sparkles size={14} /> Best Posting Days
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {(signal?.best_days || ["Friday", "Sunday"]).map((day: string) => (
                                <span key={day} className="px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold">
                                    {day}
                                </span>
                            ))}
                        </div>
                        <p className="text-[11px] text-violet-100/80 mt-4 font-medium leading-relaxed">
                            Influencers in your niche see <span className="text-white font-bold underline">12% more engagement</span> when posting on these targeted windows.
                        </p>
                    </div>

                    <div className="card space-y-4 border-amber-100 shadow-sm">
                        <div className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle size={15} />
                            <h4 className="font-bold text-xs uppercase tracking-wider">Burnout Warning</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            We've noticed a pattern in your watch time dropping after 3 consecutive daily posts.
                        </p>
                        <div className="p-3 rounded-xl bg-amber-50 text-[11px] font-bold text-amber-800 leading-tight">
                            Inflomnia recommends a "Low-Effort" Story day this Tuesday to reset your creative energy.
                        </div>
                    </div>

                    <div className="card border-gray-100 bg-gray-50">
                        <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-widest">About Signals</h4>
                        <ul className="space-y-3">
                            {[
                                { icon: Clock, text: "Wait 24h between signals for best accuracy" },
                                { icon: Calendar, text: "Updated weekly based on niche trends" }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-2 text-[11px] text-gray-500 leading-tight">
                                    <item.icon size={12} className="text-gray-400 flex-shrink-0" />
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
