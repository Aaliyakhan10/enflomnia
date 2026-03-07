"use client";
import { useState, useEffect } from "react";
import {
    Instagram, RefreshCw, Sparkles, Heart, MessageCircle,
    Eye, Play, Clock, Star, ExternalLink, Loader2,
    ChevronRight, Zap, LogOut
} from "lucide-react";

const CREATOR_ID = "demo-creator-001";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, opts?: RequestInit) {
    const r = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
            <Icon size={12} style={{ color }} />
            <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{label}</div>
                <div className="text-xs font-bold text-gray-900 leading-tight">{value ?? "—"}</div>
            </div>
        </div>
    );
}

function HookScore({ score }: { score: number | null }) {
    if (score == null) return null;
    const color = score >= 8 ? "#059669" : score >= 6 ? "#d97706" : "#dc2626";
    const bg = score >= 8 ? "#d1fae5" : score >= 6 ? "#fef3c7" : "#fee2e2";
    return (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm" style={{ background: bg, color }}>
            <Star size={10} fill={color} />
            <span>{(score).toFixed(1)}</span>
        </div>
    );
}

export default function InstagramPage() {
    const [account, setAccount] = useState<any>(null);
    const [reels, setReels] = useState<any[]>([]);
    const [analysis, setAnalysis] = useState<any>(null);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch(`/api/v1/instagram/account/${CREATOR_ID}`)
            .then(a => { setAccount(a); loadReels(); })
            .catch(() => { });
    }, []);

    async function loadReels() {
        try {
            const r = await apiFetch(`/api/v1/instagram/reels/${CREATOR_ID}`);
            setReels(r);
        } catch { }
    }

    async function handleConnect(e: React.FormEvent, isDemo = false) {
        if (e) e.preventDefault();
        const finalToken = isDemo ? "mock-direct-connect-token" : token;
        if (!finalToken) return;

        setLoading(true); setError("");
        try {
            const a = await apiFetch(`/api/v1/instagram/connect`, {
                method: "POST",
                body: JSON.stringify({ creator_id: CREATOR_ID, access_token: finalToken }),
            });
            setAccount(a); loadReels(); setToken("");
        } catch (err: any) {
            setError(err.message || "Failed to connect to Instagram.");
        }
        setLoading(false);
    }

    async function handleDisconnect() {
        setLoading(true);
        try {
            await apiFetch(`/api/v1/instagram/disconnect/${CREATOR_ID}`, { method: "POST" });
            setAccount(null); setReels([]); setAnalysis(null); setToken("");
        } catch (err: any) { setError(err.message); }
        setLoading(false);
    }

    async function handleSync() {
        setSyncing(true);
        try {
            await apiFetch(`/api/v1/instagram/sync/${CREATOR_ID}`, { method: "POST" });
            await loadReels();
        } catch (err: any) { setError(err.message); }
        setSyncing(false);
    }

    async function handleAnalyze() {
        setAnalyzing(true);
        try {
            const r = await apiFetch(`/api/v1/instagram/analyze/${CREATOR_ID}`, { method: "POST" });
            setAnalysis(r); await loadReels();
        } catch (err: any) { setError(err.message); }
        setAnalyzing(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1">
                        <Instagram size={24} className="text-pink-500" />
                        My Reels
                    </h1>
                    <p className="text-sm text-gray-500">Connect your Instagram to get personalized AI strategies for every Reel.</p>
                </div>
                {account && (
                    <div className="flex gap-2">
                        <button onClick={handleSync} disabled={syncing}
                            className="btn btn-outline gap-2 px-4 shadow-sm">
                            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                            {syncing ? "Syncing..." : "Refresh Reels"}
                        </button>
                        <button onClick={handleAnalyze} disabled={analyzing || reels.length === 0}
                            className={`btn btn-brand gap-2 px-5 transition-all ${analyzing ? "opacity-75" : ""}`}
                            style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)" }}>
                            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {analyzing ? "Thinking..." : "Get AI Insights"}
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="card border-red-100 bg-red-50 text-red-600 text-sm py-3 px-4 flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {!account ? (
                <div className="card max-w-lg mx-auto py-10 px-8 text-center space-y-6 shadow-xl">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/20">
                        <Instagram size={40} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sync Your Content</h2>
                        <p className="text-gray-500 mt-2">Connect your Instagram to unlock Inflomnia's AI coach &amp; reach protection.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50 space-y-3">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Setup Guide</p>
                        <p className="text-xs text-indigo-900/70 leading-relaxed px-4">
                            You'll need a Graph API User Token from Meta. Not ready? Try our demo mode to see how it works.
                        </p>
                        <button onClick={(e) => handleConnect(e, true)} disabled={loading}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-2 px-4 rounded-lg border border-indigo-200 bg-white shadow-sm">
                            Launch Interactive Demo
                        </button>
                    </div>

                    <form onSubmit={(e) => handleConnect(e, false)} className="space-y-4 pt-2">
                        <div className="text-left">
                            <label className="text-[10px] uppercase font-bold text-gray-400 px-1 mb-1.5 block">Meta Access Token</label>
                            <textarea rows={2} value={token} onChange={e => setToken(e.target.value)}
                                placeholder="EAABwzLixnjYBO..."
                                className="font-mono text-xs shadow-inner" />
                        </div>
                        <button type="submit" disabled={loading || !token}
                            className="w-full btn btn-brand py-4 text-base font-bold shadow-lg shadow-pink-500/25 transition-transform hover:scale-[1.01]"
                            style={{ background: "linear-gradient(90deg, #ec4899, #8b5cf6)" }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Instagram size={18} />}
                            {loading ? "Establishing connection..." : "Connect Instagram"}
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    {/* Account Stats */}
                    <div className="card grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-md">
                        <div className="flex items-center gap-4 col-span-2">
                            <div className="relative">
                                {account.profile_picture_url ? (
                                    <img src={account.profile_picture_url} alt={account.username} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-gray-50 shadow-sm" />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
                                        <Instagram size={24} className="text-white" />
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center border-2 border-gray-50 shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 leading-none mb-1">@{account.username || "creator"}</h3>
                                <p className="text-xs text-gray-500 font-medium">{account.name || "Reeler"}</p>
                            </div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-100">
                            <div className="text-xl font-black text-gray-900 leading-none">{account.followers_count?.toLocaleString() ?? "—"}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Founders</div>
                        </div>
                        <div className="text-right">
                            <button onClick={handleDisconnect} disabled={loading}
                                className="btn btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 text-xs font-bold px-3">
                                <LogOut size={13} /> Disconnect
                            </button>
                        </div>
                    </div>

                    {/* AI Insight Highlight */}
                    {analysis && (
                        <div className="card bg-gradient-to-br from-violet-50 via-white to-pink-50 border-violet-100/50 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-violet-100/50">
                                    <Sparkles size={16} className="text-violet-600" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-900">Your AI Content Strategy</h3>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{analysis.overall_insights}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {analysis.top_performing && (
                                    <div className="p-3 rounded-xl bg-white/60 border border-violet-100/50">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                                            <Star size={10} className="text-amber-500" /> Best Performing
                                        </p>
                                        <p className="text-xs text-gray-800 font-medium">{analysis.top_performing}</p>
                                    </div>
                                )}
                                {analysis.recommended_posting_style && (
                                    <div className="p-3 rounded-xl bg-white/60 border border-violet-100/50">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                                            <Zap size={10} className="text-violet-500" /> Growth Tip
                                        </p>
                                        <p className="text-xs text-gray-800 font-medium">{analysis.recommended_posting_style}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reels Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                {reels.length} Content Pieces Synced
                            </h3>
                        </div>

                        {reels.length === 0 ? (
                            <div className="card text-center py-20 border-dashed border-2 bg-transparent">
                                <Film size={40} className="text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 text-sm font-medium">Reel feed is currently empty.</p>
                                <button onClick={handleSync} className="text-pink-500 font-bold text-xs mt-2 underline decoration-2 underline-offset-4">Refresh Feed</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {reels.map((reel: any) => (
                                    <div key={reel.ig_media_id} className="card group hover:shadow-lg transition-all duration-300">
                                        <div className="flex gap-5">
                                            {/* Media */}
                                            <div className="relative w-24 h-36 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 group-hover:scale-[1.02] transition-transform">
                                                {reel.thumbnail_url ? (
                                                    <img src={reel.thumbnail_url} alt="reel" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                        <Play size={24} />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <HookScore score={reel.hook_quality_score} />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <p className="text-gray-800 text-sm font-medium leading-relaxed line-clamp-2 pr-4">
                                                            {reel.caption || <span className="text-gray-300 font-normal italic">No caption provided</span>}
                                                        </p>
                                                        {reel.permalink && (
                                                            <a href={reel.permalink} target="_blank" rel="noreferrer"
                                                                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all shadow-sm">
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <StatPill icon={Heart} label="Likes" value={(reel.like_count || 0).toLocaleString()} color="#ec4899" />
                                                        <StatPill icon={MessageCircle} label="Comments" value={(reel.comments_count || 0).toLocaleString()} color="#8b5cf6" />
                                                        {(reel.reach > 0 || reel.plays > 0) && (
                                                            <StatPill icon={Eye} label={reel.reach > 0 ? "Reach" : "Plays"} value={(reel.reach || reel.plays || 0).toLocaleString()} color="#3b82f6" />
                                                        )}
                                                        {reel.avg_watch_time_ms && (
                                                            <StatPill icon={Clock} label="Average Watch" value={`${(reel.avg_watch_time_ms / 1000).toFixed(1)}s`} color="#10b981" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center gap-3">
                                                        {reel.published_at && (
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                {new Date(reel.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                            </span>
                                                        )}
                                                        <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                        <button className="text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors uppercase tracking-widest flex items-center gap-1 group/btn">
                                                            Reel Insights <ChevronRight size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* AI Summary hidden naturally unless card is expanded or noted */}
                                        {reel.analysis_summary && (
                                            <div className="mt-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-600 font-medium">
                                                    <div className="p-1 rounded-md bg-violet-50 flex-shrink-0 mt-0.5">
                                                        <Sparkles size={10} className="text-violet-500" />
                                                    </div>
                                                    <p>{reel.analysis_summary}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
