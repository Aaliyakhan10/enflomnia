"use client";
import { useState, useEffect } from "react";
import {
    BrainCircuit, Sparkles, TrendingUp, Target,
    MessageSquare, Zap, Loader2, RefreshCw,
    PieChart, Clock, CheckCircle2, Star,
    Layout, Filter, BarChart3, ArrowUpRight,
    FileText, Scroll, BookOpen, PenTool
} from "lucide-react";
import { intelligenceApi, instagramApi } from "@/lib/api";
import { useAccount } from "@/lib/account-context";


function InsightCard({ icon: Icon, title, description, color, bg }: { icon: any; title: string; description: string; color: string; bg: string }) {
    return (
        <div className="card group hover:shadow-lg transition-all duration-300 border-gray-100 flex gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-50 group-hover:scale-110 transition-transform"
                style={{ background: bg, color }}>
                <Icon size={22} />
            </div>
            <div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    );
}

export default function ContentIntelligencePage() {
    const { creatorId } = useAccount();
    const [data, setData] = useState<any>({ suggestions: [], trends: {}, growth: {}, insights: {} });
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);

    // Grounded Script State
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [groundedResult, setGroundedResult] = useState<any>(null);
    const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchData(false);
    }, []);

    async function fetchData(force = false) {
        setLoading(true);
        try {
            const [sugRes, trendRes, growthRes, insightRes] = await Promise.all([
                intelligenceApi.getSuggestions(creatorId, force),
                intelligenceApi.getCompetitorsAndTrends(creatorId, "lifestyle", force),
                intelligenceApi.simulateGrowth(creatorId, force),
                instagramApi.analyzeReels(creatorId)
            ]);
            setData({
                suggestions: sugRes.data || [],
                trends: trendRes.data || {},
                growth: growthRes.data || {},
                insights: insightRes.data || {}
            });
            setLastAnalyzed(new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        } catch { }
        setLoading(false);
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try {
            await fetchData(true);
        } catch { }
        setAnalyzing(false);
    }

    async function handleGenerateGrounded() {
        setIsGeneratingScript(true);
        try {
            const res = await intelligenceApi.generateGroundedScript(creatorId);
            setGroundedResult(res.data);
            setSelectedIdeaIndex(null);
        } catch (err) {
            console.error("Failed to generate grounded script", err);
        } finally {
            setIsGeneratingScript(false);
        }
    }

    if (loading && !data) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-gray-400 gap-2.5">
                <Loader2 className="animate-spin text-violet-400" size={20} /> Loading account intelligence...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 tracking-tight">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <BrainCircuit size={24} className="text-violet-500" />
                        Brand Context
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Grounded in your private data. Our AI indexes your reports and history to ensure all content stays on brand.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastAnalyzed && (
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Last Deep Dive</span>
                            <span className="text-xs font-bold text-gray-600">{lastAnalyzed}</span>
                        </div>
                    )}
                    <button onClick={handleAnalyze} disabled={analyzing}
                        className="btn btn-brand gap-2 px-6 py-2.5 shadow-md shadow-violet-500/20"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                        {analyzing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {analyzing ? "Grounding Facts..." : "Sync Brand Knowledge"}
                    </button>
                </div>
            </div>

            {/* ── Grounded Script Factory (USER REQUESTED) ────────────────────────── */}
            <div className="card border-violet-100 bg-violet-50/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Scroll size={120} className="text-violet-900" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="md:w-1/3 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-[10px] font-black text-violet-600 uppercase tracking-widest">
                            <PenTool size={10} /> Brand Alchemist
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Grounded Script Factory</h2>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Synthesize deep-dive content ideas and ready-to-shoot scripts derived <span className="text-violet-600 font-bold">exclusively</span> from your Knowledge Lake documents. No trends, just your truth.
                        </p>
                        <button 
                            onClick={handleGenerateGrounded}
                            disabled={isGeneratingScript}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 rounded-2xl hover:bg-violet-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {isGeneratingScript ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-violet-400" />}
                            {isGeneratingScript ? "Synthesizing Knowledge..." : "Generate from Brand docs"}
                        </button>
                    </div>

                    <div className="flex-1 w-full min-h-[160px] flex flex-col justify-center">
                        {!groundedResult && !isGeneratingScript && (
                            <div className="text-center py-8 border-2 border-dashed border-violet-100 rounded-3xl bg-white/50">
                                <FileText size={32} className="mx-auto text-violet-200 mb-2" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Awaiting Brand Grounding</p>
                            </div>
                        )}

                        {groundedResult && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Grounded Ideas</h3>
                                    <div className="space-y-2">
                                        {groundedResult.ideas?.map((idea: any, idx: number) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setSelectedIdeaIndex(idx)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedIdeaIndex === idx ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-violet-100 text-gray-700 hover:border-violet-300'}`}
                                            >
                                                <p className="text-xs font-bold truncate">{idea.title}</p>
                                                <p className={`text-[10px] line-clamp-1 mt-0.5 ${selectedIdeaIndex === idx ? 'text-violet-100' : 'text-gray-400'}`}>{idea.hook}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-violet-100">
                                    {(selectedIdeaIndex !== null && groundedResult.ideas) ? (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Selected Idea</span>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 leading-snug">{groundedResult.ideas[selectedIdeaIndex].title}</h4>
                                            <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 italic text-[11px] text-violet-700">
                                                &ldquo;{groundedResult.ideas[selectedIdeaIndex].hook}&rdquo;
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                                                <span className="font-bold text-gray-700">Rationale:</span> {groundedResult.ideas[selectedIdeaIndex].rationale}
                                            </p>
                                        </div>
                                    ) : groundedResult.script ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Active Brand Script</span>
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                            </div>
                                            <h4 className="text-base font-bold text-gray-900 leading-tight">{groundedResult.script.title}</h4>
                                            <div className="max-h-[140px] overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Attention Hook</p>
                                                    <p className="text-xs text-gray-700 font-bold italic">&ldquo;{groundedResult.script.hook}&rdquo;</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {groundedResult.script.body?.slice(0, 2).map((b: any, i: number) => (
                                                        <div key={i} className="space-y-0.5">
                                                            <p className="text-[9px] font-bold text-violet-400 uppercase">Section: {b.section}</p>
                                                            <p className="text-[10px] text-gray-600 line-clamp-2">{b.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                            <BookOpen size={24} className="text-violet-100 mb-2" />
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Select an idea to expand</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {data ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Forecast and Niche */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Forecast */}
                        <div className="card bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-500/20 border-0 p-6 overflow-hidden relative">
                            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200 mb-4 flex items-center gap-2">
                                    <TrendingUp size={12} /> Evolutionary Projection
                                </h3>
                                <div className="text-4xl font-black tracking-tighter mb-1">
                                    {data.growth.projections?.[0]?.projected_followers
                                        ? `+${data.growth.projections[0].projected_followers.toLocaleString()}`
                                        : <span className="text-violet-300 text-2xl">Run Analysis</span>}
                                </div>
                                <p className="text-xs text-violet-100/80 font-medium">Predicted Enterprise Impact</p>

                                {data.growth.strategic_pivot && (
                                    <div className="mt-8 p-3 rounded-xl bg-black/10 border border-white/10 text-xs text-violet-50 leading-relaxed italic font-medium">
                                        &ldquo;{data.growth.strategic_pivot}&rdquo;
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Niche Trends */}
                        <div className="card shadow-sm space-y-5">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-orange-50 text-orange-500 border border-orange-100 shadow-xs">
                                    <PieChart size={16} />
                                </div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Market Sentiment</h3>
                            </div>
                            <div className="space-y-3">
                                {(data.trends.emerging_trends || []).map((trend: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-violet-600 transition-colors">{trend.trend_name}</span>
                                        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                ))}
                                {(!data.trends.emerging_trends || data.trends.emerging_trends.length === 0) && (
                                    ["Micro-vlogging", "POV Narratives", "Visual Storytelling"].map((niche: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                                            <span className="text-sm font-bold text-gray-700 group-hover:text-violet-600 transition-colors">{niche}</span>
                                            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Suggestions Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Suggestion Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InsightCard
                                icon={Star}
                                title="Core Narrative Pillar"
                                description={data.insights.top_performing || "Data-backed reports featuring high-contrast enterprise visual hooks."}
                                color="#f59e0b"
                                bg="#fef3c7"
                            />
                            <InsightCard
                                icon={Zap}
                                title="Flywheel Trigger"
                                description={data.insights.recommended_posting_style || "Real-time responses to trending industry queries via the Alchemist."}
                                color="#10b981"
                                bg="#d1fae5"
                            />
                        </div>

                        {/* Main Suggestions */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1">AI Content Strategy</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {(data.suggestions || []).map((s: any, i: number) => (
                                    <div key={i} className="card group hover:shadow-xl transition-all duration-300 border-gray-100 flex gap-5 py-5">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors shadow-none border border-gray-100">
                                            <Target size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">{s.format || "Content Tip"}</span>
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-bold text-emerald-600 border border-emerald-100 shadow-sm">
                                                    <Sparkles size={8} /> High Impact
                                                </div>
                                            </div>
                                            <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">{s.title || "Viral Format Strategy"}</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed font-medium mb-2">{s.rationale}</p>
                                            <div className="p-2.5 rounded-lg bg-violet-50 text-[11px] font-medium text-violet-700 italic border border-violet-100">
                                                &ldquo;{s.hook_idea}&rdquo;
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reel Coaching Highlight */}
                        <div className="card bg-gray-50 border-dashed border-2 flex flex-col items-center justify-center py-10 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="p-3 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
                                <Filter size={20} className="text-violet-400" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Asset Factory Queue</h4>
                            <p className="text-xs text-gray-400 mt-1">Submit your next report in the "Asset Gallery" section for agentic review.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card py-32 flex flex-col items-center justify-center text-center border-dashed border-2 bg-transparent">
                    <BarChart3 size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-500">No Intelligence Data Found</h3>
                    <p className="text-sm text-gray-400 mt-2 max-w-sm">Click "Index Memory Bank" to ground the system in your private enterprise data.</p>
                </div>
            )}
        </div>
    );
}
