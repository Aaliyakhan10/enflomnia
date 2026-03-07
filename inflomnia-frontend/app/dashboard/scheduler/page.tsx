"use client";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Loader, Plus, Sparkles, AlertCircle, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { schedulerApi } from "@/lib/api";
import { format, parseISO, isPast } from "date-fns";

const CREATOR_ID = "demo-creator-001";

export default function SchedulerPage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    async function fetchSchedule() {
        setLoading(true);
        try {
            const res = await schedulerApi.getSchedule(CREATOR_ID);
            setSchedule(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function handleGeneratePlan() {
        setGenerating(true);
        try {
            await schedulerApi.generateSmartPlan(CREATOR_ID, 7);
            await fetchSchedule();
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    }

    async function handleDelete(id: string) {
        try {
            await schedulerApi.deleteItem(CREATOR_ID, id);
            setSchedule(s => s.filter(item => item.id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    if (loading && schedule.length === 0) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-gray-400 gap-2">
                <Loader className="animate-spin" size={20} /> Loading Content Scheduler...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon size={22} className="text-emerald-400" /> Content Scheduler
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">Automated planning based on workload signals and intelligence predictions.</p>
                </div>
                <button
                    onClick={handleGeneratePlan}
                    disabled={generating}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50"
                >
                    {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {generating ? "Generating Plan..." : "Generate Smart Plan"}
                </button>
            </div>

            {schedule.length === 0 && !loading ? (
                <div className="card text-center py-20 border-emerald-200 bg-emerald-50">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Content Scheduled</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                        Let Claude analyse your recent engagement heatmap and predict the absolute best times and formats for your next 7 days.
                    </p>
                    <button
                        onClick={handleGeneratePlan}
                        disabled={generating}
                        className="px-6 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 transition-all text-sm flex items-center gap-2 mx-auto"
                    >
                        {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Auto-Fill Calendar
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {schedule.map(item => {
                        const date = parseISO(item.scheduled_at);
                        const isRun = isPast(date) && item.status !== "published";

                        return (
                            <div key={item.id} className="card flex flex-col hover:border-emerald-500/30 transition-all group">
                                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRun ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                            {isRun ? <AlertCircle size={14} /> : <Clock size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{format(date, "EEEE")}</div>
                                            <div className="text-[10px] text-gray-500">{format(date, "MMM d, h:mm a")}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-200 mb-2 inline-block">
                                        {item.content_type}
                                    </span>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">{item.topic || "Untitled Post"}</h3>
                                    {item.caption && (
                                        <div className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-4 bg-gray-50 p-2 rounded-md border border-gray-200">
                                            {item.caption}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${item.status === 'suggested' ? 'text-emerald-400' :
                                        item.status === 'published' ? 'text-gray-500' : 'text-yellow-400'
                                        }`}>
                                        • {item.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
