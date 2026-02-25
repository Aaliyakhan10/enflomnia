"use client";
import Link from "next/link";
import { TrendingDown, Shield, Zap, ArrowRight } from "lucide-react";

const features = [
    {
        href: "/dashboard/reach",
        icon: TrendingDown,
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.1)",
        title: "Reach Health",
        desc: "Detects creator-specific vs platform-wide reach drops using cross-creator RAG comparison.",
        tag: "Anomaly Detection",
    },
    {
        href: "/dashboard/shield",
        icon: Shield,
        color: "#6366f1",
        bg: "rgba(99,102,241,0.1)",
        title: "Comment Shield",
        desc: "Filters toxic comments, spam, and bot-driven activity using Bedrock Agents + Guardrails.",
        tag: "Content Safety",
    },
    {
        href: "/dashboard/workload",
        icon: Zap,
        color: "#22c55e",
        bg: "rgba(34,197,94,0.1)",
        title: "Workload Signals",
        desc: "Analyses engagement patterns and recommends posting cadence via Claude 3.5 Sonnet.",
        tag: "Creator Wellness",
    },
];

export default function DashboardHome() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Hero */}
            <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 mb-4">
                    🛡️ Resilience Engine · Phase 1
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">The Shield</h1>
                <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                    AI-powered protection against platform volatility — built on Amazon Bedrock, Claude 3.5 Sonnet
                </p>
            </div>

            {/* AWS Stack Badge */}
            <div className="card flex flex-wrap gap-2 justify-center py-4">
                {["Bedrock Claude 3.5", "Bedrock Agents", "Bedrock Guardrails", "OpenSearch Serverless", "S3", "Lambda", "Amplify"].map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ background: "var(--surface-3)", color: "#a0a0c0", border: "1px solid var(--border)" }}>
                        ⚡ {s}
                    </span>
                ))}
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
