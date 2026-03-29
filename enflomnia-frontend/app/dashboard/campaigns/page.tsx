"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CalendarDays, MessageCircle, TrendingUp, AlertCircle, Rocket, Image as ImageIcon, Film, Shield, ShieldCheck, ShieldAlert, Loader2, Send, CheckCircle2, ChevronDown, ChevronUp, Building2, Users, Volume2, Target as TargetIcon } from "lucide-react";
import { enterpriseApi, userApi } from "@/lib/api";

const ENTERPRISE_ID = "00000000-0000-0000-0000-000000000000";

export default function CampaignStrategistPage() {
    const [goal, setGoal] = useState("");
    const [generating, setGenerating] = useState(false);
    const [campaign, setCampaign] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [complianceStatus, setComplianceStatus] = useState<Record<number, any>>({});
    const [auditing, setAuditing] = useState<number | null>(null);
    const [publishStatus, setPublishStatus] = useState<Record<number, any>>({});
    const [publishing, setPublishing] = useState<number | null>(null);
    const [generatingMedia, setGeneratingMedia] = useState<Record<string, boolean>>({});
    const [generatedMediaUrls, setGeneratedMediaUrls] = useState<Record<string, string>>({});

    // Profile & Suggestions State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profile, setProfile] = useState({
        primary_product: "",
        target_audience: "",
        brand_voice: "",
        main_objectives: ""
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [suggesting, setSuggesting] = useState(false);
    const [scanningPersona, setScanningPersona] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchProfile();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await userApi.getHistory("campaign");
            setHistory(res.data || []);
            if (res.data && res.data.length > 0 && !campaign) {
                setCampaign(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch campaign history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await enterpriseApi.getProfile(ENTERPRISE_ID);
            setProfile({
                primary_product: res.data.primary_product || "",
                target_audience: res.data.target_audience || "",
                brand_voice: res.data.brand_voice || "",
                main_objectives: res.data.main_objectives || ""
            });
        } catch (err) {
            console.error("Failed to fetch profile", err);
        }
    };

    const handleUpdateProfile = async () => {
        setSavingProfile(true);
        try {
            await enterpriseApi.updateProfile(ENTERPRISE_ID, profile);
            setIsProfileOpen(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleMagicScan = async () => {
        setScanningPersona(true);
        try {
            const res = await enterpriseApi.magicScanPersona(ENTERPRISE_ID);
            if (res.data) {
                setProfile({
                    primary_product: res.data.primary_product || profile.primary_product,
                    target_audience: res.data.target_audience || profile.target_audience,
                    brand_voice: res.data.brand_voice || profile.brand_voice,
                    main_objectives: res.data.main_objectives || profile.main_objectives
                });
            }
        } catch (err) {
            console.error("Magic scan failed", err);
        } finally {
            setScanningPersona(false);
        }
    };

    const handleSuggest = async () => {
        setSuggesting(true);
        setSuggestions([]);
        try {
            const res = await enterpriseApi.suggestObjectives(ENTERPRISE_ID);
            setSuggestions(res.data || []);
        } catch (err) {
            console.error("Suggestion failed", err);
        } finally {
            setSuggesting(false);
        }
    };

    const handlePublish = async (index: number, script: any) => {
        setPublishing(index);
        try {
            const res = await enterpriseApi.publishContent(ENTERPRISE_ID, { type: "Video Post", day: script.day });
            setPublishStatus(prev => ({ ...prev, [index]: res.data }));
        } catch (err) {
            console.error("Publish failed", err);
        } finally {
            setPublishing(null);
        }
    };

    const handleAudit = async (index: number, script: any) => {
        setAuditing(index);
        try {
            const content = `Topic: ${script.topic}\nHook: ${script.hook}\nBody: ${script.body_points?.join(', ')}\nCTA: ${script.call_to_action}\nImage Prompt: ${script.image_prompt}\nVideo Prompt: ${script.video_prompt}`;
            const res = await enterpriseApi.auditContent(ENTERPRISE_ID, { content, content_type: "Campaign Script & Prompts" });
            setComplianceStatus(prev => ({ ...prev, [index]: res.data }));
        } catch (err) {
            console.error("Audit failed", err);
            setComplianceStatus(prev => ({ ...prev, [index]: { status: "REJECTED", issues: ["Network or server error during Aegis scan."], suggested_edits: "" } }));
        } finally {
            setAuditing(null);
        }
    };

    const handleGenerateImage = async (i: number, script: any) => {
        const key = `img_${i}`;
        setGeneratingMedia(prev => ({ ...prev, [key]: true }));
        try {
            const res = await enterpriseApi.generateImage(ENTERPRISE_ID, { prompt: script.image_prompt, count: 1 });
            if (res.data?.images && res.data.images.length > 0) {
                setGeneratedMediaUrls(prev => ({ ...prev, [key]: res.data.images[0].image_data }));
            }
        } catch (e) {
            console.error("Image gen failed", e);
        } finally {
            setGeneratingMedia(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleGenerateVideo = async (i: number, script: any) => {
        const key = `vid_${i}`;
        setGeneratingMedia(prev => ({ ...prev, [key]: true }));
        try {
            const response = await fetch("/api/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    compositionId: "ScriptVideo",
                    inputProps: {
                        script: script.video_prompt || script.topic,
                        images: generatedMediaUrls[`img_${i}`] ? [generatedMediaUrls[`img_${i}`]] : [],
                        caption: script.hook || "Campaign video"
                    },
                    slug: `video-campaign-${Date.now()}`
                })
            });
            const data = await response.json();
            if (data.url) {
                setGeneratedMediaUrls(prev => ({ ...prev, [key]: data.url }));
                await enterpriseApi.generateVideo(ENTERPRISE_ID, {
                    title: `${campaign?.title || 'Campaign'} - ${script.day}`,
                    input_props: { script: script.video_prompt, caption: script.hook },
                });
            }
        } catch (e) {
            console.error("Video gen/render failed", e);
        } finally {
            setGeneratingMedia(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleGenerate = async () => {
        if (!goal.trim()) return;
        setGenerating(true);
        setError(null);
        setCampaign(null);

        try {
            const res = await enterpriseApi.generateCampaign(ENTERPRISE_ID, { goal });
            setCampaign(res.data);
            fetchHistory();
        } catch (err: any) {
            console.error("Strategy Gen Error:", err);
            setError("The Strategist encountered an error designing the campaign. Make sure your facts are populated.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-start p-8 bg-[#fbfbfa]">
            <div className="w-full max-w-3xl mb-8 text-center pt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 text-violet-600 mb-6 drop-shadow-sm">
                    <Rocket size={32} />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Campaign Strategist</h1>
                <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto">
                    Architect intelligent, context-aware campaigns grounded in your Knowledge Lake facts.
                </p>
            </div>

            {/* smart Profile Section */}
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 mb-6 overflow-hidden transition-all duration-300">
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-full px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Building2 className="text-gray-400" size={20} />
                        <span className="text-sm font-bold text-gray-700">Enterprise Persona & Context</span>
                    </div>
                    {isProfileOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>
                
                {isProfileOpen && (
                    <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">
                                <ImageIcon size={12} /> Primary Product/Service
                            </label>
                            <input 
                                value={profile.primary_product}
                                onChange={(e) => setProfile(prev => ({ ...prev, primary_product: e.target.value }))}
                                placeholder="e.g. AI-Powered CRM"
                                className="w-full bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">
                                <Users size={12} /> Target Audience
                            </label>
                            <input 
                                value={profile.target_audience}
                                onChange={(e) => setProfile(prev => ({ ...prev, target_audience: e.target.value }))}
                                placeholder="e.g. Fortune 500 Marketing Heads"
                                className="w-full bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">
                                <Volume2 size={12} /> Brand Voice
                            </label>
                            <input 
                                value={profile.brand_voice}
                                onChange={(e) => setProfile(prev => ({ ...prev, brand_voice: e.target.value }))}
                                placeholder="e.g. Bold, Professional, Visionary"
                                className="w-full bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">
                                <TargetIcon size={12} /> Main Objectives
                            </label>
                            <input 
                                value={profile.main_objectives}
                                onChange={(e) => setProfile(prev => ({ ...prev, main_objectives: e.target.value }))}
                                placeholder="e.g. Dominate Q4 Sales"
                                className="w-full bg-gray-50 border-none ring-1 ring-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-violet-500 transition-all outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end items-center gap-3 pt-2">
                            <button 
                                onClick={handleMagicScan}
                                disabled={scanningPersona}
                                className="px-5 py-2 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {scanningPersona ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Magic Scan from Docs
                            </button>
                            <button 
                                onClick={handleUpdateProfile}
                                disabled={savingProfile}
                                className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingProfile ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                Save Persona
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full max-w-3xl bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 mb-8">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold text-gray-900 ml-1">Define Campaign Objective</label>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleSuggest}
                                disabled={suggesting}
                                className="text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Suggest Smart Ideas
                            </button>
                            {history.length > 0 && (
                                <select 
                                    onChange={(e) => {
                                        const selected = history.find(c => c.id === e.target.value);
                                        if (selected) setCampaign(selected);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-none ring-1 ring-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-violet-500 cursor-pointer"
                                    value={campaign?.id || ""}
                                >
                                    <option value="" disabled>Archive</option>
                                    {history.map((h, i) => (
                                        <option key={h.id || i} value={h.id}>{h.title || `Campaign ${i+1}`}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 animate-in fade-in zoom-in-95 duration-500">
                            {suggestions.map((s, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        setGoal(s.objective);
                                        setSuggestions([]);
                                    }}
                                    className="p-4 text-left bg-violet-50/50 hover:bg-violet-100 border border-violet-100 rounded-2xl transition-all group active:scale-95"
                                >
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-violet-600 mb-1 group-hover:text-violet-700">{s.title}</h4>
                                    <p className="text-[11px] font-medium text-violet-900 line-clamp-3 leading-relaxed">{s.objective}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Or type your own: e.g. Q4 Growth Campaign focused on our new sustainability whitepaper..."
                        className="w-full p-6 text-lg bg-gray-50/50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-violet-500 placeholder-gray-400 outline-none transition-shadow resize-none h-32 font-medium text-gray-800"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !goal.trim()}
                        className="btn btn-brand w-full py-4 text-lg font-bold shadow-lg shadow-violet-500/20 disabled:shadow-none disabled:opacity-50 mt-2 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {generating ? (
                            <span className="flex items-center justify-center gap-3">
                                <Sparkles className="animate-spin" size={20} />
                                Architecting Strategy...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-3">
                                <Rocket size={20} />
                                Architect Campaign
                            </span>
                        )}
                    </button>
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-start gap-3 mt-4">
                           <AlertCircle size={18} className="mt-0.5" />
                           {error}
                        </div>
                    )}
                </div>
            </div>

            {campaign && (
                <div className="w-full max-w-3xl flex flex-col gap-8 animate-fade-in pb-20">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-100 border-t-[6px] border-violet-500">
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{campaign.title}</h2>
                        <div className="flex items-start gap-3 mt-4 bg-violet-50 p-4 rounded-xl">
                            <TrendingUp className="text-violet-600 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-violet-900 text-sm mb-1">Growth Forecast</h4>
                                <p className="text-violet-800 text-sm">{campaign.reach_forecast}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-100">
                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                            <CalendarDays className="text-emerald-500" /> Content Timeline (Videos)
                        </h3>
                        <div className="flex flex-col gap-6 relative">
                            {/* Vertical timeline line */}
                            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gray-100" />
                            
                            {campaign.proposed_scripts?.map((script: any, i: number) => (
                                <div key={i} className="flex gap-6 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold ring-4 ring-white shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 bg-gray-50/80 p-6 rounded-2xl ring-1 ring-gray-200/50">
                                        <div className="flex justify-between items-start mb-3">
                                           <h4 className="font-bold text-gray-900 text-lg">{script.day}</h4>
                                           <span className="px-3 py-1 bg-white text-xs font-bold text-gray-500 rounded-lg ring-1 ring-gray-200 uppercase tracking-widest">{script.format}</span>
                                        </div>
                                        <p className="text-gray-800 font-bold mb-4">{script.topic}</p>
                                        
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 mb-4">
                                            <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-wider text-[11px]">The Hook</p>
                                            <p className="text-gray-900 font-medium italic">"{script.hook}"</p>
                                        </div>

                                        <ul className="list-disc pl-5 mb-4 text-sm text-gray-600 space-y-1">
                                            {script.body_points?.map((pt: string, j: number) => (
                                                <li key={j}>{pt}</li>
                                            ))}
                                        </ul>

                                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 inline-flex items-center gap-2 w-full">
                                                <span className="text-blue-600 font-bold text-sm">CTA:</span>
                                                <span className="text-blue-900 text-sm font-medium">{script.call_to_action}</span>
                                            </div>

                                            {(script.image_prompt || script.video_prompt) && (
                                                <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
                                                    <h5 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest flex items-center gap-2 mt-2">
                                                        <Sparkles size={12} className="text-violet-400" /> Auto-Generated Generative Prompts
                                                    </h5>
                                                    
                                                    {script.image_prompt && (
                                                        <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100/50 flex flex-col gap-1.5 w-full">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-pink-600 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                                    <ImageIcon className="w-3 h-3" /> Image Prompt
                                                                </span>
                                                                {!generatedMediaUrls[`img_${i}`] ? (
                                                                    <button 
                                                                        onClick={() => handleGenerateImage(i, script)}
                                                                        disabled={generatingMedia[`img_${i}`]}
                                                                        className="text-[10px] bg-pink-600 text-white px-2 py-1 flex items-center gap-1 rounded tracking-wider disabled:opacity-50"
                                                                    >
                                                                        {generatingMedia[`img_${i}`] ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10} />} Generate Image
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] text-pink-600 font-bold flex items-center gap-1">
                                                                        <CheckCircle2 size={12}/> Asset Ready in History
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-pink-900 text-sm font-medium italic">"{script.image_prompt}"</p>
                                                            {generatedMediaUrls[`img_${i}`] && (
                                                                <div className="mt-2 text-xs font-bold text-pink-700 bg-pink-100/50 p-2 rounded-lg">Preview Available in Studio</div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {script.video_prompt && (
                                                        <div className="bg-violet-50/50 p-3 rounded-xl border border-violet-100/50 flex flex-col gap-1.5 w-full">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-violet-600 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                                    <Film className="w-3 h-3" /> Video Engine Directives
                                                                </span>
                                                                {!generatedMediaUrls[`vid_${i}`] ? (
                                                                    <button 
                                                                        onClick={() => handleGenerateVideo(i, script)}
                                                                        disabled={generatingMedia[`vid_${i}`]}
                                                                        className="text-[10px] bg-violet-600 text-white px-2 py-1 flex items-center gap-1 rounded tracking-wider disabled:opacity-50"
                                                                    >
                                                                        {generatingMedia[`vid_${i}`] ? <Loader2 size={10} className="animate-spin" /> : <Film size={10} />} Remotion Render
                                                                    </button>
                                                                ) : (
                                                                    <a href={generatedMediaUrls[`vid_${i}`]} target="_blank" className="text-[10px] text-violet-600 font-bold flex items-center gap-1 hover:underline">
                                                                        <CheckCircle2 size={12}/> View Rendered Video
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <p className="text-violet-900 text-sm font-medium italic">"{script.video_prompt}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Bark Phase: Aegis Audit */}
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                {!complianceStatus[i] ? (
                                                    <button
                                                        onClick={() => handleAudit(i, script)}
                                                        disabled={auditing === i}
                                                        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-50"
                                                    >
                                                        {auditing === i ? <Loader2 size={16} className="animate-spin text-slate-500" /> : <Shield size={16} className="text-slate-500" />}
                                                        {auditing === i ? "Aegis is Scanning..." : "Audit Content with Aegis"}
                                                    </button>
                                                ) : (
                                                    <div className={`p-4 rounded-xl border ${complianceStatus[i].status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {complianceStatus[i].status === 'APPROVED' ? (
                                                                <ShieldCheck className="text-emerald-500 w-5 h-5" />
                                                            ) : (
                                                                <ShieldAlert className="text-rose-500 w-5 h-5" />
                                                            )}
                                                            <span className={`font-bold text-sm ${complianceStatus[i].status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                                Aegis Validation: {complianceStatus[i].status}
                                                            </span>
                                                        </div>
                                                        
                                                        {complianceStatus[i].status === 'REJECTED' && (
                                                            <div className="mt-3 space-y-3">
                                                                <div className="text-rose-800 text-sm">
                                                                    <strong className="block mb-1 text-xs uppercase tracking-wider text-rose-600/80">Identified Violations:</strong>
                                                                    <ul className="list-disc pl-4 space-y-0.5 font-medium">
                                                                        {complianceStatus[i].issues?.map((issue: string, idx: number) => (
                                                                            <li key={idx}>{issue}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                                {complianceStatus[i].suggested_edits && (
                                                                    <div className="bg-white/60 p-3 rounded-lg ring-1 ring-rose-200/50">
                                                                        <strong className="block mb-1 text-xs uppercase tracking-wider text-rose-600/80">Suggested Auto-Correction:</strong>
                                                                        <p className="text-sm font-medium text-rose-900 italic">{complianceStatus[i].suggested_edits}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {complianceStatus[i].status === 'APPROVED' && !publishStatus[i] && (
                                                            <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-end">
                                                                <button
                                                                    onClick={() => handlePublish(i, script)}
                                                                    disabled={publishing === i}
                                                                    className="btn btn-brand px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all"
                                                                >
                                                                    {publishing === i ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                                    {publishing === i ? "Pushing to Instagram..." : "Go Live"}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {publishStatus[i] && (
                                                            <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                                                                    <CheckCircle2 size={24} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-violet-900 font-bold text-sm">Successfully Published to Instagram!</p>
                                                                    <p className="text-violet-700 text-xs">ID: {publishStatus[i].id}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-sm ring-1 ring-gray-100">
                        <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                            <MessageCircle className="text-pink-500" /> Audience Playbook
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {campaign.engagement_playbook?.map((reply: any, i: number) => (
                                <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                                        <p className="text-sm font-medium text-gray-600 flex-1 mt-1">"{reply.anticipated_comment}"</p>
                                    </div>
                                    <div className="ml-11 bg-pink-50 text-pink-900 p-3 rounded-r-xl rounded-bl-xl text-sm font-medium relative border border-pink-100">
                                        {reply.suggested_reply}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded-full text-pink-600 ring-1 ring-pink-200/50">
                                                {reply.tone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
