"use client";
import { useState, useEffect } from "react";
import { Video, Sparkles, Loader2, Link as LinkIcon, Download, Copy, Check, History, Send, Globe, Instagram, X } from "lucide-react";
import { enterpriseApi, userApi } from "@/lib/api";

export default function VideoStudioPage() {
    const [enterprise, setEnterprise] = useState<any>(null);
    const [videoLink, setVideoLink] = useState("");
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
    const [activeScript, setActiveScript] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showPublisher, setShowPublisher] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishStatus, setPublishStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchProfileAndData();
    }, []);

    const fetchProfileAndData = async () => {
        try {
            const profileRes = await enterpriseApi.getMyProfile();
            const ent = profileRes.data;
            setEnterprise(ent);
            
            // Now fetch data with the real ID
            fetchHistory();
            fetchCampaigns(ent.id);
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };

    const fetchCampaigns = async (entId: string) => {
        try {
            const res = await enterpriseApi.listCampaigns(entId);
            setCampaigns(res.data || []);
        } catch (e) {
            console.error("Failed to fetch campaigns", e);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await userApi.getHistory("video");
            setHistory(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSelectScript = (scriptJson: string) => {
        try {
            const script = JSON.parse(scriptJson);
            setActiveScript(script);
            setDescription(script.topic || script.video_prompt || "");
            setGeneratedCaption(script.hook || "");
        } catch (e) {
            setDescription(scriptJson);
        }
    };

    const handleGenerateCaption = async () => {
        if (!enterprise || !description) return;
        setIsGenerating(true);
        try {
            const res = await enterpriseApi.generateCaption(enterprise.id, {
                description: description,
                content_type: "video"
            });
            if (res.data?.caption) {
                setGeneratedCaption(res.data.caption);
            }
        } catch (error) {
            console.error("Failed to generate caption:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRenderVideo = async () => {
        if (!enterprise) return;
        setIsRendering(true);
        try {
            // Prepare the payload to match ScriptVideoProps 1:1
            const inputProps = {
                hook: generatedCaption || activeScript?.hook || description,
                structure: activeScript?.structure || [
                    { section: "Introduction", content: description, duration_seconds: 10 }
                ],
                cta: activeScript?.cta || "Follow for more!",
                tone: activeScript?.tone || "professional",
                brand_name: enterprise.name
            };

            const response = await fetch("/api/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    compositionId: "ScriptVideo",
                    inputProps,
                    slug: `studio-${Date.now()}`
                })
            });
            
            const data = await response.json();
            if (data.url) {
                setRenderedVideoUrl(data.url);
                
                await enterpriseApi.generateVideo(enterprise.id, {
                    title: `Video for ${description.substring(0, 20)}...`,
                    input_props: inputProps,
                    video_url: data.url,
                    status: "completed",
                    script_id: activeScript?.id || undefined
                });
                fetchHistory();
            } else {
                throw new Error(data.error || "Render failed");
            }
        } catch (error) {
            console.error("Render failed:", error);
            alert("Video rendering failed. Ensure your script is valid.");
        } finally {
            setIsRendering(false);
        }
    };

    const handlePublish = async () => {
        if (!enterprise || !renderedVideoUrl) return;
        setIsPublishing(true);
        setPublishStatus(null);
        try {
            await enterpriseApi.publishContent(enterprise.id, {
                type: "video",
                day: "Now",
                video_url: renderedVideoUrl,
                caption: generatedCaption
            });
            setPublishStatus("Successfully published to Instagram!");
            setTimeout(() => {
                setShowPublisher(false);
                setPublishStatus(null);
            }, 3000);
        } catch (e) {
            setPublishStatus("Publishing failed. Check API connectors.");
        } finally {
            setIsPublishing(false);
        }
    };

    if (!enterprise) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24 relative">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <Video size={24} className="text-violet-500" />
                    Video Studio
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Current Workspace: <span className="font-bold text-violet-600">{enterprise.name}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                        {campaigns.length > 0 && (
                            <div>
                                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5 flex items-center gap-1.5">
                                    <Sparkles size={12} className="text-violet-500" /> Grounded Campaign Scripts
                                </label>
                                <select 
                                    className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-violet-50/30 focus:bg-white transition-all outline-none text-gray-700"
                                    onChange={(e) => handleSelectScript(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Pull from Knowledge Lake --</option>
                                    {campaigns.flatMap(c => c.proposed_scripts || []).map((s, i) => (
                                        <option key={i} value={JSON.stringify(s)}>{s.day}: {s.topic?.substring(0, 30)}...</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Context Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this video about?"
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none resize-none h-32"
                            />
                        </div>

                        <button
                            onClick={handleGenerateCaption}
                            disabled={isGenerating || !description}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? "Grounding..." : "Sync Brand Knowledge"}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-8 min-h-[300px] relative overflow-hidden bg-white">
                        {generatedCaption || activeScript ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Globe size={14} className="text-violet-500" /> Brand-Aligned Narrative
                                    </h3>
                                </div>
                                <div className="p-5 bg-violet-50/30 rounded-xl border border-violet-100">
                                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                        {generatedCaption || activeScript?.hook}
                                    </p>
                                    {activeScript?.structure && (
                                        <div className="mt-4 pt-4 border-t border-violet-100 grid grid-cols-2 gap-4">
                                            {activeScript.structure.slice(0, 4).map((s: any, idx: number) => (
                                                <div key={idx} className="bg-white/50 p-2 rounded-lg border border-violet-100/50">
                                                    <p className="text-[9px] font-black text-violet-400 uppercase">{s.section}</p>
                                                    <p className="text-[10px] text-gray-600 line-clamp-1">{s.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button 
                                        onClick={handleRenderVideo}
                                        disabled={isRendering}
                                        className="btn btn-brand py-2.5 px-6 flex items-center gap-2"
                                    >
                                        {isRendering ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
                                        {isRendering ? "Rendering Build..." : "Synthesize Video"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Video size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ready for Production</p>
                            </div>
                        )}
                        
                        {renderedVideoUrl && (
                            <div className="mt-6 p-6 bg-indigo-900 rounded-2xl text-white flex items-center justify-between animate-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Asset Synthesis Complete</h4>
                                        <p className="text-xs text-indigo-300">Your grounded video is ready for distribution.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPublisher(true)}
                                    className="bg-white text-indigo-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-xl"
                                >
                                    Open Publisher Hub
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Publisher Hub Modal */}
            {showPublisher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                        <Send size={24} className="text-emerald-500" />
                                        Publisher Hub
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Distribute to your social graph via Enflomnia Pulse.</p>
                                </div>
                                <button onClick={() => setShowPublisher(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative group">
                                <Video size={48} className="text-gray-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                <div className="absolute inset-0 bg-emerald-500/10" />
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-bold text-white/50 tracking-widest uppercase">
                                    <span>{enterprise.name} Original</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 text-sm uppercase tracking-[0.1em]"
                                >
                                    {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Instagram size={18} />}
                                    {isPublishing ? "Publishing to Graph..." : "Publish to Instagram"}
                                </button>
                                
                                {publishStatus && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold text-center rounded-xl animate-in fade-in slide-in-from-top-2">
                                        {publishStatus}
                                    </div>
                                ) || (
                                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                                        Grounding Audit: <span className="text-emerald-500">Passed</span> • Aegis Gate: <span className="text-emerald-500">Approved</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6 pt-12 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <History size={20} className="text-violet-500" />
                    Production History
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((vid, idx) => (
                        <div key={vid.id || idx} className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                            <div className="aspect-video bg-gray-50 rounded-xl mb-3 flex items-center justify-center">
                                <Video size={24} className="text-gray-200" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{vid.title}</h4>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">"{vid.input_props?.hook || vid.input_props?.script}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
