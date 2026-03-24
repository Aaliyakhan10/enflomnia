"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, BarChart2, MessageCircle, BatteryCharging, Film,
    BadgeDollarSign, PersonStanding, ScrollText,
    Brain, CalendarDays, Sparkles, Instagram,
    Database, Plug, BookOpen, Table2
} from "lucide-react";
import { AccountProvider, useAccount } from "@/lib/account-context";

const coreNav = [
    { href: "/dashboard", label: "System Overview", icon: Home },
    { href: "/dashboard/reach", label: "System Pulse", icon: BarChart2 },
    { href: "/dashboard/shield", label: "The Aegis", icon: MessageCircle },
    { href: "/dashboard/workload", label: "The Pulse", icon: BatteryCharging },
    { href: "/dashboard/instagram", label: "Asset Gallery", icon: Film },
];

const monetizeNav = [
    { href: "/dashboard/accelerator/pricing", label: "Remotion Engine", icon: BadgeDollarSign },
    { href: "/dashboard/accelerator/matching", label: "Imagen 4 Studio", icon: PersonStanding },
    { href: "/dashboard/accelerator/scripts", label: "Gemini Cortex", icon: ScrollText },
];

const aiNav = [
    { href: "/dashboard/intelligence", label: "The DNA & Soil", icon: Brain },
    { href: "/dashboard/scheduler", label: "Autonomous Loop", icon: CalendarDays },
];

const vaultNav = [
    { href: "/dashboard/vault", label: "Vault Overview", icon: Database },
    { href: "/dashboard/vault/connectors", label: "Connectors", icon: Plug },
    { href: "/dashboard/vault/knowledge", label: "Knowledge Lake", icon: BookOpen },
    { href: "/dashboard/vault/facts", label: "Fact Database", icon: Table2 },
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

function SidebarBottom() {
    const { account, isConnected, isLoading } = useAccount();
    return (
        <div className="p-3 border-t border-gray-100 space-y-2">
            {/* Connected account chip */}
            {!isLoading && isConnected && (
                <Link href="/dashboard/instagram"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-pink-50 border border-pink-100 hover:bg-pink-100 transition-colors">
                    {account?.profile_picture_url ? (
                        <img src={account.profile_picture_url} alt={account.username}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-2 ring-pink-200" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <Instagram size={12} className="text-white" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">@{account?.username || "connected"}</p>
                        {account?.followers_count && (
                            <p className="text-[10px] text-pink-600 font-medium">{account.followers_count.toLocaleString()} followers</p>
                        )}
                    </div>
                </Link>
            )}

            {/* AI status badge */}
            <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-violet-50 border border-violet-100">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-gray-300'}`} />
                <div>
                    <p className="text-xs font-semibold text-gray-800">Enflomnia AI</p>
                    <p className={`text-[10px] ${isConnected ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {isLoading ? "Checking..." : isConnected ? "Nervous System Ready" : "System Offline"}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DashboardSidebar() {
    const pathname = usePathname();
    return (
        <aside className="w-60 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm">
            {/* Logo */}
            <div className="px-5 pt-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                        <Sparkles size={17} className="text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 tracking-tight">Enflomnia</div>
                        <div className="text-[11px] font-medium" style={{ color: "#7c3aed" }}>Nervous System</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 pt-4 pb-3 space-y-5 overflow-y-auto">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Core Nervous System</p>
                    <div className="space-y-0.5">
                        {coreNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Asset Factory</p>
                    <div className="space-y-0.5">
                        {monetizeNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Cognition</p>
                    <div className="space-y-0.5">
                        {aiNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Enterprise Vault</p>
                    <div className="space-y-0.5">
                        {vaultNav.map(i => <NavLink key={i.href} {...i} pathname={pathname} />)}
                    </div>
                </div>
            </nav>

            <SidebarBottom />
        </aside>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AccountProvider>
            <div className="flex min-h-screen bg-gray-50">
                <DashboardSidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </AccountProvider>
    );
}
