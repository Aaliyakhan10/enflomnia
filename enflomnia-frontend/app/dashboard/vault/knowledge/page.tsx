"use client";
import { useState, useEffect } from "react";
import {
    BookOpen, Search, Upload, Loader2, FileText,
    Clock, Hash, Sparkles, ChevronRight
} from "lucide-react";
import { enterpriseApi } from "@/lib/api";

const DEMO_ENTERPRISE_ID = "demo-enterprise-001";

export default function KnowledgeLakePage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [ingesting, setIngesting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const [search, setSearch] = useState("");
    const [ingestForm, setIngestForm] = useState({ title: "", content: "" });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [showIngest, setShowIngest] = useState(false);
    const [ingestTab, setIngestTab] = useState<"text" | "pdf">("text");

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try { const r = await enterpriseApi.listKnowledge(DEMO_ENTERPRISE_ID); setDocs(r.data || []); } catch { }
        setLoading(false);
    }

    async function handleIngest() {
        if (ingestTab === "text") {
            if (!ingestForm.title || !ingestForm.content) return;
            setIngesting(true);
            try {
                await enterpriseApi.ingestKnowledge(DEMO_ENTERPRISE_ID, {
                    title: ingestForm.title, content: ingestForm.content, source_type: "text",
                });
                setIngestForm({ title: "", content: "" });
                setShowIngest(false);
                await load();
            } catch { }
            setIngesting(false);
        } else {
            if (!uploadFile) return;
            setIngesting(true);
            try {
                await enterpriseApi.uploadPDF(DEMO_ENTERPRISE_ID, uploadFile, ingestForm.title);
                setUploadFile(null);
                setIngestForm({ title: "", content: "" });
                setShowIngest(false);
                await load();
            } catch (err) {
                console.error("PDF upload failed", err);
                alert("Failed to process PDF. Please try again.");
            }
            setIngesting(false);
        }
    }

    async function handleSearch() {
        if (!search.trim()) return;
        setSearching(true);
        try { const r = await enterpriseApi.searchKnowledge(DEMO_ENTERPRISE_ID, search); setResults(r.data || []); } catch { }
        setSearching(false);
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <BookOpen size={24} className="text-violet-500" />
                        Knowledge Lake
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Your company's "Digital Library." Drop any document and the AI reads and remembers it forever.
                    </p>
                </div>
                <button onClick={() => setShowIngest(!showIngest)}
                    className="btn btn-brand gap-2 px-5 py-2.5 shadow-md shadow-violet-500/20"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                    <Upload size={16} />
                    Ingest Document
                </button>
            </div>

            {/* Search */}
            <div className="card shadow-sm border-violet-50">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Semantic search across all knowledge..."
                            className="pl-9 pr-4 py-2.5 w-full rounded-xl border border-gray-200 text-sm focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none"
                            value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()} />
                    </div>
                    <button onClick={handleSearch} disabled={searching}
                        className="px-5 py-2.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold border border-violet-100 hover:bg-violet-100 transition-colors">
                        {searching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                    </button>
                </div>
            </div>

            {/* Search Results */}
            {results && (
                <div className="card shadow-md border-violet-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-violet-500" />
                        <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">
                            Semantic Results ({results.length})
                        </span>
                    </div>
                    {results.length === 0 ? (
                        <p className="text-xs text-gray-500">No matching documents found.</p>
                    ) : (
                        <div className="space-y-3">
                            {results.map((doc: any, i: number) => (
                                <div key={i} className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-800">{doc.title}</span>
                                        <span className="text-[9px] font-bold text-violet-500 px-2 py-0.5 rounded-full bg-violet-100">
                                            #{i + 1} match
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">{doc.embedding_summary}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Ingest Form */}
            {showIngest && (
                <div className="card shadow-md border-violet-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ingest New Document</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setIngestTab("text")}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${ingestTab === "text" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"}`}>
                                Text / Paste
                            </button>
                            <button onClick={() => setIngestTab("pdf")}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${ingestTab === "pdf" ? "bg-violet-100 text-violet-700" : "text-gray-400 hover:bg-gray-50"}`}>
                                PDF Upload
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Document Title (Optional for PDF)</label>
                            <input type="text" placeholder="e.g. Q4 Marketing Strategy"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-violet-300 outline-none"
                                value={ingestForm.title} onChange={e => setIngestForm(f => ({ ...f, title: e.target.value }))} />
                        </div>

                        {ingestTab === "text" ? (
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Content (paste text, report, or data)</label>
                                <textarea rows={6} placeholder="Paste the full document content here..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-violet-300 outline-none resize-none"
                                    value={ingestForm.content} onChange={e => setIngestForm(f => ({ ...f, content: e.target.value }))} />
                            </div>
                        ) : (
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Upload PDF File</label>
                                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-violet-200 transition-colors">
                                    <input type="file" accept=".pdf,application/pdf"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setUploadFile(e.target.files[0]);
                                            }
                                        }} />
                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                        <div className="p-3 bg-violet-50 rounded-full text-violet-500">
                                            <Upload size={20} />
                                        </div>
                                        {uploadFile ? (
                                            <div className="text-sm font-bold text-violet-700">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</div>
                                        ) : (
                                            <>
                                                <div className="text-sm font-bold text-gray-700">Click to upload or drag and drop</div>
                                                <div className="text-xs text-gray-400">PDF files only (max 10MB recommended)</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={handleIngest} disabled={ingesting || (ingestTab === "text" && (!ingestForm.title || !ingestForm.content)) || (ingestTab === "pdf" && !uploadFile)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                            {ingesting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {ingesting ? "Indexing with Gemini..." : ingestTab === "pdf" ? "Upload & Extract PDF" : "Ingest & Index"}
                        </button>
                    </div>
                </div>
            )}

            {/* Documents List */}
            <div className="card shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Indexed Documents ({docs.length})
                    </span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-violet-500" size={24} />
                    </div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen size={48} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-xs font-bold text-gray-400">No documents ingested yet</p>
                        <p className="text-[11px] text-gray-400 mt-1">Connect a source or paste a document above.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {docs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-violet-50/50 border border-gray-100 hover:border-violet-100 transition-all group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-1.5 rounded-lg bg-white border border-gray-100 text-violet-500 shadow-sm">
                                        <FileText size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{doc.title}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[9px] font-bold text-violet-500 uppercase">{doc.source_type}</span>
                                            <span className="text-[9px] text-gray-400 flex items-center gap-1">
                                                <Hash size={8} />{doc.word_count} words
                                            </span>
                                            <span className="text-[9px] text-gray-400 flex items-center gap-1">
                                                <Clock size={8} />{new Date(doc.ingested_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={12} className="text-gray-300 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
