"use client";
import { useState, useEffect } from "react";
import {
    Database, Plug, BookOpen, Table2, Shield,
    RefreshCw, ArrowRight, Loader2, Plus, CheckCircle2,
    AlertTriangle, Cloud, Lock, Eye
} from "lucide-react";
import { enterpriseApi } from "@/lib/api";

const DEMO_ENTERPRISE_ID = "demo-enterprise-001";

export default function VaultPage() {
    const [enterprise, setEnterprise] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => { loadEnterprise(); }, []);

    async function loadEnterprise() {
        setLoading(true);
        try {
            const res = await enterpriseApi.get(DEMO_ENTERPRISE_ID);
            if (res.data && !res.data.error) {
                setEnterprise(res.data);
            }
        } catch { }
        setLoading(false);
    }

    async function createDemo() {
        setCreating(true);
        try {
            await enterpriseApi.register({
                name: "Enflomnia Enterprise",
                industry: "technology",
                brand_guidelines: "Professional yet approachable tone. Use data-driven claims only.",
            });
            // Re-register connectors
            for (const type of ["gdrive", "salesforce", "slack"]) {
                await enterpriseApi.registerConnector(DEMO_ENTERPRISE_ID, {
                    connector_type: type,
                    display_name: `${type === "gdrive" ? "Google Drive" : type === "salesforce" ? "Salesforce CRM" : "Slack Workspace"}`,
                });
            }
            await loadEnterprise();
        } catch { }
        setCreating(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
        );
    }

    const stats = enterprise?.stats || {};

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <Database size={24} className="text-violet-500" />
                        Enterprise Vault
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Your enterprise data command center. Connect sources, ingest knowledge, and ground every AI agent with verified facts.
                    </p>
                </div>
                {!enterprise && (
                    <button onClick={createDemo} disabled={creating}
                        className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-violet-500/20"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Initialize Vault
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Connected Sources", value: stats.connectors || 0, icon: Plug, color: "#f59e0b", active: stats.connectors_active || 0 },
                    { label: "Knowledge Docs", value: stats.knowledge_docs || 0, icon: BookOpen, color: "#7c3aed" },
                    { label: "Facts Tracked", value: stats.facts_tracked || 0, icon: Table2, color: "#10b981" },
                    { label: "Data Region", value: enterprise?.data_sovereignty_region || "—", icon: Shield, color: "#ef4444" },
                ].map((s, i) => (
                    <div key={i} className="card shadow-sm border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>
                                <s.icon size={18} />
                            </div>
                            {i === 0 && (s as any).active > 0 && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-bold text-emerald-600">{(s as any).active} Active</span>
                                </div>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { href: "/dashboard/vault/connectors", label: "Managed Connectors", desc: "Google Drive, Salesforce, Slack", icon: Plug, color: "#f59e0b" },
                    { href: "/dashboard/vault/knowledge", label: "Knowledge Lake", desc: "PDFs, docs, reports — AI-indexed", icon: BookOpen, color: "#7c3aed" },
                    { href: "/dashboard/vault/facts", label: "Fact Database", desc: "Prices, dates, compliance data", icon: Table2, color: "#10b981" },
                ].map((action, i) => (
                    <a key={i} href={action.href}
                        className="card shadow-sm border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: `${action.color}15`, color: action.color }}>
                                <action.icon size={20} />
                            </div>
                            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 mb-1">{action.label}</h3>
                        <p className="text-[11px] text-gray-500">{action.desc}</p>
                    </a>
                ))}
            </div>

            {/* Privacy Guard */}
            <div className="card bg-gradient-to-br from-gray-900 via-gray-950 to-black border-gray-800 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                            <Lock size={18} />
                        </div>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Privacy Guard — Data Sovereignty</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <CheckCircle2 size={10} className="text-emerald-400" />
                        <span className="text-[9px] font-bold text-emerald-400">VPC-SC ENFORCED</span>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: "Encryption", value: "AES-256 at rest", icon: Lock },
                        { label: "Access Control", value: "VPC-SC enforced", icon: Shield },
                        { label: "Data Isolation", value: "Single-tenant", icon: Cloud },
                        { label: "Model Training", value: "NEVER used", icon: Eye },
                    ].map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <item.icon size={14} className="text-gray-500 mb-2" />
                            <p className="text-[11px] font-bold text-white/90">{item.value}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
