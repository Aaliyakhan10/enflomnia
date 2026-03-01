"use client";
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, RefreshCw, Send, Loader } from "lucide-react";
import { commentsApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

const TABS = ["all", "spam", "toxic", "bot", "high-value", "safe"] as const;
type Tab = (typeof TABS)[number];

const BADGE_MAP: Record<string, string> = {
    spam: "badge-spam",
    toxic: "badge-toxic",
    bot: "badge badge-toxic",
    "high-value": "badge-high-value",
    safe: "badge-safe",
};



export default function ShieldPage() {
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
                commentsApi.getComments(CREATOR_ID, tab === "all" ? undefined : tab),
                commentsApi.getSummary(CREATOR_ID),
            ]);
            setComments(cRes.data);
            setSummary(sRes.data);
        } catch { }
        setLoading(false);
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try {
            await commentsApi.analyzeBatch(CREATOR_ID, []);
            fetchData();
        } catch { }
        setAnalyzing(false);
    }

    async function handleFeedback(id: string, decision: "approved" | "rejected") {
        try {
            await commentsApi.submitFeedback(id, decision);
            setComments(c => c.map(x => x.id === id ? { ...x, creator_feedback: decision } : x));
        } catch { }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield size={22} className="text-indigo-400" /> Comment Shield
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">AI-powered toxic, spam & bot filtering</p>
                </div>
                <button onClick={handleAnalyze} disabled={analyzing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all">
                    {analyzing ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
                    {analyzing ? "Analysing…" : "Run Shield Analysis"}
                </button>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-5 gap-3">
                {[
                    { key: "spam", label: "Spam", color: "#ef4444" },
                    { key: "toxic", label: "Toxic", color: "#f97316" },
                    { key: "bot", label: "Bot", color: "#a855f7" },
                    { key: "high_value", label: "High-Value", color: "#6366f1" },
                    { key: "safe", label: "Safe", color: "#22c55e" },
                ].map(({ key, label, color }) => (
                    <div key={key} className="card text-center py-3">
                        <div className="text-2xl font-bold" style={{ color }}>{summary[key] ?? 0}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--surface-3)" }}>
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${tab === t ? "bg-indigo-500 text-white" : "text-gray-400 hover:text-white"
                            }`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Comment Feed */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                    <Loader size={18} className="animate-spin mr-2" /> Loading…
                </div>
            ) : comments.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500 text-sm">No comments yet. Click "Run Demo Analysis" to test.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {comments.map((c) => (
                        <div key={c.id} className="card flex items-start gap-4">
                            {/* Badge */}
                            <span className={`badge ${BADGE_MAP[c.category] ?? "badge-safe"} mt-0.5`}>
                                {c.category}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm leading-relaxed">{c.content}</p>
                                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                                    <span>@{c.author}</span>
                                    <span>Confidence: {(c.confidence * 100).toFixed(0)}%</span>
                                    {c.engagement_score > 0 && <span>Engagement: {(c.engagement_score * 100).toFixed(0)}%</span>}
                                </div>
                            </div>

                            {/* Feedback controls */}
                            <div className="flex gap-2 flex-shrink-0">
                                {c.creator_feedback ? (
                                    <span className={`text-xs font-medium ${c.creator_feedback === "approved" ? "text-green-400" : "text-red-400"}`}>
                                        {c.creator_feedback === "approved" ? "✓ Approved" : "✗ Rejected"}
                                    </span>
                                ) : (
                                    <>
                                        <button onClick={() => handleFeedback(c.id, "approved")}
                                            title="Approve"
                                            className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                                            <CheckCircle size={15} />
                                        </button>
                                        <button onClick={() => handleFeedback(c.id, "rejected")}
                                            title="Reject"
                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                            <XCircle size={15} />
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
