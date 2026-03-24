"use client";
import Link from "next/link";
import {
    BadgeDollarSign, ScrollText, PersonStanding, Sparkles,
    ArrowRight, Rocket, Target, Zap, ChevronRight, Brain
} from "lucide-react";

const tools = [
    {
        href: "/dashboard/accelerator/pricing",
        label: "Remotion Engine",
        icon: BadgeDollarSign,
        color: "#10b981",
        bg: "#d1fae5",
        desc: "Programmatically render unique, branded videos at scale using React and TypeScript code on Google Cloud Run.",
    },
    {
        href: "/dashboard/accelerator/scripts",
        label: "Gemini Cortex",
        icon: ScrollText,
        color: "#7c3aed",
        bg: "#ede9fe",
        desc: "Extract high-impact social hooks and blogs from massive enterprise reports using Gemini 2.5 Pro reasoning.",
    },
    {
        href: "/dashboard/accelerator/matching",
        label: "Imagen 4 Studio",
        icon: PersonStanding,
        color: "#f59e0b",
        bg: "#fef3c7",
        desc: "Generate 2K resolution, brand-safe visuals with digital watermarking and surgical conversational editing precision.",
    },
];

export default function AcceleratorOverview() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 tracking-tight">
            {/* Hero Section */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-violet-100"
                    style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                    <Sparkles size={12} /> The Multimodal Asset Factory
                </div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">
                    The Alchemist
                </h1>
                <p className="text-gray-500 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                    Dismantle the Human Bandwidth Bottleneck with autonomous agents coordinated via the <span className="text-violet-600 font-bold">A2A Protocol</span>.
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tools.map((tool) => (
                    <Link key={tool.href} href={tool.href} className="group flex flex-col h-full">
                        <div className="card h-full flex flex-col p-8 group-hover:shadow-2xl group-hover:translate-y-[-4px] transition-all duration-300 border-gray-100 relative overflow-hidden">
                            {/* Abstract bg element */}
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-violet-50 transition-colors duration-500" />

                            <div className="relative z-10 space-y-6 flex-1">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-50 group-hover:scale-110 transition-transform duration-300"
                                    style={{ background: tool.bg, color: tool.color }}>
                                    <tool.icon size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{tool.label}</h2>
                                    <p className="text-sm text-gray-500 leading-relaxed font-normal">{tool.desc}</p>
                                </div>
                            </div>

                            <div className="relative z-10 mt-8 pt-6 border-t border-gray-50 flex items-center justify-between text-violet-600">
                                <span className="text-xs font-black uppercase tracking-widest">Open Tool</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom Insight */}
            <div className="card bg-violet-600 text-white p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-violet-500/20">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0 animate-pulse">
                    <Brain size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight mb-2">Need a different size?</h3>
                    <p className="text-violet-100 font-medium">Use the Imagen 4 Studio with "Conversational Editing" to resize or modify assets for specific platform requirements in seconds.</p>
                </div>
                <Link href="/dashboard/accelerator/matching" className="btn bg-white text-violet-600 border-0 px-8 py-3 text-sm font-black hover:bg-violet-50 transition-all rounded-xl ml-auto">
                    Open Artist
                </Link>
            </div>
        </div>
    );
}
