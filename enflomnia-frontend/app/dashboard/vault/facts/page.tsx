"use client";
import { useState, useEffect } from "react";
import {
    Table2, Plus, Loader2, Shield, CheckCircle2,
    AlertTriangle, XCircle, Tag, Clock
} from "lucide-react";
import { enterpriseApi } from "@/lib/api";

const DEMO_ENTERPRISE_ID = "demo-enterprise-001";

const CATEGORIES = ["pricing", "inventory", "dates", "contacts", "policy"];

export default function FactsPage() {
    const [facts, setFacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [adding, setAdding] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<any>(null);
    const [contentToCheck, setContentToCheck] = useState("");
    const [form, setForm] = useState({ category: "pricing", key: "", value: "", source: "manual" });

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try { const r = await enterpriseApi.getFacts(DEMO_ENTERPRISE_ID); setFacts(r.data || []); } catch { }
        setLoading(false);
    }

    async function addFact() {
        if (!form.key || !form.value) return;
        setAdding(true);
        try {
            await enterpriseApi.upsertFact(DEMO_ENTERPRISE_ID, form);
            setForm({ category: "pricing", key: "", value: "", source: "manual" });
            setShowAdd(false);
            await load();
        } catch { }
        setAdding(false);
    }

    async function checkContent() {
        if (!contentToCheck.trim()) return;
        setChecking(true);
        try {
            const r = await enterpriseApi.checkContent(DEMO_ENTERPRISE_ID, contentToCheck);
            setCheckResult(r.data);
        } catch { }
        setChecking(false);
    }

    const grouped = CATEGORIES.map(cat => ({
        category: cat,
        facts: facts.filter(f => f.category === cat),
    })).filter(g => g.facts.length > 0);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <Table2 size={24} className="text-emerald-500" />
                        Fact Database
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Your company's "Fact Sheet." The AI uses this to make sure it never gets a price, date, or policy wrong.
                    </p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)}
                    className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-emerald-500/20"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    <Plus size={16} />
                    Add Fact
                </button>
            </div>

            {/* Add Fact Form */}
            {showAdd && (
                <div className="card shadow-md border-emerald-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">New Fact</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Category</label>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-emerald-300 outline-none bg-white">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Source</label>
                            <input type="text" placeholder="e.g. Salesforce, Manual"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
                                value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Key</label>
                            <input type="text" placeholder="e.g. Starter Plan Price"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
                                value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Value</label>
                            <input type="text" placeholder="e.g. $499/month"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
                                value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
                        </div>
                    </div>
                    <button onClick={addFact} disabled={adding}
                        className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                        {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {adding ? "Saving..." : "Save Fact"}
                    </button>
                </div>
            )}

            {/* Content Validator */}
            <div className="card shadow-sm border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Content Fact-Checker</span>
                </div>
                <div className="flex gap-3">
                    <textarea rows={2} placeholder="Paste a draft post or content to validate against your fact base..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-amber-300 outline-none resize-none"
                        value={contentToCheck} onChange={e => setContentToCheck(e.target.value)} />
                    <button onClick={checkContent} disabled={checking}
                        className="px-5 self-end rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 hover:bg-amber-100 transition-colors py-2.5">
                        {checking ? <Loader2 size={14} className="animate-spin" /> : "Validate"}
                    </button>
                </div>
                {checkResult && (
                    <div className={`mt-4 p-4 rounded-xl border ${checkResult.content_ok ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {checkResult.content_ok ? (
                                <><CheckCircle2 size={14} className="text-emerald-500" /><span className="text-xs font-bold text-emerald-700">All facts verified</span></>
                            ) : (
                                <><XCircle size={14} className="text-red-500" /><span className="text-xs font-bold text-red-700">{checkResult.issues?.length || 0} issues found</span></>
                            )}
                        </div>
                        {checkResult.summary && <p className="text-[11px] text-gray-600 mb-2">{checkResult.summary}</p>}
                        {(checkResult.issues || []).map((issue: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-white/60">
                                <AlertTriangle size={12} className={issue.severity === "error" ? "text-red-500" : "text-amber-500"} />
                                <div className="text-[10px]">
                                    <p className="font-bold text-gray-800">{issue.fact_key}</p>
                                    <p className="text-gray-500">Content says: "{issue.content_says}" → Should be: "{issue.fact_says}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Facts Table */}
            <div className="card shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">
                    All Facts ({facts.length})
                </span>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                ) : facts.length === 0 ? (
                    <div className="text-center py-16">
                        <Table2 size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-gray-400">No facts tracked yet</p>
                        <p className="text-[11px] text-gray-400 mt-1">Add facts above or sync from a connector.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {grouped.map(group => (
                            <div key={group.category}>
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <Tag size={10} className="text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                        {group.category}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-bold">({group.facts.length})</span>
                                </div>
                                <div className="rounded-xl border border-gray-100 overflow-hidden">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left py-2 px-4 font-black text-gray-400 uppercase tracking-wider">Key</th>
                                                <th className="text-left py-2 px-4 font-black text-gray-400 uppercase tracking-wider">Value</th>
                                                <th className="text-left py-2 px-4 font-black text-gray-400 uppercase tracking-wider">Source</th>
                                                <th className="text-right py-2 px-4 font-black text-gray-400 uppercase tracking-wider">Verified</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.facts.map((f: any) => (
                                                <tr key={f.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                                                    <td className="py-2.5 px-4 font-bold text-gray-800">{f.key}</td>
                                                    <td className="py-2.5 px-4 text-gray-700">{f.value}</td>
                                                    <td className="py-2.5 px-4 text-gray-500">{f.source}</td>
                                                    <td className="py-2.5 px-4 text-right text-gray-400">
                                                        <span className="flex items-center justify-end gap-1">
                                                            <Clock size={9} />
                                                            {new Date(f.last_verified_at).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
