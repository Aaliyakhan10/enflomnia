"use client";
import { useState, useEffect } from "react";
import { Users, Plus, Loader, X, Play } from "lucide-react";
import { matchingApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";
const INDUSTRIES = ["fitness", "beauty", "tech", "gaming", "food", "travel", "fashion", "finance", "education", "lifestyle"];
const NICHES = ["fitness", "beauty", "tech", "gaming", "food", "travel", "fashion", "finance", "education", "lifestyle", "general"];

function ScoreBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
        </div>
    );
}

export default function MatchingPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [matching, setMatching] = useState(false);
    const [showAddBrand, setShowAddBrand] = useState(false);
    const [tab, setTab] = useState<"matches" | "brands">("matches");

    const [creatorForm, setCreatorForm] = useState({
        niche: "fitness", platform: "instagram", reel_id: "",
        follower_count: "", engagement_rate: "",
        audience_description: "",
    });

    const [brandForm, setBrandForm] = useState({
        name: "", industry: "fitness", target_audience: "",
        content_niches: "", budget_range_min: "", budget_range_max: "",
    });
    const [reels, setReels] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [matchRes, brandRes, reelRes] = await Promise.all([
                matchingApi.getMatches(CREATOR_ID),
                matchingApi.getBrands(),
                instagramApi.getReels(CREATOR_ID).catch(() => ({ data: [] })),
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
                niche: creatorForm.niche,
                platform: creatorForm.platform,
                reel_id: creatorForm.reel_id || undefined,
                follower_count: creatorForm.follower_count ? parseInt(creatorForm.follower_count) : undefined,
                engagement_rate: creatorForm.engagement_rate ? parseFloat(creatorForm.engagement_rate) / 100 : undefined,
                audience_description: creatorForm.audience_description || undefined,
            });
            setMatches(res.data || []);
        } catch { }
        setMatching(false);
    }

    async function handleAddBrand(e: React.FormEvent) {
        e.preventDefault();
        try {
            await matchingApi.addBrand({
                name: brandForm.name,
                industry: brandForm.industry,
                target_audience: brandForm.target_audience || undefined,
                content_niches: brandForm.content_niches || undefined,
                budget_range_min: brandForm.budget_range_min ? parseFloat(brandForm.budget_range_min) : undefined,
                budget_range_max: brandForm.budget_range_max ? parseFloat(brandForm.budget_range_max) : undefined,
            });
            setBrandForm({ name: "", industry: "fitness", target_audience: "", content_niches: "", budget_range_min: "", budget_range_max: "" });
            setShowAddBrand(false);
            loadData();
        } catch { }
    }

    function cu(k: string, v: string) { setCreatorForm(f => ({ ...f, [k]: v })); }
    function bu(k: string, v: string) { setBrandForm(f => ({ ...f, [k]: v })); }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users size={22} className="text-indigo-400" /> Brand Matching
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Find brands that fit your audience, niche, and content style</p>
                </div>
                <button onClick={() => setShowAddBrand(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all">
                    <Plus size={14} /> Add Brand
                </button>
            </div>

            {/* Add Brand Modal */}
            {showAddBrand && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md space-y-4 relative">
                        <button onClick={() => setShowAddBrand(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={16} />
                        </button>
                        <h2 className="font-bold text-white">Add Brand to Catalogue</h2>
                        <form onSubmit={handleAddBrand} className="space-y-3">
                            {[
                                { label: "Brand Name *", key: "name", placeholder: "Nike" },
                                { label: "Target Audience", key: "target_audience", placeholder: "18-35 female fitness enthusiasts" },
                                { label: "Content Niches (comma-sep)", key: "content_niches", placeholder: "fitness,wellness,lifestyle" },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                                    <input type="text" placeholder={placeholder} value={(brandForm as any)[key]}
                                        onChange={e => bu(key, e.target.value)} required={key === "name"}
                                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Industry</label>
                                <select value={brandForm.industry} onChange={e => bu("industry", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500">
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Budget Min $</label>
                                    <input type="number" value={brandForm.budget_range_min} onChange={e => bu("budget_range_min", e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">Budget Max $</label>
                                    <input type="number" value={brandForm.budget_range_max} onChange={e => bu("budget_range_max", e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all">
                                Add Brand
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {/* Creator Profile Sidebar */}
                <div className="card space-y-3 md:col-span-1 self-start">
                    <h2 className="font-semibold text-white text-xs uppercase tracking-wider">Your Profile</h2>
                    {[
                        { label: "Niche", key: "niche", options: NICHES },
                        { label: "Platform", key: "platform", options: ["instagram", "youtube", "tiktok"] },
                    ].map(({ label, key, options }) => (
                        <div key={key}>
                            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                            <select value={(creatorForm as any)[key]} onChange={e => cu(key, e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500">
                                {options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                    ))}

                    <div>
                        <label className="text-xs text-indigo-400 mb-1 block font-bold flex items-center gap-1">
                            <Play size={12} /> Select a Reel
                        </label>
                        <select value={creatorForm.reel_id} onChange={e => { cu("reel_id", e.target.value); cu("engagement_rate", ""); cu("follower_count", ""); }}
                            className="w-full px-2 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-white text-xs focus:outline-none focus:border-indigo-500">
                            <option value="">No reel (Profile Avg)</option>
                            {reels.map(r => <option key={r.id} value={r.id}>{r.caption?.substring(0, 30) || "Video"}...</option>)}
                        </select>
                    </div>

                    {!creatorForm.reel_id && (
                        <>
                            {[
                                { label: "Followers Override", key: "follower_count", placeholder: "Auto" },
                                { label: "Engagement % Override", key: "engagement_rate", placeholder: "Auto" },
                            ].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                                    <input type="text" placeholder={placeholder} value={(creatorForm as any)[key]}
                                        onChange={e => cu(key, e.target.value)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500" />
                                </div>
                            ))}
                        </>
                    )}

                    {[
                        { label: "Audience (optional)", key: "audience_description", placeholder: "25-34 fitness fans" },
                    ].map(({ label, key, placeholder }) => (
                        <div key={key}>
                            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                            <input type="text" placeholder={placeholder} value={(creatorForm as any)[key]}
                                onChange={e => cu(key, e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                    ))}
                    <button onClick={handleFindMatches} disabled={matching || brands.length === 0}
                        className="w-full py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {matching ? <Loader size={12} className="animate-spin" /> : null}
                        {matching ? "Matching…" : "Find Matches"}
                    </button>
                    {brands.length === 0 && (
                        <p className="text-[10px] text-yellow-500 text-center">Add brands first ↗</p>
                    )}
                </div>

                {/* Matches */}
                <div className="md:col-span-3 space-y-3">
                    {loading ? (
                        <div className="card flex items-center justify-center py-16 text-gray-500 text-sm">
                            <Loader size={16} className="animate-spin mr-2" /> Loading…
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-sm mb-2">No matches yet.</p>
                            <p className="text-gray-600 text-xs">Add some brands and click "Find Matches".</p>
                        </div>
                    ) : matches.map((m: any) => (
                        <div key={m.id} className="card space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-white">{m.brand_name}</h3>
                                    <span className="text-xs text-gray-500 capitalize">{m.brand_industry}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-indigo-300">{(m.relevance_score * 100).toFixed(0)}%</div>
                                    <div className="text-[10px] text-gray-500">match</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span>Niche fit</span>
                                        <span className="text-white">{(m.niche_match * 100).toFixed(0)}%</span>
                                    </div>
                                    <ScoreBar value={m.niche_match || 0} color="#6366f1" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span>Audience overlap</span>
                                        <span className="text-white">{((m.audience_overlap || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                    <ScoreBar value={m.audience_overlap || 0} color="#22c55e" />
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm leading-relaxed">{m.fit_reasoning}</p>

                            {(m.budget_range_min || m.budget_range_max) && (
                                <p className="text-xs text-gray-600">
                                    Budget: <strong className="text-gray-400">
                                        ${m.budget_range_min?.toFixed(0) || "?"} – ${m.budget_range_max?.toFixed(0) || "?"}
                                    </strong>
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
