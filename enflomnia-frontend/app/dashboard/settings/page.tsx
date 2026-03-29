"use client";

import { useState, useEffect } from "react";
import { useAccount } from "@/lib/account-context";
import { enterpriseApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Settings, LogOut, UploadCloud, Building, Share2, AlertCircle, CheckCircle2, Instagram } from "lucide-react";

const ENTERPRISE_ID = "00000000-0000-0000-0000-000000000000";

export default function SettingsPage() {
    const { account, isConnected, isLoading: accountLoading } = useAccount();
    const router = useRouter();

    const [companyInfo, setCompanyInfo] = useState({ name: "", industry: "", tone: "" });
    const [isSavingCompInfo, setIsSavingCompInfo] = useState(false);
    const [compSaveMsg, setCompSaveMsg] = useState("");

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState("");

    useEffect(() => {
        enterpriseApi.getProfile(ENTERPRISE_ID)
            .then(res => {
                if (res.data) {
                    setCompanyInfo({
                        name: res.data.name || "",
                        industry: res.data.industry || "",
                        tone: res.data.tone_of_voice || ""
                    });
                }
            })
            .catch(err => console.error("Could not fetch enterprise profile", err));
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login"); // or wherever the login page is
    };

    const handleSaveCompanyInfo = async () => {
        setIsSavingCompInfo(true);
        setCompSaveMsg("");
        try {
            await enterpriseApi.updateProfile(ENTERPRISE_ID, {
                name: companyInfo.name,
                industry: companyInfo.industry,
                tone_of_voice: companyInfo.tone
            });
            setCompSaveMsg("Company info updated successfully.");
        } catch (error) {
            console.error("Error updating company info", error);
            setCompSaveMsg("Failed to update company info.");
        } finally {
            setIsSavingCompInfo(false);
            setTimeout(() => setCompSaveMsg(""), 3000);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setUploadMsg("");
        try {
            await enterpriseApi.uploadPDF(ENTERPRISE_ID, file, file.name);
            setUploadMsg("Document uploaded successfully.");
            setFile(null);
        } catch (error) {
            console.error("Error uploading document", error);
            setUploadMsg("Failed to upload document.");
        } finally {
            setUploading(false);
            setTimeout(() => setUploadMsg(""), 3000);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <header className="flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-800 to-gray-600 flex items-center justify-center shadow-md">
                    <Settings className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Settings</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage your enterprise profile, connections, and documents.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Connection & Social Info */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <Share2 className="text-violet-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-900">Social Connections</h2>
                    </div>
                    
                    <div className="flex-1">
                        {accountLoading ? (
                            <p className="text-sm text-gray-400">Loading connection info...</p>
                        ) : isConnected && account ? (
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                                {account.profile_picture_url ? (
                                    <img src={account.profile_picture_url} alt={account.username} className="w-14 h-14 rounded-full border-2 border-pink-200 object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center">
                                        <Instagram className="text-white" size={24} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-bold text-gray-900">@{account.username}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-semibold text-pink-600">{account.followers_count?.toLocaleString()}</span> Followers
                                    </p>
                                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Connected
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-start gap-3">
                                <AlertCircle className="text-red-500 mt-0.5" size={16} />
                               <div>
                                    <p className="text-sm font-bold text-red-900">Not Connected</p>
                                    <p className="text-xs text-red-600 mt-1">Please connect your Instagram account in the vault to enable creative studios.</p>
                               </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Logout Option */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                        <button 
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold transition-all shadow-sm"
                        >
                            <LogOut size={16} /> Sign Out of Platform
                        </button>
                    </div>
                </section>

                {/* Company Info Box */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                        <Building className="text-blue-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider pl-1 mb-1 block">Brand Name</label>
                            <input 
                                type="text" 
                                value={companyInfo.name}
                                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider pl-1 mb-1 block">Industry</label>
                            <input 
                                type="text" 
                                value={companyInfo.industry}
                                onChange={(e) => setCompanyInfo({...companyInfo, industry: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="e.g. Eco-Friendly Packaging"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider pl-1 mb-1 block">Tone of Voice</label>
                            <input 
                                type="text" 
                                value={companyInfo.tone}
                                onChange={(e) => setCompanyInfo({...companyInfo, tone: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="e.g. Professional yet approachable"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <p className="text-xs font-medium text-emerald-600">{compSaveMsg}</p>
                        <button 
                            onClick={handleSaveCompanyInfo}
                            disabled={isSavingCompInfo}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
                        >
                            {isSavingCompInfo ? "Saving..." : "Save Details"}
                        </button>
                    </div>
                </section>

                {/* Document Upload */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-6">
                        <UploadCloud className="text-emerald-600" size={20} />
                        <h2 className="text-lg font-bold text-gray-900">Upload Knowledge Documents</h2>
                    </div>

                    <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all hover:bg-gray-100 hover:border-emerald-300 relative">
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                                <UploadCloud className="text-emerald-600" size={24} />
                            </div>
                            <p className="text-sm font-semibold text-gray-800">
                                {file ? file.name : "Click or drag & drop a PDF document"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Injects directly into the Enterprise Knowledge Lake</p>
                        </div>
                        
                        <div className="flex flex-col justify-end w-full sm:w-auto h-full space-y-3">
                           {uploadMsg && <p className={`text-xs font-medium px-2 ${uploadMsg.includes('Failed') ? 'text-red-500' : 'text-emerald-600'}`}>{uploadMsg}</p>}
                            <button 
                                type="submit" 
                                disabled={!file || uploading}
                                className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-sm shadow-emerald-200"
                            >
                                {uploading ? "Uploading..." : "Inject into Lake"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

