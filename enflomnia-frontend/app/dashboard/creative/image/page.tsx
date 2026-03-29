"use client";
import { useState, useEffect } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download, History } from "lucide-react";
import { enterpriseApi, userApi } from "@/lib/api";

const ENTERPRISE_ID = "00000000-0000-0000-0000-000000000000";

export default function ImageStudioPage() {
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await enterpriseApi.listCampaigns(ENTERPRISE_ID);
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
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const res = await enterpriseApi.generateImage(ENTERPRISE_ID, { prompt, aspect_ratio: "1:1", count });
            if (res.data?.images) {
                setGeneratedImages(res.data.images);
                // Refresh history to include new images
                fetchHistory();
            }
        } catch (error) {
            console.error("Failed to generate images:", error);
            alert("Failed to generate images. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <ImageIcon size={24} className="text-pink-500" />
                    Image Studio
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Multi-Modal Synthesis: Generate brand-aligned, compliance-checked imagery powered by your Vault's Information Grounding.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                        {campaigns.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5"><Sparkles size={14} className="text-pink-500" /> Use Campaign Prompt</label>
                                <select 
                                    className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-pink-50/30 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none text-gray-700"
                                    onChange={(e) => setPrompt(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Select generated asset prompt --</option>
                                    {campaigns.flatMap(c => c.proposed_scripts || []).filter(s => s && s.image_prompt).map((s, i) => (
                                        <option key={i} value={s.image_prompt}>{s.day}: {s.topic ? s.topic.substring(0, 40) + '...' : 'Prompt'}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Creative Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate..."
                                className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none h-32"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Image Variations</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCount(num)}
                                        className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${count === num
                                            ? "bg-pink-50 border-pink-200 text-pink-700 shadow-sm"
                                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
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
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                src={img.image_data}
                                                alt={`Generated ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const a = document.createElement("a");
                                                        a.href = img.image_data;
                                                        a.download = `brand-asset-${Date.now()}-${idx + 1}.jpg`;
                                                        a.click();
                                                    }}
                                                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm ring-1 ring-gray-200/50 text-gray-700 transition-all backdrop-blur-sm"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl ring-1 ring-gray-100">
                                            <p className="text-xs text-gray-600 italic leading-relaxed">"{img.caption}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center space-y-3 h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto ring-1 ring-pink-100">
                                    <ImageIcon size={24} className="text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">No Images Generated Yet</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[250px] mx-auto">Enter a prompt and hit generate to create new AI-tailored brand assets.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* History Section */}
            <div className="space-y-6 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <History size={20} className="text-indigo-500" />
                            Recent Generations
                        </h2>
                        <p className="text-xs text-gray-500">Your AI-generated brand assets synced across the Enflomnia Nervous System.</p>
                    </div>
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
                                    src={img.image_data} 
                                    alt={img.prompt} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                                    <p className="text-[10px] font-medium line-clamp-2 mb-2 italic">"{img.prompt}"</p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const a = document.createElement("a");
                                                a.href = img.image_data;
                                                a.download = `history-${img.id || idx}.jpg`;
                                                a.click();
                                            }}
                                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                                        >
                                            <Download size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                        <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No assets in your collection yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
