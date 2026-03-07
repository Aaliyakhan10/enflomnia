"use client";
import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp, Users, Target, Loader, Play, ChevronRight, CheckCircle2 } from "lucide-react";
import { intelligenceApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

export default function IntelligencePage() {
    const [reels, setReels] = useState<any[]>([]);
    const [selectedReel, setSelectedReel] = useState<string | null>(null);

    // Account level insights
    const [suggestions, setSuggestions] = useState<any[] | null>(null);
    const [trends, setTrends] = useState<any>(null);
    const [growth, setGrowth] = useState<any>(null);

    // Reel specific insights
    const [feedback, setFeedback] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        setLoading(true);
        try {
            // Load reels for selector and macro insights
            const [rData, sData, tData, gData] = await Promise.all([
                instagramApi.getReels(CREATOR_ID).catch(() => ({ data: [] })),
                intelligenceApi.getSuggestions(CREATOR_ID).catch(() => ({ data: [] })),
                intelligenceApi.getCompetitorsAndTrends(CREATOR_ID).catch(() => ({ data: {} })),
                intelligenceApi.simulateGrowth(CREATOR_ID).catch(() => ({ data: {} }))
            ]);

            setReels(rData.data || rData);
            setSuggestions(sData.data || sData);
            setTrends(tData.data || tData);
            setGrowth(gData.data || gData);

        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function handleSelectReel(reelId: string) {
        setSelectedReel(reelId);
        setFeedbackLoading(true);
        setFeedback(null);
        try {
            const res = await intelligenceApi.getFeedback(CREATOR_ID, reelId);
            setFeedback(res.data || res);
        } catch (err) {
            console.error(err);
        }
        setFeedbackLoading(false);
    }

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-gray-400 gap-2">
                <Loader className="animate-spin" size={20} /> Loading Intelligence Engine...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Lightbulb size={22} className="text-yellow-400" /> Content Intelligence
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">Proactive Claude 3.5 insights, growth simulation, and reel coaching.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Growth Projections */}
                <div className="card space-y-4" style={{ borderColor: "rgba(56,189,248,0.3)" }}>
                    <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} /> Growth Simulation
                    </h2>

                    <div className="grid grid-cols-3 gap-3">
                        {growth?.projections?.map((p: any) => (
                            <div key={p.month} className="p-3 rounded-xl bg-white border border-gray-100 text-center">
                                <div className="text-xs text-gray-500 mb-1">Month {p.month}</div>
                                <div className="font-bold text-gray-900 text-lg">{p.projected_followers?.toLocaleString()}</div>
                                <div className="text-[10px] text-sky-400 mt-1">Followers</div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                        <p className="text-xs text-sky-200 font-medium leading-relaxed">
                            <span className="font-bold text-sky-400">Strategic Pivot: </span>
                            {growth?.strategic_pivot}
                        </p>
                    </div>
                </div>

                {/* Competitors & Trends */}
                <div className="card space-y-4" style={{ borderColor: "rgba(167,139,250,0.3)" }}>
                    <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <Target size={16} /> Niche Anomalies
                    </h2>

                    <div>
                        <h3 className="text-xs text-gray-500 mb-2">Emerging Trends (Unsaturated)</h3>
                        <ul className="space-y-2">
                            {trends?.emerging_trends?.map((t: any, i: number) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <ChevronRight size={14} className="text-purple-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold text-gray-900 block">{t.trend_name}</span>
                                        <span className="text-xs text-gray-400">{t.description}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                        <h3 className="text-xs text-gray-500 mb-2">Similar Creators Outperforming Baseline</h3>
                        <div className="flex gap-2">
                            {trends?.competitors_to_watch?.map((c: string, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono text-purple-700">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Suggestions */}
                <div className="card md:col-span-2 space-y-4" style={{ borderColor: "rgba(250,204,21,0.3)" }}>
                    <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb size={16} /> AI Content Suggestions
                    </h2>
                    <p className="text-xs text-gray-400 mb-2">Based on the performance metrics of your latest reels, Claude recommends making these next:</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {suggestions?.map((s: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-white border border-gray-200 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 opacity-50"></div>
                                <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase mb-1 block">{s.format}</span>
                                <h3 className="font-bold text-gray-900 text-sm mb-2">{s.title}</h3>
                                <p className="text-xs text-gray-600 italic mb-3">"{s.hook_idea}"</p>
                                <p className="text-[11px] text-gray-500 border-t border-gray-100 pt-2">{s.rationale}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Micro Feedback (Reel Selection) */}
                <div className="card md:col-span-2 space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Play size={16} className="text-pink-400" /> Reel Coaching
                    </h2>
                    <p className="text-xs text-gray-400">Select a reel below to generate specific feedback analyzing its ratio of reach, watch-time, and saves.</p>

                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {reels?.map((r: any) => (
                            <button
                                key={r.id}
                                onClick={() => handleSelectReel(r.id)}
                                className={`flex-shrink-0 w-32 rounded-xl border text-left transition-all overflow-hidden ${selectedReel === r.id ? "border-pink-500 ring-2 ring-pink-200" : "border-gray-200 hover:border-gray-300"}`}
                            >
                                {r.thumbnail_url ? (
                                    <img src={r.thumbnail_url} alt="thumbnail" className="w-full h-24 object-cover" />
                                ) : (
                                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                        <Play size={20} className="text-gray-600" />
                                    </div>
                                )}
                                <div className="p-2 text-[10px] text-gray-500 truncate bg-gray-50 border-t border-gray-200">
                                    {r.caption || "No caption"}
                                </div>
                            </button>
                        ))}
                    </div>

                    {selectedReel && (
                        <div className="mt-4 p-5 rounded-xl border border-pink-200 bg-pink-50">
                            {feedbackLoading ? (
                                <div className="flex items-center gap-2 text-pink-400 text-sm">
                                    <Loader className="animate-spin" size={16} /> Analyzing reel metrics...
                                </div>
                            ) : feedback ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-0.5">What Worked</p>
                                            <p className="text-sm text-gray-800">{feedback.what_worked}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <TrendingUp size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-0.5">What to Improve</p>
                                            <p className="text-sm text-gray-800">{feedback.what_to_improve}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Lightbulb size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-0.5">Next Iteration</p>
                                            <p className="text-sm text-gray-800">{feedback.next_iteration}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-red-400">Failed to load feedback.</div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
