"use client";
import Link from "next/link";
import { DollarSign, FileText, Users, ArrowRight, Rocket } from "lucide-react";

const features = [
    {
        href: "/dashboard/accelerator/pricing",
        icon: DollarSign,
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
        title: "Brand Deal Pricing",
        desc: "Get a data-backed fair price range for any brand deal — based on your platform, niche, engagement rate, and follower count.",
        tag: "Monetization",
    },
    {
        href: "/dashboard/accelerator/scripts",
        icon: FileText,
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        title: "Script Generator",
        desc: "Claude 3.5 creates a full branded content script with hook, structured sections, CTA, and delivery tips.",
        tag: "Content Creation",
    },
    {
        href: "/dashboard/accelerator/matching",
        icon: Users,
        color: "#6366f1",
        bg: "rgba(99,102,241,0.1)",
        title: "Brand Matching",
        desc: "Finds brands that fit your audience and content style — scored by niche relevance, audience overlap, and budget fit.",
        tag: "Partnerships",
    },
];

export default function AcceleratorHome() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Hero */}
            <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 mb-4">
                    <Rocket size={12} /> Monetization Hub
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">Monetization Tools</h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                    Fair pricing, better scripts, and the right brand partners — all powered by Claude 3.5 Sonnet
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {features.map(({ href, icon: Icon, color, bg, title, desc, tag }) => (
                    <Link key={href} href={href}
                        className="card group hover:border-white/20 transition-all hover:-translate-y-0.5 cursor-pointer block">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: bg }}>
                                <Icon size={20} style={{ color }} />
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">{tag}</span>
                        </div>
                        <h3 className="font-bold text-white mb-1.5 text-base">{title}</h3>
                        <p className="text-gray-500 text-xs leading-relaxed mb-4">{desc}</p>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
                            Open Panel <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
