"use client";
import { useState, useEffect } from "react";
import {
    BadgeDollarSign, TrendingUp, TrendingDown, Minus,
    Loader2, ChevronDown, Play, Sparkles, History,
    CheckCircle2, AlertCircle, Coins
} from "lucide-react";
import { pricingApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const VERDICT_CONFIG = {
    great: { color: "#059669", label: "Great Deal! Above your market rate.", icon: TrendingUp, bg: "#d1fae5" },
    fair: { color: "#7c3aed", label: "Fair Deal — within your range.", icon: Minus, bg: "#ede9fe" },
    below_range: { color: "#d97706", label: "Slightly below your usual rate.", icon: TrendingDown, bg: "#fef3c7" },
    low: { color: "#dc2626", label: "Low Offer — we recommend negotiating.", icon: TrendingDown, bg: "#fee2e2" },
};

export default function PricingPage() {
    const [form, setForm] = useState({
        platform: "instagram", deliverable_type: "reel", reel_id: "",
        follower_count: "", engagement_rate: "",
        niche: "lifestyle", brand_name: "", offered_price: "",
    });
    const [reels, setReels] = useState<any[]>([]);
    const [result, setResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"estimate" | "history">("estimate");

    useEffect(() => {
        instagramApi.getReels(CREATOR_ID).then(res => setReels(res.data)).catch(() => { });
    }, []);

    async function handleEstimate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await pricingApi.estimate({
                creator_id: CREATOR_ID,
                platform: form.platform,
                deliverable_type: form.deliverable_type,
                reel_id: form.reel_id || undefined,
                follower_count: form.follower_count ? parseInt(form.follower_count) : undefined,
                engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) / 100 : undefined,
                niche: form.niche,
                brand_name: form.brand_name || undefined,
                offered_price: form.offered_price ? parseFloat(form.offered_price) : undefined,
            });
            setResult(res.data);
        } catch { }
        setLoading(false);
    }

    async function loadHistory() {
        try {
            const res = await pricingApi.getHistory(CREATOR_ID);
            setHistory(res.data?.items || []);
        } catch { }
    }

    const verdict = result?.deal_verdict ? VERDICT_CONFIG[result.deal_verdict as keyof typeof VERDICT_CONFIG] : null;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <BadgeDollarSign size={24} className="text-emerald-500" />
                        Deal Pricing
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Never undercharge again. Inflomnia AI uses real market data to calculate exactly what you should be paid.
                    </p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                    <button onClick={() => setTab("estimate")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "estimate" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Get Estimate
                    </button>
                    <button onClick={() => { setTab("history"); loadHistory(); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "history" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        Recent Estimates
                    </button>
                </div>
            </div>

            {tab === "estimate" ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Input Side */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card space-y-6 shadow-md border-emerald-50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-emerald-50">
                                    <Sparkles size={16} className="text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-900 uppercase tracking-tight">AI Valuation Engine</h3>
                            </div>

                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                Inflomnia analyses your latest Reels, reach trends, and niche demand to find your optimum market rate.
                            </p>

                            <form onSubmit={handleEstimate} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1 block">Brand Name (Optional)</label>
                                    <input type="text" placeholder="e.g. Nike" value={form.brand_name}
                                        onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                                        className="transition-all focus:border-emerald-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1 block">Niche</label>
                                        <select value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                                            className="transition-all focus:border-emerald-500">
                                            {["lifestyle", "fitness", "beauty", "tech", "gaming", "food", "fashion"].map(n => (
                                                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1 block">Your Offer (Optional)</label>
                                        <input type="number" placeholder="$0.00" value={form.offered_price}
                                            onChange={e => setForm(f => ({ ...f, offered_price: e.target.value }))}
                                            className="transition-all focus:border-emerald-500" />
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full btn btn-brand py-3.5 text-base font-bold shadow-lg shadow-emerald-500/20 mt-4 transition-transform hover:scale-[1.01]"
                                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Coins size={18} />}
                                    {loading ? "Calculating market value..." : "Get Fair Market Rate"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Result Side */}
                    <div className="lg:col-span-3 space-y-6">
                        {result ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* The Big Number Card */}
                                <div className="card relative overflow-hidden bg-white shadow-xl border-violet-100/50 pt-10 pb-10 text-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-violet-500" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Recommended Fair Rate</p>
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <div className="text-lg font-bold text-gray-300">$</div>
                                        <div className="text-6xl font-black text-gray-900 tracking-tighter">
                                            {result.recommended_price?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-50 max-w-xs mx-auto">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Safe Min</p>
                                            <p className="text-lg font-bold text-gray-700">${result.suggested_price_min?.toLocaleString()}</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-gray-100" />
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Premium Max</p>
                                            <p className="text-lg font-bold text-gray-700">${result.suggested_price_max?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Verdict Alert */}
                                {verdict && (
                                    <div className="card flex items-center gap-4 py-4 shadow-md transition-all border-0 ring-1 ring-inset"
                                        style={{ borderColor: verdict.color + '20', background: verdict.bg + '30' }}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: verdict.bg, color: verdict.color }}>
                                            <verdict.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold" style={{ color: verdict.color }}>{verdict.label}</p>
                                            {form.offered_price && <p className="text-[11px] text-gray-500 font-medium">Based on your offer of ${parseFloat(form.offered_price).toLocaleString()}</p>}
                                        </div>
                                        <div className="text-right px-4 border-l border-gray-100/50">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Confidence</p>
                                            <p className="text-sm font-black text-gray-900">{(result.confidence * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                )}

                                {/* AI Reasoning */}
                                <div className="card bg-gray-50 border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-white border border-gray-100">
                                            <Sparkles size={14} className="text-violet-500" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Inflomnia AI Breakdown</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{result.reasoning}&rdquo;</p>
                                </div>
                            </div>
                        ) : (
                            <div className="card h-full flex flex-col items-center justify-center py-20 bg-gray-50 border-dashed border-2">
                                <BadgeDollarSign size={48} className="text-gray-200 mb-4" />
                                <h4 className="font-bold text-gray-400">Ready to Price Your Work?</h4>
                                <p className="text-xs text-gray-400 mt-1">Enter deal details to see your AI valuation.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* History List */
                <div className="grid grid-cols-1 gap-4">
                    {history.length === 0 ? (
                        <div className="card py-20 text-center border-dashed border-2 bg-transparent overflow-hidden">
                            <History size={40} className="text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-400 font-medium">No previous estimates found.</p>
                        </div>
                    ) : history.map((h: any, i: number) => (
                        <div key={i} className="card group hover:shadow-lg transition-all border-gray-100 flex items-center gap-6 py-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-violet-50 group-hover:text-violet-500 transition-colors">
                                <BadgeDollarSign size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h.platform} · {h.deliverable_type}</div>
                                <div className="text-sm font-bold text-gray-900">{h.brand_name || h.niche}</div>
                            </div>
                            <div className="text-right pr-6 border-r border-gray-50">
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Fair Range</div>
                                <div className="text-sm font-bold text-gray-900">${h.suggested_price_min?.toLocaleString()}–${h.suggested_price_max?.toLocaleString()}</div>
                            </div>
                            <div className="text-right pr-4">
                                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">Recommended</div>
                                <div className="text-xl font-black text-emerald-600">${h.recommended_price?.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
