"use client";
import { useState } from "react";
import { Image as ImageIcon, Sparkles, Loader2, Download } from "lucide-react";
import { enterpriseApi } from "@/lib/api";

export default function ImageStudioPage() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            // Using a dummy enterprise ID since multi-tenant auth isn't wired up in the demo yet
            const res = await enterpriseApi.generateImage("ent-demo-123", { prompt, aspect_ratio: "1:1" });
            if (res.data?.image_data) {
                setGeneratedImage(res.data.image_data);
            }
        } catch (error) {
            console.error("Failed to generate image:", error);
            alert("Failed to generate image. Please try again.");
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
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {isGenerating ? "Synthesizing..." : "Generate Image"}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="card shadow-sm ring-1 ring-gray-100 p-8 flex items-center justify-center min-h-[400px] h-full relative overflow-hidden bg-white">
                        {generatedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                    src={generatedImage}
                                    alt="Generated"
                                    className="max-w-full max-h-[500px] object-contain rounded-xl shadow-lg ring-1 ring-gray-200"
                                />
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            const a = document.createElement("a");
                                            a.href = generatedImage;
                                            a.download = `brand-asset-${Date.now()}.jpg`;
                                            a.click();
                                        }}
                                        className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-sm ring-1 ring-gray-200 text-gray-700 transition-all"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto ring-1 ring-pink-100">
                                    <ImageIcon size={24} className="text-pink-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">No Image Generated Yet</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">Enter a prompt and hit generate to create a new brand asset.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
