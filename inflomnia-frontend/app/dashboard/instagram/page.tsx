"use client";
import { useState, useEffect } from "react";
import { Instagram, RefreshCw, Zap, Heart, MessageCircle, Eye, Play, Clock, Star, ExternalLink, Loader, ChevronRight } from "lucide-react";

const CREATOR_ID = "demo-creator-001";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, opts?: RequestInit) {
    const r = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}

function StatPill({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Icon size={13} style={{ color }} />
            <div>
                <div className="text-[10px] text-gray-500">{label}</div>
                <div className="text-xs font-semibold text-white">{value ?? "—"}</div>
            </div>
        </div>
    );
}

function HookScore({ score }: { score: number | null }) {
    if (score == null) return null;
    const color = score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
    return (
        <div className="flex items-center gap-1.5">
            <Star size={11} style={{ color }} fill={color} />
            <span className="text-xs font-bold" style={{ color }}>{score.toFixed(1)}</span>
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
            setAccount(a);
            setToken("");
        } catch (err: any) {
            setError(err.message || "Failed to connect to Instagram.");
        }
        setLoading(false);
    }

    async function handleDisconnect() {
        setLoading(true);
        try {
            await apiFetch(`/api/v1/instagram/disconnect/${CREATOR_ID}`, { method: "POST" });
            setAccount(null);
            setReels([]);
            setAnalysis(null);
            setToken("");
        } catch (err: any) {
            setError(err.message || "Failed to disconnect.");
        }
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
            setAnalysis(r);
            await loadReels();
        } catch (err: any) { setError(err.message); }
        setAnalyzing(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Instagram size={22} className="text-pink-400" /> Instagram Reels
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Connect your account to analyze reel performance with Claude 3.5</p>
                </div>
                {account && (
                    <div className="flex gap-2">
                        <button onClick={handleSync} disabled={syncing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-gray-300 text-sm hover:bg-white/[0.10] transition-all">
                            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                            {syncing ? "Syncing…" : "Sync Reels"}
                        </button>
                        <button onClick={handleAnalyze} disabled={analyzing || reels.length === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/20 text-pink-300 text-sm hover:bg-pink-500/30 transition-all disabled:opacity-50">
                            {analyzing ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
                            {analyzing ? "Analyzing…" : "Analyze with Claude"}
                        </button>
                        <button onClick={handleDisconnect} disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all ml-4 border border-red-500/20">
                            Disconnect
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            {/* Connect form (shown when not connected) */}
            {!account ? (
                <div className="card max-w-lg mx-auto space-y-5">
                    <div className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                            <Instagram size={28} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Connect Instagram</h2>
                        <p className="text-gray-500 text-sm mt-1">Paste your access token to start analyzing your reels</p>
                    </div>

                    <div className="rounded-lg p-4 space-y-3 text-center" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <p className="text-sm font-semibold text-indigo-300">How to connect safely:</p>
                        <p className="text-xs text-gray-400">Provide an Instagram Graph API User Token. You can generate one via the Meta App Explorer.</p>
                        <button onClick={(e) => handleConnect(e, true)} disabled={loading}
                            type="button"
                            className="text-xs text-white bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded mt-2 transition-colors border border-white/10">
                            Just want to look around? Try Demo Mode
                        </button>
                    </div>

                    <form onSubmit={(e) => handleConnect(e, false)} className="pt-2 space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Access Token</label>
                            <textarea rows={2} value={token} onChange={e => setToken(e.target.value)}
                                placeholder="EAABwzLixnjYBO..."
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-pink-500 resize-none" />
                        </div>
                        <button type="submit" disabled={loading || !token}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100">
                            {loading ? <Loader size={16} className="animate-spin" /> : <Instagram size={16} />}
                            {loading ? "Connecting securely…" : "Log in with Instagram"}
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    {/* Account card */}
                    <div className="card flex items-center gap-4">
                        {account.profile_picture_url ? (
                            <img src={account.profile_picture_url} alt={account.username} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                                <Instagram size={20} className="text-white" />
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-white">@{account.username || "unknown"}</p>
                            <p className="text-xs text-gray-500">{account.name}</p>
                        </div>
                        <div className="ml-auto flex gap-6 text-center">
                            <div>
                                <div className="text-lg font-bold text-white">{account.followers_count?.toLocaleString() ?? "—"}</div>
                                <div className="text-[10px] text-gray-500">Followers</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-white">{reels.length}</div>
                                <div className="text-[10px] text-gray-500">Reels synced</div>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded text-[10px] font-semibold bg-green-500/20 text-green-400">Connected ✓</span>
                    </div>

                    {/* Claude analysis banner */}
                    {analysis && (
                        <div className="card space-y-3" style={{ borderColor: "rgba(236,72,153,0.3)" }}>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2"><Zap size={14} className="text-pink-400" /> Claude's Analysis</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{analysis.overall_insights}</p>
                            {analysis.top_performing && (
                                <div className="text-xs text-gray-500">
                                    <span className="text-yellow-400 font-semibold">🏆 Top pattern: </span>{analysis.top_performing}
                                </div>
                            )}
                            {analysis.recommended_posting_style && (
                                <div className="text-xs text-gray-500">
                                    <span className="text-indigo-400 font-semibold">💡 Recommendation: </span>{analysis.recommended_posting_style}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reels grid */}
                    {reels.length === 0 ? (
                        <div className="card text-center py-12 text-gray-500 text-sm">
                            <p>No reels synced yet.</p>
                            <button onClick={handleSync} className="mt-3 text-pink-400 text-xs underline">Sync now</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {reels.length} Reels
                            </h3>
                            {reels.map((reel: any) => (
                                <div key={reel.ig_media_id} className="card hover:border-white/15 transition-all">
                                    <div className="flex gap-4">
                                        {/* Thumbnail */}
                                        {reel.thumbnail_url ? (
                                            <img src={reel.thumbnail_url} alt="reel"
                                                className="w-20 h-28 object-cover rounded-lg flex-shrink-0" />
                                        ) : (
                                            <div className="w-20 h-28 rounded-lg flex-shrink-0 flex items-center justify-center"
                                                style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}>
                                                <Play size={20} className="text-pink-400" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 space-y-2">
                                            {/* Caption */}
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                                                    {reel.caption || <span className="text-gray-600 italic">No caption</span>}
                                                </p>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <HookScore score={reel.hook_quality_score} />
                                                    {reel.permalink && (
                                                        <a href={reel.permalink} target="_blank" rel="noreferrer"
                                                            className="text-gray-600 hover:text-white transition-colors">
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Metrics */}
                                            <div className="flex flex-wrap gap-2">
                                                <StatPill icon={Heart} label="Likes" value={(reel.like_count || 0).toLocaleString()} color="#ec4899" />
                                                <StatPill icon={MessageCircle} label="Comments" value={(reel.comments_count || 0).toLocaleString()} color="#a78bfa" />
                                                {reel.reach && <StatPill icon={Eye} label="Reach" value={reel.reach.toLocaleString()} color="#38bdf8" />}
                                                {reel.plays && <StatPill icon={Play} label="Plays" value={reel.plays.toLocaleString()} color="#fb923c" />}
                                                {reel.avg_watch_time_ms && (
                                                    <StatPill icon={Clock} label="Avg Watch" value={`${(reel.avg_watch_time_ms / 1000).toFixed(1)}s`} color="#4ade80" />
                                                )}
                                            </div>

                                            {/* Claude analysis note */}
                                            {reel.analysis_summary && (
                                                <p className="text-[11px] text-gray-500 flex items-start gap-1.5">
                                                    <ChevronRight size={11} className="text-pink-400 mt-0.5 flex-shrink-0" />
                                                    {reel.analysis_summary}
                                                </p>
                                            )}

                                            {/* Date */}
                                            {reel.published_at && (
                                                <p className="text-[10px] text-gray-600">
                                                    {new Date(reel.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
