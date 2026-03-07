"use client";
import { useState, useEffect } from "react";
import {
    ScrollText, Copy, Check, Loader2, ChevronRight,
    Play, Sparkles, MessageSquare, Zap, Clock,
    Video, Layout, List
} from "lucide-react";
import { scriptsApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <button onClick={copy} className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 shadow-sm grow-0">
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
    );
}

export default function ScriptsPage() {
    const [form, setForm] = useState({
        topic: "", brand_name: "", brand_brief: "", tone: "entertaining", reel_id: "",
    });
    const [reels, setReels] = useState<any[]>([]);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        instagramApi.getReels(CREATOR_ID).then(res => setReels(res.data)).catch(() => { });
    }, []);

    async function handleAutoGenerate() {
        setLoading(true);
        try {
            const res = await scriptsApi.generate({
                creator_id: CREATOR_ID,
                tone: form.tone,
            });
            setResult(res.data);
        } catch { }
        setLoading(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <ScrollText size={24} className="text-amber-500" />
                        Script Writer
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Inflomnia AI drafts high-converting scripts based on your unique voice and current trending formats.
                    </p>
                </div>
                <button onClick={handleAutoGenerate} disabled={loading}
                    className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-amber-500/20"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? "Drafting script..." : "Auto-Draw My Next Script"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Brief Side */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card space-y-5 shadow-sm border-amber-50">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Layout size={16} />
                            </div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Content Brief</h3>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium italic">
                            &ldquo;Our AI analyzes your top-performing Reels to replicate your charisma and hook-style automatically.&rdquo;
                        </p>

                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block">Video Tone</label>
                                <div className="flex gap-2">
                                    {["Entertaining", "Educational", "Inspiring"].map(t => (
                                        <button key={t} onClick={() => setForm(f => ({ ...f, tone: t.toLowerCase() }))}
                                            className={`flex-1 py-2 px-1 rounded-xl text-[10px] font-bold uppercase transition-all border ${form.tone === t.toLowerCase()
                                                ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                                                : "bg-white border-gray-100 text-gray-400 hover:border-amber-100"
                                                }`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 px-1 mb-1.5 block text-left">Manual Topic (Optional)</label>
                                <textarea rows={2} placeholder="e.g. 5 Morning Habits for Creators"
                                    className="resize-none shadow-inner"
                                    value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm space-y-4 bg-gray-50 border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Script Ingredients</h4>
                        {[
                            { icon: Zap, label: "0-3s High Retention Hook", color: "#f59e0b" },
                            { icon: List, label: "Engagement-Led Structure", color: "#7c3aed" },
                            { icon: MessageSquare, label: "Call-to-Action (CTA)", color: "#10b981" }
                        ].map((ing, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="p-1 rounded bg-white border border-gray-100 shadow-sm" style={{ color: ing.color }}>
                                    <ing.icon size={11} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-600 tracking-tight">{ing.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Result Side */}
                <div className="lg:col-span-3 space-y-6">
                    {result ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* Hook Card */}
                            <div className="card shadow-md border-amber-100/50 bg-gradient-to-br from-white to-amber-50/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                                            <Zap size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Killer Hook</span>
                                    </div>
                                    <CopyButton text={result.hook} />
                                </div>
                                <p className="text-lg font-bold text-gray-900 leading-tight">&ldquo;{result.hook}&rdquo;</p>
                            </div>

                            {/* Structure */}
                            <div className="card shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Script Breakdown</span>
                                </div>

                                <div className="space-y-6">
                                    {(result.structure || []).map((s: any, i: number) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-violet-100">
                                            <div className="absolute top-0 -left-[5px] w-2 h-2 rounded-full bg-violet-400 border-2 border-white shadow-sm" />
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{s.section}</span>
                                                    {s.duration_seconds && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 text-[9px] font-bold text-gray-400 border border-gray-100">
                                                            <Clock size={8} /> {s.duration_seconds}s
                                                        </div>
                                                    )}
                                                </div>
                                                <CopyButton text={s.content} />
                                            </div>
                                            <p className="text-sm text-gray-800 leading-relaxed font-medium">{s.content}</p>
                                            {s.tips && (
                                                <div className="mt-2 text-[11px] text-gray-500 flex items-start gap-1.5 italic font-medium leading-relaxed">
                                                    <div className="p-0.5 rounded bg-amber-50 mt-0.5">
                                                        <Sparkles size={10} className="text-amber-500" />
                                                    </div>
                                                    {s.tips}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="card border-emerald-100 bg-emerald-50/20 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                                            <MessageSquare size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Call to Action</span>
                                    </div>
                                    <CopyButton text={result.cta} />
                                </div>
                                <p className="text-sm font-bold text-gray-800">{result.cta}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card h-full flex flex-col items-center justify-center py-20 bg-gray-50 border-dashed border-2">
                            <Video size={48} className="text-gray-100 mb-4" />
                            <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[11px]">Ready to Film?</h4>
                            <p className="text-xs text-gray-400 mt-1">Select your tone and let Inflomnia write your next hit.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
