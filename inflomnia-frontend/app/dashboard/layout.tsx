"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, BarChart2, MessageCircle, BatteryCharging, Film,
    BadgeDollarSign, PersonStanding, ScrollText,
    Brain, CalendarDays, Sparkles
} from "lucide-react";

const coreNav = [
    { href: "/dashboard", label: "My Dashboard", icon: Home },
    { href: "/dashboard/reach", label: "Reach Health", icon: BarChart2 },
    { href: "/dashboard/shield", label: "Comment Shield", icon: MessageCircle },
    { href: "/dashboard/workload", label: "Creator Burnout", icon: BatteryCharging },
    { href: "/dashboard/instagram", label: "My Reels", icon: Film },
];

const monetizeNav = [
    { href: "/dashboard/accelerator/pricing", label: "Deal Pricing", icon: BadgeDollarSign },
    { href: "/dashboard/accelerator/matching", label: "Brand Matching", icon: PersonStanding },
    { href: "/dashboard/accelerator/scripts", label: "Script Writer", icon: ScrollText },
];

const aiNav = [
    { href: "/dashboard/intelligence", label: "AI Insights", icon: Brain },
    { href: "/dashboard/scheduler", label: "Post Scheduler", icon: CalendarDays },
];

function NavLink({ href, label, icon: Icon, pathname }: {
    href: string; label: string; icon: React.ElementType; pathname: string;
}) {
    const active = pathname === href;
    return (
        <Link href={href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                ? "bg-violet-50 text-violet-700 font-semibold shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}>
            <Icon size={16} className={active ? "text-violet-600" : "text-gray-400"} />
            {label}
        </Link>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* ── Sidebar ── */}
            <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm">

                {/* Logo */}
                <div className="px-5 pt-6 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                            <Sparkles size={17} className="text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-900 tracking-tight">Inflomnia</div>
                            <div className="text-[11px] font-medium" style={{ color: "#7c3aed" }}>Creator Hub</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 pt-4 pb-3 space-y-5 overflow-y-auto">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">My Space</p>
                        <div className="space-y-0.5">
                            {coreNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Monetize</p>
                        <div className="space-y-0.5">
                            {monetizeNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">AI Tools</p>
                        <div className="space-y-0.5">
                            {aiNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                        </div>
                    </div>
                </nav>

                {/* Inflomnia AI badge */}
                <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-violet-50 border border-violet-100">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-gray-800">Inflomnia AI</p>
                            <p className="text-[10px] text-emerald-600">Active &amp; ready</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    );
}
