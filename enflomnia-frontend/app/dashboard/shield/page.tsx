"use client";
import { useState, useEffect } from "react";
import {
    MessageCircle, CheckCircle, XCircle, Loader2, Shield,
    AlertCircle, RefreshCw
} from "lucide-react";
import { commentsApi } from "@/lib/api";
import { useAccount } from "@/lib/account-context";

const TABS = ["all", "spam", "toxic", "bot", "high-value", "safe"] as const;
type Tab = (typeof TABS)[number];

const BADGE_MAP: Record<string, string> = {
    spam: "badge-spam", toxic: "badge-toxic",
    bot: "badge-bot", "high-value": "badge-high-value", safe: "badge-safe",
};

const TAB_STYLES: Record<string, { active: string; dot: string }> = {
    all: { active: "bg-violet-600 text-white", dot: "#7c3aed" },
    spam: { active: "bg-red-500 text-white", dot: "#dc2626" },
    toxic: { active: "bg-amber-500 text-white", dot: "#d97706" },
    bot: { active: "bg-purple-500 text-white", dot: "#7c3aed" },
    "high-value": { active: "bg-blue-500 text-white", dot: "#2563eb" },
    safe: { active: "bg-emerald-500 text-white", dot: "#059669" },
};

export default function ShieldPage() {
    const { creatorId } = useAccount();
    const [tab, setTab] = useState<Tab>("all");
    const [comments, setComments] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => { fetchData(); }, [tab]);

    async function fetchData() {
        setLoading(true);
        try {
            const [cRes, sRes] = await Promise.all([
                commentsApi.getComments(creatorId, tab === "all" ? undefined : tab),
                commentsApi.getSummary(creatorId),
            ]);
            setComments(cRes.data);
            setSummary(sRes.data);
        } catch { }
        setLoading(false);
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try { await commentsApi.syncFromInstagram(creatorId); fetchData(); } catch { }
        setAnalyzing(false);
    }

    async function handleFeedback(id: string, decision: "approved" | "rejected") {
        try {
            await commentsApi.submitFeedback(id, decision);
            setComments(c => c.map(x => x.id === id ? { ...x, creator_feedback: decision } : x));
        } catch { }
    }

    const stats = [
        { key: "spam", label: "Risk Mitigated", emoji: "🚫", color: "#dc2626", bg: "#fee2e2" },
        { key: "toxic", label: "Compliance Check", emoji: "☠️", color: "#d97706", bg: "#fef3c7" },
        { key: "bot", label: "Legal Guard", emoji: "🤖", color: "#7c3aed", bg: "#ede9fe" },
        { key: "high_value", label: "Brand Aligned", emoji: "⭐", color: "#2563eb", bg: "#dbeafe" },
        { key: "safe", label: "Compliant", emoji: "✅", color: "#059669", bg: "#d1fae5" },
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
                        <Shield size={22} style={{ color: "#7c3aed" }} />
                        The Aegis: Sentinel Immune System
                    </h1>
                    <p className="text-sm text-gray-500">
                        An autonomous compliance layer that auto-corrects risky language to ensure 100% legal safety in milliseconds.
                    </p>
                </div>
                <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-brand gap-2">
                    {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                    {analyzing ? "Defending…" : "Pulse Scan"}
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-5 gap-3">
                {stats.map(({ key, label, emoji, color, bg }) => (
                    <div key={key} className="card text-center py-5 hover:scale-[1.02] transition-transform cursor-default"
                        style={{ borderColor: color + "25" }}>
                        <div className="text-2xl mb-1">{emoji}</div>
                        <div className="text-2xl font-bold" style={{ color }}>{summary[key] ?? 0}</div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 p-1.5 rounded-xl bg-gray-100 w-fit">
                {TABS.map(t => {
                    const active = tab === t;
                    return (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${active ? TAB_STYLES[t].active : "text-gray-500 hover:text-gray-700 hover:bg-white"
                                }`}>
                            {t}
                        </button>
                    );
                })}
            </div>

            {/* Comments */}
            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2.5 text-gray-400">
                    <Loader2 size={18} className="animate-spin text-violet-400" /> Loading comments…
                </div>
            ) : comments.length === 0 ? (
                <div className="card text-center py-16">
                    <MessageCircle size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="font-semibold text-gray-500">No comments here yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click &ldquo;Scan Comments&rdquo; to analyse your audience.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {comments.map(c => (
                        <div key={c.id} className="card flex items-start gap-4">
                            <span className={`badge ${BADGE_MAP[c.category] ?? "badge-safe"} mt-0.5 flex-shrink-0`}>
                                {c.category}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 leading-relaxed">{c.content}</p>
                                <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                                    <span>@{c.author}</span>
                                    <span>Confidence: {(c.confidence * 100).toFixed(0)}%</span>
                                    {c.engagement_score > 0 &&
                                        <span>Engagement: {(c.engagement_score * 100).toFixed(0)}%</span>}
                                </div>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                {c.creator_feedback ? (
                                    <span className={`text-xs font-semibold ${c.creator_feedback === "approved" ? "text-emerald-600" : "text-red-500"}`}>
                                        {c.creator_feedback === "approved" ? "✓ Approved" : "✗ Removed"}
                                    </span>
                                ) : (
                                    <>
                                        <button onClick={() => handleFeedback(c.id, "approved")} title="Approve"
                                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all">
                                            <CheckCircle size={14} />
                                        </button>
                                        <button onClick={() => handleFeedback(c.id, "rejected")} title="Remove"
                                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 transition-all">
                                            <XCircle size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
