"use client";
import { useState, useEffect } from "react";
import {
    CalendarDays, Loader2, Plus, Sparkles, AlertCircle,
    Clock, CheckCircle2, Trash2, Calendar as CalendarIcon,
    ChevronRight, ArrowRight, Video, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { schedulerApi } from "@/lib/api";
import { useAccount } from "@/lib/account-context";
import { format, parseISO, isPast } from "date-fns";


export default function SchedulerPage() {
    const { creatorId } = useAccount();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    async function fetchSchedule() {
        setLoading(true);
        try {
            const res = await schedulerApi.getSchedule(creatorId);
            setSchedule(res.data);
        } catch (err) { }
        setLoading(false);
    }

    async function handleGeneratePlan() {
        setGenerating(true);
        try {
            await schedulerApi.generateSmartPlan(creatorId, 7);
            await fetchSchedule();
        } catch (err) { }
        setGenerating(false);
    }

    async function handleDelete(id: string) {
        try {
            await schedulerApi.deleteItem(creatorId, id);
            setSchedule(s => s.filter(item => item.id !== id));
        } catch (err) { }
    }

    if (loading && schedule.length === 0) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-gray-400 gap-2.5">
                <Loader2 className="animate-spin text-violet-400" size={20} /> Loading your content calendar...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 tracking-tight">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5 mb-1.5">
                        <CalendarDays size={24} className="text-emerald-500" />
                        Post Scheduler
                    </h1>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Smart planning based on your workload signals and AI audience predictions.
                    </p>
                </div>
                <button onClick={handleGeneratePlan} disabled={generating}
                    className="btn btn-brand gap-2 px-6 py-2.5 shadow-md shadow-emerald-500/20"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {generating ? "Mapping your week..." : "Generate 7-Day Plan"}
                </button>
            </div>

            {schedule.length === 0 && !loading ? (
                <div className="card text-center py-24 border-dashed border-2 bg-transparent flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-400 flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                        <CalendarIcon size={32} />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Your Calendar is Empty</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-8 font-medium">
                        Let Inflomnia AI analyse your reach patterns to predict the best times and formats for your next hit.
                    </p>
                    <button onClick={handleGeneratePlan} disabled={generating}
                        className="btn btn-outline gap-2 px-8 py-3 text-emerald-600 border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50">
                        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Auto-Fill My Week
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {schedule.map(item => {
                        const date = parseISO(item.scheduled_at);
                        const isPastDueDate = isPast(date) && item.status !== "published";
                        const typeColor = item.content_type === 'reel' ? '#7c3aed' : '#3b82f6';
                        const typeBg = item.content_type === 'reel' ? '#ede9fe' : '#eff6ff';

                        return (
                            <div key={item.id} className="card group hover:shadow-xl transition-all duration-300 border-gray-100 flex flex-col pt-0 px-0 overflow-hidden">
                                {/* Top Bar */}
                                <div className={`h-1.5 w-full ${isPastDueDate ? 'bg-red-400' : 'bg-emerald-400'}`} />

                                <div className="px-5 py-5 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="text-left leading-none">
                                                <div className="text-sm font-black text-gray-900 mb-1">{format(date, "EEEE")}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(date, "h:mm a")}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-none">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-sm border"
                                                style={{ background: typeBg, color: typeColor, borderColor: typeColor + '20' }}>
                                                {item.content_type}
                                            </span>
                                            {isPastDueDate && (
                                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] bg-red-50 text-red-500 border border-red-100 shadow-sm flex items-center gap-1">
                                                    <AlertCircle size={8} /> Missed
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                            {item.topic || "Untitled Post"}
                                        </h3>

                                        {item.caption && (
                                            <div className="text-[11px] text-gray-500 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100 italic font-medium line-clamp-3">
                                                &ldquo;{item.caption}&rdquo;
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'suggested' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                                {item.status}
                                            </span>
                                        </div>
                                        <Link href={`/dashboard/accelerator/scripts?topic=${encodeURIComponent(item.topic || "")}`} className="text-[9px] font-bold uppercase tracking-widest text-violet-600 flex items-center gap-1 group/link">
                                            View Prep <ArrowRight size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add manual slot card */}
                    <button className="card border-dashed border-2 bg-transparent flex flex-col items-center justify-center py-10 group hover:border-violet-200 transition-all">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3 group-hover:bg-violet-50 group-hover:text-violet-400 transition-all">
                            <Plus size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-violet-500">Manual Slot</span>
                    </button>
                </div>
            )}
        </div>
    );
}
