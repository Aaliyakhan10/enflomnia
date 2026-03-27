"use client";
import { useState } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download } from "lucide-react";
import { enterpriseApi } from "@/lib/api";

export default function ImageStudioPage() {
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<{ image_data: string, caption: string }[]>([]);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            // Using a dummy enterprise ID since multi-tenant auth isn't wired up in the demo yet
            const res = await enterpriseApi.generateImage("ent-demo-123", { prompt, aspect_ratio: "1:1", count });
            if (res.data?.images) {
                setGeneratedImages(res.data.images);
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
        </div>
    );
}
