"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Shield, Zap, Rocket, Lightbulb, Loader2, AlertTriangle,
    CheckCircle2, TrendingUp, MessageSquare, ArrowRight, Sparkles,
    Activity, Star, Film, BadgeDollarSign, CalendarDays,
    ChevronRight, BrainCircuit
} from "lucide-react";
import { reachApi, commentsApi, intelligenceApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

function StatCard({ label, value, subtext, color }: { label: string; value: string | number; subtext: string; color: string }) {
    return (
        <div className="card text-center py-8 shadow-sm group hover:shadow-md transition-all">
            <div className="text-4xl font-black mb-1.5 tracking-tighter" style={{ color }}>{value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
            <div className="text-[10px] font-medium text-gray-300 uppercase tracking-tighter">{subtext}</div>
        </div>
    );
}

export default function DashboardOverview() {
    const [loading, setLoading] = useState(true);
    const [reachStatus, setReachStatus] = useState<any>(null);
    const [comments, setComments] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [rData, cData, sData] = await Promise.all([
                    reachApi.analyze(CREATOR_ID).catch(() => ({ data: null })),
                    commentsApi.getSummary(CREATOR_ID).catch(() => ({ data: null })),
                    intelligenceApi.getSuggestions(CREATOR_ID).catch(() => ({ data: [] }))
                ]);
                setReachStatus(rData?.data);
                setComments(cData?.data);
                setSuggestions(sData?.data || []);
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const threats = (comments?.toxic || 0) + (comments?.spam || 0) + (comments?.bot || 0);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 tracking-tight">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm border border-violet-100"
                        style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                        <Sparkles size={12} /> Powered by Inflomnia AI
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter mb-2">
                        Welcome back!
                    </h1>
                    <p className="text-gray-500 font-medium max-w-md">
                        Your creator ecosystem is performing and protected. Here is today's overview.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                        <Activity size={20} />
                    </div>
                    <div className="pr-4 border-r border-gray-50">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Account Status</p>
                        <p className="text-xs font-bold text-emerald-600">Perfectly Healthy</p>
                    </div>
                    <Link href="/dashboard/intelligence" className="text-xs font-bold text-gray-400 hover:text-violet-600 transition-colors px-2">
                        View Intelligence Profile
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex h-56 items-center justify-center gap-2.5 text-gray-400">
                    <Loader2 className="animate-spin text-violet-400" size={20} /> Loading your creator suite...
                </div>
            ) : (
                <>
                    {/* Quick-stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard label="Threats Blocked" value={threats} subtext="spam, toxic & bots" color="#dc2626" />
                        <StatCard
                            label="Reach Health"
                            value={reachStatus?.is_anomaly ? "Alert" : "Stable"}
                            subtext={reachStatus?.is_anomaly ? (reachStatus.anomaly_type || "anomaly detected") : "no platform drops"}
                            color={reachStatus?.is_anomaly ? "#d97706" : "#059669"}
                        />
                        <StatCard label="AI Insights" value={suggestions.length} subtext="active suggestions" color="#7c3aed" />
                    </div>

                    {/* Module cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* The Shield */}
                        <div className="card flex flex-col gap-6 shadow-md border-violet-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-100">
                                        <Shield size={18} />
                                    </div>
                                    <h2 className="font-black text-gray-900 tracking-tight uppercase text-xs">The Shield</h2>
                                </div>
                                <Link href="/dashboard/shield" className="p-2 rounded-full hover:bg-gray-50 text-gray-400 transition-all">
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: "Spam Blocked", count: comments?.spam || 0, color: "#dc2626", bg: "#fee2e2" },
                                    { label: "Toxic Comments", count: comments?.toxic || 0, color: "#d97706", bg: "#fef3c7" },
                                    { label: "Bot Accounts", count: comments?.bot || 0, color: "#7c3aed", bg: "#ede9fe" },
                                ].map(({ label, count, color, bg }) => (
                                    <div key={label} className="flex items-center justify-between py-3 px-4 rounded-2xl group cursor-pointer hover:bg-gray-50 transition-colors"
                                        style={{ background: bg + "30" }}>
                                        <span className="text-xs font-bold text-gray-600">{label}</span>
                                        <span className="text-sm font-black" style={{ color }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-4 border-t border-gray-50">
                                <Link href="/dashboard/reach" className="flex items-center justify-between group">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Reach Health</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${reachStatus?.is_anomaly ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${reachStatus?.is_anomaly ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {reachStatus?.is_anomaly ? "Anomaly Alert" : "Healthy"}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* The Accelerator */}
                        <div className="card flex flex-col gap-6 shadow-md border-emerald-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <Rocket size={18} />
                                    </div>
                                    <h2 className="font-black text-gray-900 tracking-tight uppercase text-xs">The Accelerator</h2>
                                </div>
                                <div className="p-2 rounded-full text-emerald-400">
                                    <BadgeDollarSign size={18} />
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Secure your worth. Use data-backed tools to price deals, match with brands, and script content that converts.
                            </p>

                            <div className="space-y-2">
                                {[
                                    { href: "/dashboard/accelerator/pricing", icon: BadgeDollarSign, label: "Deal Pricing", color: "#10b981" },
                                    { href: "/dashboard/accelerator/scripts", icon: MessageSquare, label: "Script Writer", color: "#7c3aed" },
                                    { href: "/dashboard/accelerator/matching", icon: Star, label: "Brand Matching", color: "#f59e0b" },
                                ].map(({ href, icon: Ic, label, color }) => (
                                    <Link key={href} href={href}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-emerald-200 hover:bg-white transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Ic size={14} style={{ color }} />
                                            <span className="text-xs font-bold text-gray-700">{label}</span>
                                        </div>
                                        <ChevronRight size={12} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* AI Intelligence */}
                        <div className="card flex flex-col gap-6 shadow-md border-violet-50 bg-gradient-to-br from-white to-violet-50/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600 border border-violet-100">
                                        <BrainCircuit size={18} />
                                    </div>
                                    <h2 className="font-black text-gray-900 tracking-tight uppercase text-xs">AI Insights</h2>
                                </div>
                                <Link href="/dashboard/intelligence" className="text-[10px] font-bold text-violet-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                                    More Insights
                                </Link>
                            </div>

                            {suggestions.length > 0 ? (
                                <div className="rounded-2xl p-4 space-y-3 bg-white border border-violet-100 shadow-sm grow">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-lg bg-violet-50 text-violet-500">
                                            <Sparkles size={12} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Top Content Tip</span>
                                    </div>
                                    <div className="text-sm font-black text-gray-900 leading-tight">
                                        {suggestions[0].title}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed italic font-medium">
                                        &ldquo;{suggestions[0].description || "Your followers react best to fast-paced narrative transitions."}&rdquo;
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-2xl p-6 text-center border-dashed border-2 bg-transparent grow flex flex-col items-center justify-center">
                                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">No Suggestions Yet</p>
                                    <p className="text-[10px] text-gray-300 mt-1">Visit Insights to generate</p>
                                </div>
                            )}

                            <Link href="/dashboard/workload"
                                className="flex items-center justify-between p-4 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-transform group">
                                <div className="flex items-center gap-3">
                                    <Zap size={15} />
                                    <span className="text-xs font-black uppercase tracking-widest">Creator Burnout</span>
                                </div>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                    </div>

                    {/* Bottom CTA for Scheduler */}
                    <div className="card bg-gray-900 text-white flex flex-col md:flex-row items-center justify-between p-8 shadow-xl">
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
                                <CalendarDays size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Post Scheduler</h3>
                                <p className="text-sm text-gray-400 font-medium">Automate your content calendar with AI-predicted hit times.</p>
                            </div>
                        </div>
                        <Link href="/dashboard/scheduler" className="btn bg-white text-gray-900 border-0 py-3 px-8 text-sm font-black hover:bg-gray-100 transition-all rounded-xl shadow-lg shadow-white/5">
                            Manage Calendar
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
