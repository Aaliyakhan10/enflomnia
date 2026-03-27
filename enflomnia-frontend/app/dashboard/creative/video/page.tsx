"use client";
import { useState } from "react";
import { Video, Sparkles, Loader2, Link as LinkIcon, Download, Copy, Check } from "lucide-react";
import { enterpriseApi } from "@/lib/api";

const DEMO_ENTERPRISE_ID = "demo-enterprise-001";

export default function VideoStudioPage() {
    const [videoLink, setVideoLink] = useState("");
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

    const handleGenerateCaption = async () => {
        if (!description) return;
        setIsGenerating(true);
        try {
            const res = await enterpriseApi.generateCaption(DEMO_ENTERPRISE_ID, {
                description: description,
                content_type: "video"
            });
            if (res.data?.caption) {
                setGeneratedCaption(res.data.caption);
            }
        } catch (error) {
            console.error("Failed to generate caption:", error);
            alert("Failed to generate caption. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedCaption) {
            navigator.clipboard.writeText(generatedCaption);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRenderVideo = async () => {
        setIsRendering(true);
        try {
            const response = await fetch("/api/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    compositionId: "ScriptVideo",
                    inputProps: {
                        script: description,
                        images: videoLink ? [videoLink] : [],
                        caption: generatedCaption || "Enflomnia Original"
                    },
                    slug: `video-${Date.now()}`
                })
            });
            const data = await response.json();
            if (data.url) {
                setRenderedVideoUrl(data.url);
            } else {
                throw new Error(data.error || "Render failed");
            }
        } catch (error) {
            console.error("Render failed:", error);
            alert("Video rendering failed. Check console for details.");
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <Video size={24} className="text-violet-500" />
                    Video Studio
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Scalable Production: Finalize your video assets with AI-generated, brand-aligned captions ready for publishing.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Video Asset Link (Optional)</label>
                            <div className="relative">
                                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={videoLink}
                                    onChange={(e) => setVideoLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Video Context / Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What happens in this video? What is the core message or CTA?"
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none resize-none h-32"
                            />
                        </div>

                        <button
                            onClick={handleGenerateCaption}
                            disabled={isGenerating || !description}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? "Generating..." : "Generate AI Caption"}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    {videoLink && (
                        <div className="card border-none shadow-sm ring-1 ring-gray-100 bg-gray-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center group">
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent z-10"></div>
                            <Video size={48} className="text-gray-700 absolute z-0" />
                            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                                <div>
                                    <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 text-[10px] font-bold rounded-lg uppercase tracking-wider backdrop-blur-md ring-1 ring-violet-500/50">Preview Mode</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card shadow-sm ring-1 ring-gray-100 p-8 min-h-[250px] relative overflow-hidden bg-white">
                        {generatedCaption ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} className="text-violet-500" />
                                        AI-Generated Caption
                                    </h3>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold transition-colors ring-1 ring-gray-200"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        {copied ? "Copied!" : "Copy Text"}
                                    </button>
                                </div>
                                <div className="p-5 bg-violet-50/50 rounded-xl border border-violet-100">
                                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                        {generatedCaption}
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button 
                                        onClick={handleRenderVideo}
                                        disabled={isRendering}
                                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                                    >
                                        {isRendering ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                                        {isRendering ? "Rendering..." : "Render with Remotion"}
                                    </button>
                                    <button className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all">
                                        Send to Publisher Studio
                                    </button>
                                </div>
                                {renderedVideoUrl && (
                                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                                <Download size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Video Rendered Successfully</p>
                                                <a href={renderedVideoUrl} target="_blank" className="text-xs text-emerald-600 font-medium hover:underline">Download MP4 Asset</a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-3 h-full flex flex-col items-center justify-center my-8">
                                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto ring-1 ring-violet-100">
                                    <Video size={24} className="text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">No Caption Generated Yet</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">Describe the video context to generate an engaging, platform-ready caption.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
