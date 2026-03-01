"use client";
import { useState, useEffect } from "react";
import { FileText, Copy, Check, Loader, ChevronRight, Play } from "lucide-react";
import { scriptsApi, instagramApi } from "@/lib/api";

const CREATOR_ID = "demo-creator-001";
const TONES = ["entertaining", "educational", "inspiring"];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <button onClick={copy} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.08] transition-all">
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
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

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (!form.topic && !form.reel_id) return;
        setLoading(true);
        try {
            const res = await scriptsApi.generate({
                creator_id: CREATOR_ID,
                topic: form.topic || undefined,
                reel_id: form.reel_id || undefined,
                brand_name: form.brand_name || undefined,
                brand_brief: form.brand_brief || undefined,
                tone: form.tone,
            });
            setResult(res.data);
        } catch { }
        setLoading(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText size={22} className="text-yellow-400" /> Script Generator
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">Claude 3.5 creates a full branded content script with hook, structure & CTA</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                {/* Auto-Generation Panel */}
                <div className="card space-y-4 md:col-span-2 self-start">
                    <h2 className="font-semibold text-white text-sm uppercase tracking-wider">AI Content Brief</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Inflomnia will automatically analyze your latest Instagram Reels and profile niche to generate a highly-engaging script in your unique voice.
                    </p>

                    <button onClick={handleGenerate} disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition-all disabled:opacity-50">
                        {loading ? <Loader size={14} className="animate-spin" /> : <FileText size={14} />}
                        {loading ? "Generating…" : "Auto-Generate Script"}
                    </button>
                </div>

                {/* Result */}
                <div className="md:col-span-3 space-y-4">
                    {result ? (
                        <>
                            {/* Hook */}
                            <div className="card" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">🪝 Hook</p>
                                    <CopyButton text={result.hook} />
                                </div>
                                <p className="text-white text-base leading-relaxed font-medium">"{result.hook}"</p>
                            </div>

                            {/* Script Sections */}
                            <div className="card space-y-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Script Structure</p>
                                {(result.structure || []).map((s: any, i: number) => (
                                    <div key={i} className="border-l-2 border-indigo-500/50 pl-4 pb-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-indigo-400 uppercase">{s.section}</span>
                                                {s.duration_seconds && (
                                                    <span className="text-[10px] text-gray-600 bg-white/[0.04] px-1.5 rounded">{s.duration_seconds}s</span>
                                                )}
                                            </div>
                                            <CopyButton text={s.content} />
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{s.content}</p>
                                        {s.tips && <p className="text-gray-600 text-xs mt-1 italic">💡 {s.tips}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="card" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider">📣 CTA</p>
                                    <CopyButton text={result.cta} />
                                </div>
                                <p className="text-white text-sm">{result.cta}</p>
                            </div>

                            {/* Tips */}
                            {result.tips?.length > 0 && (
                                <div className="card">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-bold">Delivery Tips</p>
                                    <ul className="space-y-1.5">
                                        {result.tips.map((tip: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                <ChevronRight size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card flex items-center justify-center h-72 text-gray-500 text-sm">
                            Enter a topic and click Generate Script
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
