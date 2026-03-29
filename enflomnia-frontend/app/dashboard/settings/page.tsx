"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@/lib/account-context";
import { useUser } from "@/lib/user-context";
import { enterpriseApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Settings, LogOut, UploadCloud, Building, Share2, AlertCircle, CheckCircle2, Instagram, Copy, Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";

export default function SettingsPage() {
    const { account, isConnected, isLoading: accountLoading } = useAccount();
    const { user: enterprise, refresh: fetchProfile } = useUser();
    const router = useRouter();

    const [companyInfo, setCompanyInfo] = useState({ name: "", industry: "", tone: "" });
    const [isSavingCompInfo, setIsSavingCompInfo] = useState(false);
    const [compSaveMsg, setCompSaveMsg] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState("");
    
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (enterprise) {
            setCompanyInfo({
                name: enterprise.name || "",
                industry: enterprise.industry || "",
                tone: enterprise.brand_voice || "" 
            });
        }
    }, [enterprise]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const handleSaveCompanyInfo = async () => {
        if (!enterprise) return;
        setIsSavingCompInfo(true);
        setCompSaveMsg("");
        try {
            await enterpriseApi.updateProfile(enterprise.id, {
                name: companyInfo.name,
                industry: companyInfo.industry,
                brand_voice: companyInfo.tone
            });
            setCompSaveMsg("Workspace updated.");
            fetchProfile();
        } catch (error) {
            console.error("Error updating company info", error);
            setCompSaveMsg("Update failed.");
        } finally {
            setIsSavingCompInfo(false);
            setTimeout(() => setCompSaveMsg(""), 3000);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !enterprise) return;

        setUploading(true);
        setUploadMsg("");
        try {
            await enterpriseApi.uploadPDF(enterprise.id, file, file.name);
            setUploadMsg("Injected into Knowledge Lake.");
            setFile(null);
        } catch (error) {
            console.error("Error uploading document", error);
            setUploadMsg("Injection failed.");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadMsg(""), 3000);
        }
    };

    const copyToken = () => {
        if (!enterprise?.demo_credentials?.instagram_access_token) return;
        navigator.clipboard.writeText(enterprise.demo_credentials.instagram_access_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!enterprise) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24">
            <header className="flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Settings className="text-white" size={24} />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Settings</h1>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">
                        Current Workspace: <span className="text-indigo-600 font-bold">{enterprise.name}</span>
                    </p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white border border-red-100 text-red-600 text-xs font-bold hover:bg-red-50 transition-all shadow-sm"
                >
                    <LogOut size={14} /> Sign Out
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── Demo Credentials (REQUESTED) ────────────────────────────────── */}
                <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-xl border border-gray-700 col-span-1 md:col-span-2 text-white relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
                    
                    <div className="flex items-center justify-between mb-8 border-b border-gray-700/50 pb-5">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-indigo-400" size={24} />
                            <div>
                                <h2 className="text-lg font-bold">Demo Walkthrough Credentials</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Presentation Session</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                                DEBUG MODE ON
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Mail size={12} className="text-indigo-400" /> Authorized Identity
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                <span className="font-bold text-sm text-gray-300">aaliyakhan4352@gmail.com</span>
                                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">
                                    Verified
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Instagram size={12} className="text-pink-400" /> Social Graph Access Token
                            </label>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 group/token">
                                <div className="flex-1 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-400">
                                    {showToken ? (enterprise.demo_credentials?.instagram_access_token || "Missing in .env") : "••••••••••••••••••••••••••••••••"}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setShowToken(!showToken)}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                                    >
                                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button 
                                        onClick={copyToken}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                                    >
                                        {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Connection & Social Info */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <Share2 className="text-violet-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-900">Live Connectors</h2>
                    </div>
                    
                    <div className="flex-1">
                        {accountLoading ? (
                            <p className="text-sm text-gray-400 animate-pulse">Synchronizing graph data...</p>
                        ) : isConnected && account ? (
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4 group">
                                {account.profile_picture_url ? (
                                    <img src={account.profile_picture_url} alt={account.username} className="w-14 h-14 rounded-2xl border-2 border-indigo-100 object-cover shadow-sm group-hover:scale-105 transition-transform" />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center">
                                        <Instagram className="text-white" size={24} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-gray-900">@{account.username}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-bold text-indigo-600">{account.followers_count?.toLocaleString()}</span> Followers
                                    </p>
                                    <div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-2 w-fit flex items-center gap-1">
                                        <CheckCircle2 size={8} /> Active Channel
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-start gap-3">
                                <AlertCircle className="text-red-500 mt-0.5" size={16} />
                               <div>
                                    <p className="text-sm font-bold text-red-900">Vault Disconnected</p>
                                    <p className="text-xs text-red-600 mt-1">Connect your Instagram account in the Digital Vault to enable image/video synthesis.</p>
                               </div>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-bold transition-all border border-gray-100 hover:border-red-100"
                    >
                        <LogOut size={14} /> Kill Session & Sign Out
                    </button>
                </section>

                {/* Company Info Box */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <Building className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-900">Workspace Persona</h2>
                    </div>

                    <div className="space-y-5 flex-1">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block tracking-widest pl-1">Legal Brand Name</label>
                            <input 
                                type="text" 
                                value={companyInfo.name}
                                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Aaliyakhan10 Global"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block tracking-widest pl-1">Primary Vertical</label>
                            <input 
                                type="text" 
                                value={companyInfo.industry}
                                onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block tracking-widest pl-1">Brand Voice DNA</label>
                            <input 
                                type="text" 
                                value={companyInfo.tone}
                                onChange={(e) => setCompanyInfo({...companyInfo, tone: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Elevated, Premium, Tech-Forward"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{compSaveMsg}</p>
                        <button 
                            onClick={handleSaveCompanyInfo}
                            disabled={isSavingCompInfo}
                            className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                        >
                            {isSavingCompInfo ? "Updating..." : "Synchronize Persona"}
                        </button>
                    </div>
                </section>

                {/* Document Upload */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 mb-8">
                        <UploadCloud className="text-emerald-500" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Knowledge Lake Injection</h2>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">Feed raw documents into the brand's long-term intelligence memory.</p>
                        </div>
                    </div>

                    <form onSubmit={handleFileUpload} className="flex flex-col lg:flex-row items-stretch gap-6">
                        <div className="flex-1 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5 group relative cursor-pointer">
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="text-emerald-500" size={32} />
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                {file ? file.name : "Select PDF Knowledge Source"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Grounded Retrieval System Ready"}</p>
                        </div>
                        
                        <div className="lg:w-64 flex flex-col justify-between py-2">
                            <div className="space-y-4">
                               <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest leading-relaxed">
                                        Documents are indexed and used as information grounding for AI image/video synthesis.
                                    </p>
                               </div>
                               {uploadMsg && (
                                   <p className={`text-[10px] font-black uppercase text-center tracking-widest p-2 rounded-lg ${uploadMsg.includes('failed') ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600 animate-bounce'}`}>
                                       {uploadMsg}
                                   </p>
                               )}
                            </div>
                            <button 
                                type="submit" 
                                disabled={!file || uploading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                            >
                                {uploading ? "Analyzing..." : "Inject into Lake"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

