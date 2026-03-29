"use client";
import { useState, useEffect } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download, History, Globe } from "lucide-react";
import { enterpriseApi, userApi } from "@/lib/api";

export default function ImageStudioPage() {
    const [enterprise, setEnterprise] = useState<any>(null);
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        fetchProfileAndData();
    }, []);

    const fetchProfileAndData = async () => {
        try {
            const profileRes = await enterpriseApi.getMyProfile();
            const ent = profileRes.data;
            setEnterprise(ent);
            
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
            const res = await userApi.getHistory("image");
            setHistory(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerate = async () => {
        if (!enterprise || !prompt) return;
        setIsGenerating(true);
        try {
            const res = await enterpriseApi.generateImage(enterprise.id, { prompt, aspect_ratio: "1:1", count });
            if (res.data?.images) {
                setGeneratedImages(res.data.images);
                fetchHistory();
            }
        } catch (error) {
            console.error("Failed to generate images:", error);
            alert("Synthesis failed. Check information grounding.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!enterprise) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-pink-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <ImageIcon size={24} className="text-pink-500" />
                    Image Studio
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Workspace: <span className="font-bold text-pink-600">{enterprise.name}</span>
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                        {campaigns.length > 0 && (
                            <div>
                                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5 flex items-center gap-1.5"><Sparkles size={12} className="text-pink-500" /> Grounded Prompt</label>
                                <select 
                                    className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-pink-50/30 focus:bg-white transition-all outline-none text-gray-700"
                                    onChange={(e) => setPrompt(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Select campaign asset --</option>
                                    {campaigns.flatMap(c => c.proposed_scripts || []).filter(s => s && s.image_prompt).map((s, i) => (
                                        <option key={i} value={s.image_prompt}>{s.day}: {s.topic?.substring(0, 30)}...</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Creative Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate..."
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white transition-all outline-none resize-none h-32"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Image Variations</label>
                            <div className="flex gap-2">
                                {[1, 2, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCount(num)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${count === num
                                            ? "bg-pink-50 border-pink-200 text-pink-700 shadow-sm"
                                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? "Synthesizing..." : "Generate Images"}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-6 min-h-[400px] h-full relative overflow-auto bg-white">
                        {generatedImages.length > 0 ? (
                            <div className={`grid gap-6 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 group">
                                        <div className="relative w-full aspect-square flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200">
                                            <img
                                                src={img.image_url || img.image_data}
                                                alt={`Generated ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <a 
                                                    href={img.image_url || img.image_data} 
                                                    target="_blank"
                                                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm ring-1 ring-gray-200/50 text-gray-700 transition-all backdrop-blur-sm"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] text-gray-600 italic leading-relaxed">"{img.caption}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <ImageIcon size={48} className="mx-auto text-gray-100 mb-4" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Awaiting Synthesis</p>
                            </div>
                        )}
                        
                        {generatedImages.length > 0 && (
                            <div className="mt-8 p-4 bg-emerald-50 rounded-2xl flex items-center justify-between border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                        <Globe size={16} />
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Stored in Supabase Cloud Storage</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* History Section */}
            <div className="space-y-6 pt-12 border-t border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <History size={20} className="text-indigo-500" />
                        Production History
                    </h2>
                    <p className="text-xs text-gray-500">Persistent cloud-hosted brand assets.</p>
                </div>

                {loadingHistory ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="animate-spin text-gray-300" size={32} />
                    </div>
                ) : history.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {history.map((img, idx) => (
                            <div key={img.id || idx} className="group relative aspect-square bg-gray-50 rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-indigo-300 transition-all shadow-sm">
                                <img 
                                    src={img.image_url || img.image_data} 
                                    alt={img.prompt} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white text-center">
                                    <a 
                                        href={img.image_url || img.image_data} 
                                        target="_blank"
                                        className="text-[8px] font-bold uppercase tracking-widest hover:underline"
                                    >
                                        View in Storage Hub
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                        <ImageIcon size={32} className="mx-auto text-gray-300" />
                        <p className="text-sm text-gray-500 mt-2">Asset collection empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
