"use client";
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Minus, Loader, ChevronDown, Play } from "lucide-react";
import { pricingApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const PLATFORMS = ["instagram", "youtube", "tiktok"];
const DELIVERABLES = ["post", "reel", "story", "video"];
const NICHES = ["fitness", "beauty", "tech", "gaming", "food", "travel", "fashion", "finance", "education", "lifestyle", "general"];

const VERDICT_CONFIG = {
    great: { color: "#22c55e", label: "Great deal — above your range!", icon: TrendingUp },
    fair: { color: "#6366f1", label: "Fair deal — within range", icon: Minus },
    below_range: { color: "#f59e0b", label: "Slightly below range", icon: TrendingDown },
    low: { color: "#ef4444", label: "Low — negotiate up", icon: TrendingDown },
};

export default function PricingPage() {
    const [form, setForm] = useState({
        platform: "instagram", deliverable_type: "reel", reel_id: "",
        follower_count: "", engagement_rate: "",
        niche: "fitness", brand_name: "", offered_price: "",
    });
    const [reels, setReels] = useState<any[]>([]);
    const [result, setResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        instagramApi.getReels(CREATOR_ID).then(res => setReels(res.data)).catch(() => { });
    }, []);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"estimate" | "history">("estimate");

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

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
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign size={22} className="text-green-400" /> Brand Deal Pricing
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">Get a data-backed fair rate for any brand deal</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--surface-3)" }}>
                {(["estimate", "history"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); if (t === "history") loadHistory(); }}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${tab === t ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-white"
                            }`}>
                        {t === "estimate" ? "Get Estimate" : "History"}
                    </button>
                ))}
            </div>

            {tab === "estimate" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Auto-Pricing Panel */}
                    <div className="card space-y-4 self-start">
                        <h2 className="font-semibold text-white text-sm uppercase tracking-wider">AI Pricing Engine</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            We automatically analyze your synced Instagram profile, follower demographics, and recent Reel engagement to instantly calculate your optimum market rate.
                        </p>

                        <button onClick={handleEstimate} disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all">
                            {loading ? <Loader size={14} className="animate-spin" /> : <DollarSign size={14} />}
                            {loading ? "Calculating Rate…" : "Auto-Calculate Rate"}
                        </button>
                    </div>

                    {/* Result */}
                    <div className="space-y-4">
                        {result ? (
                            <>
                                {/* Price range */}
                                <div className="card">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Suggested Range</p>
                                    <div className="flex items-end gap-3 mb-2">
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500 mb-1">Min</div>
                                            <div className="text-2xl font-bold text-white">${result.suggested_price_min?.toFixed(0)}</div>
                                        </div>
                                        <div className="text-gray-600 text-xl mb-1">–</div>
                                        <div className="text-center">
                                            <div className="text-xs text-gray-500 mb-1">Max</div>
                                            <div className="text-2xl font-bold text-white">${result.suggested_price_max?.toFixed(0)}</div>
                                        </div>
                                        <div className="ml-auto text-center">
                                            <div className="text-xs text-gray-500 mb-1">Recommended</div>
                                            <div className="text-2xl font-bold text-green-400">${result.recommended_price?.toFixed(0)}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Confidence: <strong className="text-gray-300">{(result.confidence * 100).toFixed(0)}%</strong>
                                    </div>
                                </div>

                                {/* Verdict */}
                                {verdict && (
                                    <div className="card flex items-center gap-3" style={{ borderColor: `${verdict.color}30` }}>
                                        <verdict.icon size={18} style={{ color: verdict.color }} />
                                        <span className="text-sm font-medium" style={{ color: verdict.color }}>{verdict.label}</span>
                                        {result.offered_price && (
                                            <span className="text-xs text-gray-500 ml-auto">Offer: ${result.offered_price}</span>
                                        )}
                                    </div>
                                )}

                                {/* Reasoning */}
                                <div className="card">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Claude's Analysis</p>
                                    <p className="text-gray-300 text-sm leading-relaxed">{result.reasoning}</p>
                                </div>
                            </>
                        ) : (
                            <div className="card flex items-center justify-center h-64 text-gray-500 text-sm">
                                Fill in your details to get a price estimate
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* History */
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="card text-center py-10 text-gray-500 text-sm">No estimates yet.</div>
                    ) : history.map((h: any, i: number) => (
                        <div key={i} className="card flex items-center gap-6">
                            <div>
                                <div className="text-xs text-gray-500 capitalize">{h.platform} · {h.deliverable_type}</div>
                                <div className="font-semibold text-white">{h.niche}</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-xs text-gray-500">Range</div>
                                <div className="text-white font-semibold">${h.suggested_price_min?.toFixed(0)}–${h.suggested_price_max?.toFixed(0)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Recommended</div>
                                <div className="text-green-400 font-bold">${h.recommended_price?.toFixed(0)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
