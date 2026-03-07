"use client";
import { useState, useEffect } from "react";
import {
    PersonStanding, Plus, Loader2, X, Sparkles, Target,
    Search, CheckCircle2, Building2, TrendingUp, Handshake,
    Film
} from "lucide-react";
import { matchingApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";
const INDUSTRIES = ["lifestyle", "fitness", "beauty", "tech", "gaming", "food", "travel", "fashion", "finance"];

function ScoreBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-100 flex-1">
            <div className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.05)]"
                style={{ width: `${value * 100}%`, background: color }} />
        </div>
    );
}

export default function MatchingPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [selectedReelId, setSelectedReelId] = useState("");
    const [loading, setLoading] = useState(false);
    const [matching, setMatching] = useState(false);
    const [showAddBrand, setShowAddBrand] = useState(false);

    const [brandForm, setBrandForm] = useState({
        name: "", industry: "lifestyle", target_audience: "",
        content_niches: "", budget_range_min: "", budget_range_max: "",
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [matchRes, brandRes, reelRes] = await Promise.all([
                matchingApi.getMatches(CREATOR_ID),
                matchingApi.getBrands(),
                instagramApi.getReels(CREATOR_ID),
            ]);
            setMatches(matchRes.data || []);
            setBrands(brandRes.data || []);
            setReels(reelRes.data || []);
        } catch { }
        setLoading(false);
    }

    async function handleFindMatches() {
        setMatching(true);
        try {
            const res = await matchingApi.findMatches({
                creator_id: CREATOR_ID,
                reel_id: selectedReelId || undefined
            });
            setMatches(res.data || []);
        } catch { }
        setMatching(false);
    }

    async function handleAddBrand(e: React.FormEvent) {
        e.preventDefault();
        try {
            await matchingApi.addBrand({
                ...brandForm,
                budget_range_min: brandForm.budget_range_min ? parseFloat(brandForm.budget_range_min) : undefined,
                budget_range_max: brandForm.budget_range_max ? parseFloat(brandForm.budget_range_max) : undefined,
            });
            setBrandForm({ name: "", industry: "lifestyle", target_audience: "", content_niches: "", budget_range_min: "", budget_range_max: "" });
            setShowAddBrand(false); loadData();
        } catch { }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <PersonStanding size={24} className="text-violet-500" />
                        Brand Matching
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Stop hunting for sponsors. Inflomnia AI finds brands that perfectly align with your audience and creative style.
                    </p>
                </div>
                <button onClick={() => setShowAddBrand(true)}
                    className="btn btn-outline gap-2 px-4 shadow-sm">
                    <Plus size={14} /> Register New Brand
                </button>
            </div>

            {/* Modal */}
            {showAddBrand && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="card w-full max-w-md space-y-6 relative shadow-2xl border-violet-100">
                        <button onClick={() => setShowAddBrand(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors">
                            <X size={18} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Add a Brand Pair</h2>
                            <p className="text-xs text-gray-500 mt-1">Found a brand you want to pitch to? Add them here.</p>
                        </div>

                        <form onSubmit={handleAddBrand} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block">Brand Identity</label>
                                <input type="text" placeholder="e.g. Lululemon" value={brandForm.name}
                                    onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} required
                                    className="focus:border-violet-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block">Industry</label>
                                    <select value={brandForm.industry} onChange={e => setBrandForm(f => ({ ...f, industry: e.target.value }))}
                                        className="focus:border-violet-500">
                                        {INDUSTRIES.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block">Niches</label>
                                    <input type="text" placeholder="yoga, wellness" value={brandForm.content_niches}
                                        onChange={e => setBrandForm(f => ({ ...f, content_niches: e.target.value }))}
                                        className="focus:border-violet-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block">Target Audience</label>
                                <input type="text" placeholder="e.g. 20-35 females in UK" value={brandForm.target_audience}
                                    onChange={e => setBrandForm(f => ({ ...f, target_audience: e.target.value }))}
                                    className="focus:border-violet-500" />
                            </div>
                            <button type="submit" className="w-full btn btn-brand py-3.5 text-sm font-bold shadow-lg shadow-violet-500/20 mt-2"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                                Add Brand to Catalogue
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* AI Profile Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="card space-y-5 shadow-sm bg-violet-50/30 border-violet-100/50">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-violet-100/50 text-violet-600">
                                <Sparkles size={16} />
                            </div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">AI Profile Engine</h3>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            Inflomnia automatically synthesizes your Instagram data, reach history, and audience vibe to calculate perfect alignment scores.
                        </p>
                        <div className="space-y-4 pt-2">
                            <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1 block">Personalize by Reel</label>
                            <select
                                value={selectedReelId}
                                onChange={e => setSelectedReelId(e.target.value)}
                                className="text-[11px] font-bold text-gray-600 bg-white border-gray-100 hover:border-violet-200 transition-all focus:border-violet-500 shadow-sm"
                            >
                                <option value="">Entire Profile Vibe</option>
                                {reels.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.caption ? r.caption.slice(0, 30) + '...' : 'Untitled Reel'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleFindMatches} disabled={matching || (brands.length === 0 && !selectedReelId)}
                            className="w-full btn btn-brand py-3 text-xs font-bold shadow-md shadow-violet-500/10"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                            {matching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            {matching ? "Matching..." : "Find My Matches"}
                        </button>
                        {brands.length === 0 && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[9px] font-bold text-amber-700 leading-tight uppercase flex items-center gap-2">
                                <Building2 size={10} /> Add brands to start matching
                            </div>
                        )}
                    </div>

                    <div className="card shadow-sm space-y-4 bg-gray-50 border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Matching Metrics</h4>
                        {[
                            { label: "Niche Fit", desc: "Topic alignment count" },
                            { label: "Audience Overlap", desc: "Demographic sync" },
                        ].map((m, i) => (
                            <div key={i} className="flex gap-2">
                                <div className="p-1 rounded bg-white border border-gray-100 shadow-sm">
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-700 leading-none mb-0.5">{m.label}</p>
                                    <p className="text-[9px] text-gray-400">{m.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Matches Feed */}
                <div className="lg:col-span-3 space-y-4">
                    {loading ? (
                        <div className="card flex items-center justify-center py-24 text-gray-400 gap-3 border-dashed border-2 bg-transparent">
                            <Loader2 size={24} className="animate-spin text-violet-300" />
                            <span className="text-sm font-medium">Calculating brand alignment...</span>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="card text-center py-20 bg-gray-50/50 border-dashed border-2">
                            <Handshake size={48} className="text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-medium">No matches calculated.</p>
                            <p className="text-xs text-gray-300 mt-1">Register some brands or click "Find My Matches".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {matches.map((m: any) => (
                                <div key={m.id} className="card group hover:shadow-xl transition-all duration-300 border-gray-100 pb-5">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors shadow-sm">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1.5">{m.brand_name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{m.brand_industry}</span>
                                                    {m.budget_range_max && (
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">💰 Up to ${m.budget_range_max.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black tracking-tighter text-violet-600 leading-none">
                                                {(m.relevance_score * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Match</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    <span>Niche Alignment</span>
                                                    <span className="text-gray-900">{(m.niche_match * 100).toFixed(0)}%</span>
                                                </div>
                                                <ScoreBar value={m.niche_match || 0} color="linear-gradient(90deg, #7c3aed, #8b5cf6)" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    <span>Audience Synergy</span>
                                                    <span className="text-gray-900">{((m.audience_overlap || 0) * 100).toFixed(0)}%</span>
                                                </div>
                                                <ScoreBar value={m.audience_overlap || 0} color="linear-gradient(90deg, #10b981, #34d399)" />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-3">
                                            <Sparkles size={14} className="text-violet-400 mt-1 flex-shrink-0" />
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium italic">&ldquo;{m.fit_reasoning}&rdquo;</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Personalized Brand Match</p>
                                        <button className="text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1.5 group/btn">
                                            View Pitch Strategy <TrendingUp size={12} className="group-hover/btn:translate-y-[-1px] transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
