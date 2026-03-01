"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Zap, Rocket, Lightbulb, Loader, AlertTriangle, CheckCircle, TrendingUp, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { reachApi, commentsApi, intelligenceApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

export default function DashboardOverview() {
    const [loading, setLoading] = useState(true);
    const [reachStatus, setReachStatus] = useState<any>(null);
    const [comments, setComments] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [rData, cData, sData] = await Promise.all([
                    reachApi.analyze(CREATOR_ID).catch(() => ({ data: null })),
                    commentsApi.getSummary(CREATOR_ID).catch(() => ({ data: null })),
                    intelligenceApi.getSuggestions(CREATOR_ID).catch(() => ({ data: [] }))
                ]);
                setReachStatus(rData?.data);
                setComments(cData?.data);
                setSuggestions(sData?.data || []);
            } catch (err) { }
            setLoading(false);
        }
        loadData();
    }, []);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="mb-8 group">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-fuchsia-500/20 text-fuchsia-400 mb-4 border border-fuchsia-500/20">
                    <Sparkles size={14} /> Welcome to your Creator Hub
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                    Overview
                </h1>
                <p className="text-gray-400 text-lg">Your unified view for account health, monetization, and AI growth strategies.</p>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
                    <Loader className="animate-spin" size={20} /> Loading your data...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* The Shield Widget */}
                    <div className="card space-y-4 border-violet-500/40 shadow-lg shadow-violet-900/10 flex flex-col h-full bg-gradient-to-b from-white/[0.03] to-transparent hover:border-violet-400 transition-colors">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h2 className="font-bold text-violet-400 flex items-center gap-2">
                                <Shield size={18} /> The Shield
                            </h2>
                            <Link href="/dashboard/shield" className="text-xs text-violet-300 hover:text-white transition-colors bg-violet-500/10 px-2 py-1 rounded-md">View All &rarr;</Link>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Comment Moderation</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-white">{(comments?.toxic || 0) + (comments?.spam || 0) + (comments?.bot || 0)}</span>
                                    <span className="text-sm text-gray-400 mb-1">threats blocked</span>
                                </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reach Health</p>
                                {reachStatus?.is_anomaly ? (
                                    <div className="flex items-start gap-2 text-rose-400">
                                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                        <p className="text-sm leading-snug">{reachStatus.analysis || "Reach anomaly detected."}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 text-teal-400">
                                        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <p className="text-sm leading-snug">Reach is stable. No platform-wide drops detected.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* The Accelerator Widget */}
                    <div className="card space-y-4 border-cyan-500/40 shadow-lg shadow-cyan-900/10 flex flex-col h-full bg-gradient-to-b from-white/[0.03] to-transparent hover:border-cyan-400 transition-colors">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h2 className="font-bold text-cyan-400 flex items-center gap-2">
                                <Rocket size={18} /> The Accelerator
                            </h2>
                            <Link href="/dashboard/accelerator/pricing" className="text-xs text-cyan-300 hover:text-white transition-colors bg-cyan-500/10 px-2 py-1 rounded-md">Monetize &rarr;</Link>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col">
                            <p className="text-sm text-gray-300 flex-1">Ready to secure your next brand deal? Use our data-backed tools to price, pitch, and script your content.</p>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <Link href="/dashboard/accelerator/pricing" className="p-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg text-center transition-colors border border-cyan-500/20 group">
                                    <div className="text-cyan-400 mb-1 flex justify-center group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                                    <div className="text-xs font-bold text-white">Deal Pricing</div>
                                </Link>
                                <Link href="/dashboard/accelerator/scripts" className="p-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg text-center transition-colors border border-cyan-500/20 group">
                                    <div className="text-cyan-400 mb-1 flex justify-center group-hover:scale-110 transition-transform"><MessageSquare size={20} /></div>
                                    <div className="text-xs font-bold text-white">Script Gen</div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content Intelligence Widget */}
                    <div className="card space-y-4 border-fuchsia-500/40 shadow-lg shadow-fuchsia-900/10 flex flex-col h-full bg-gradient-to-b from-white/[0.03] to-transparent hover:border-fuchsia-400 transition-colors">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h2 className="font-bold text-fuchsia-400 flex items-center gap-2">
                                <Lightbulb size={18} /> Content Intelligence
                            </h2>
                            <Link href="/dashboard/intelligence" className="text-xs text-fuchsia-300 hover:text-white transition-colors bg-fuchsia-500/10 px-2 py-1 rounded-md">More Insights &rarr;</Link>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Content Suggestion</p>
                                {suggestions && suggestions.length > 0 ? (
                                    <div className="p-3 bg-gradient-to-br from-fuchsia-500/10 to-transparent border border-fuchsia-500/20 rounded-lg">
                                        <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider block mb-1">{suggestions[0].format}</span>
                                        <h3 className="text-sm font-bold text-white mb-1 leading-snug">{suggestions[0].title}</h3>
                                        <p className="text-xs text-fuchsia-200/70 italic line-clamp-2">"{suggestions[0].hook_idea}"</p>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 p-3 bg-white/5 rounded-lg border border-white/5">No suggestions available at this time.</div>
                                )}
                            </div>

                            <Link href="/dashboard/workload" className="flex items-center justify-between p-3 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/20 transition-colors group mt-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-fuchsia-400" />
                                    <span className="text-sm font-bold text-white">Check Workload Signal</span>
                                </div>
                                <ArrowRight size={14} className="text-white group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
