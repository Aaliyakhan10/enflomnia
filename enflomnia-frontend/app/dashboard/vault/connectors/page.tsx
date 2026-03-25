"use client";
import { useState, useEffect } from "react";
import {
    Plug, RefreshCw, Loader2, Plus, CheckCircle2,
    FileText, AlertCircle, UploadCloud, Clock, Zap
} from "lucide-react";
import { enterpriseApi } from "@/lib/api";

const DEMO_ENTERPRISE_ID = "demo-enterprise-001";

const CONNECTOR_META: Record<string, { name: string; icon: string; gradient: string; desc: string }> = {
    gdrive: { name: "Google Drive", icon: "📁", gradient: "from-blue-500 to-cyan-500", desc: "Sync product docs, brand guides, and strategy decks directly from your workspace." },
    salesforce: { name: "Salesforce CRM", icon: "☁️", gradient: "from-sky-500 to-blue-600", desc: "Pull pipeline data, pricing matrices, and customer intelligence in real-time." },
    slack: { name: "Slack Workspace", icon: "💬", gradient: "from-purple-500 to-pink-500", desc: "Capture marketing discussions, campaign ideas, and team decisions automatically." },
};

export default function ConnectorsPage() {
    // Connector State
    const [connectors, setConnectors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [adding, setAdding] = useState<string | null>(null);

    // Upload State
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const res = await enterpriseApi.listConnectors(DEMO_ENTERPRISE_ID);
            setConnectors(res.data || []);
        } catch { }
        setLoading(false);
    }

    async function addConnector(type: string) {
        setAdding(type);
        try {
            const meta = CONNECTOR_META[type];
            await enterpriseApi.registerConnector(DEMO_ENTERPRISE_ID, {
                connector_type: type,
                display_name: meta.name,
            });
            await load();
        } catch { }
        setAdding(null);
    }

    async function syncConnector(id: string) {
        setSyncing(id);
        try {
            await enterpriseApi.syncConnector(DEMO_ENTERPRISE_ID, id);
            await load();
        } catch { }
        setSyncing(null);
    }

    async function handleUpload() {
        if (!title.trim() || !content.trim()) return;
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            await enterpriseApi.ingestKnowledge(DEMO_ENTERPRISE_ID, {
                title, content, source_type: "manual_upload",
            });
            setSuccess(true);
            setTitle("");
            setContent("");
            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            setError("Failed to upload document. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                    <Plug size={24} className="text-amber-500" />
                    Managed Connectors
                </h1>
                <p className="text-sm text-gray-500 max-w-lg">
                    Permanent digital "straws" that sip data directly from your company workspace, plus manual upload options.
                </p>
            </div>

            {/* External Connectors */}
            <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Enterprise Integrations</h2>
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(CONNECTOR_META).map(([type, meta]) => {
                            const connector = connectors.find(c => c.connector_type === type);
                            const isConnected = !!connector;

                            return (
                                <div key={type} className="card shadow-md border-gray-100 hover:shadow-lg transition-shadow overflow-hidden bg-white">
                                    <div className={`-mx-6 -mt-6 mb-5 px-6 py-5 bg-gradient-to-r ${meta.gradient}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-2xl">{meta.icon}</span>
                                                <span className="text-sm font-bold text-white">{meta.name}</span>
                                            </div>
                                            {isConnected ? (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                                                    <span className="text-[9px] font-bold text-white">CONNECTED</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-bold text-white/60 px-2 py-0.5 rounded-full bg-white/10">AVAILABLE</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-gray-500 leading-relaxed mb-4">{meta.desc}</p>

                                    {isConnected ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <FileText size={10} />
                                                    <span className="font-bold">{connector.documents_synced} docs synced</span>
                                                </div>
                                                {connector.last_sync_at && (
                                                    <div className="flex items-center gap-1 text-gray-400">
                                                        <Clock size={9} />
                                                        <span>{new Date(connector.last_sync_at).toLocaleTimeString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <Zap size={9} />
                                                <span>Sync: {connector.sync_frequency}</span>
                                            </div>
                                            <button
                                                onClick={() => syncConnector(connector.id)}
                                                disabled={syncing === connector.id}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-xs font-bold text-gray-600 transition-all"
                                            >
                                                {syncing === connector.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                {syncing === connector.id ? "Syncing..." : "Sync Now"}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => addConnector(type)}
                                            disabled={adding === type}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md"
                                            style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
                                        >
                                            {adding === type ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            Connect {meta.name}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Manual Upload */}
            <div>
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <UploadCloud size={16} /> Direct Document Upload
                </h2>
                <div className="card shadow-sm ring-1 ring-gray-100 p-8 pt-8">
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="text-sm font-bold text-gray-900 mb-2 block">Document Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Acme Corp Q4 Product Launch Strategy"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-4 text-base bg-gray-50/50 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-violet-500 outline-none transition-shadow text-gray-800"
                            />
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-gray-900 mb-2 block">Document Content (Text)</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Paste the full text of your document, strategy, or guidelines here..."
                                className="w-full p-4 text-base bg-gray-50/50 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-violet-500 outline-none transition-shadow resize-none h-48 text-gray-800"
                            />
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading || !title.trim() || !content.trim()}
                            className="btn btn-brand w-full py-3.5 text-base font-bold shadow-lg shadow-violet-500/20 disabled:shadow-none disabled:opacity-50 mt-2 rounded-xl transition-all"
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={18} />
                                    Uploading & Indexing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FileText size={18} />
                                    Upload to Knowledge Lake
                                </span>
                            )}
                        </button>

                        {success && (
                            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2 animate-fade-in">
                                <CheckCircle2 size={18} />
                                Document successfully indexed and added to the Knowledge Lake!
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 animate-fade-in">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
