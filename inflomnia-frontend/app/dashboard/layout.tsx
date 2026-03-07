"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, TrendingDown, Zap, LayoutDashboard, DollarSign, FileText, Users, Rocket, Instagram, Lightbulb, Calendar } from "lucide-react";

const shieldNav = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/reach", label: "Reach Health", icon: TrendingDown },
    { href: "/dashboard/shield", label: "Comment Shield", icon: Shield },
    { href: "/dashboard/workload", label: "Workload Signals", icon: Zap },
    { href: "/dashboard/instagram", label: "Instagram Reels", icon: Instagram },
];

const acceleratorNav = [
    { href: "/dashboard/accelerator/pricing", label: "Brand Deal Pricing", icon: DollarSign },
    { href: "/dashboard/accelerator/matching", label: "Brand Matching", icon: Users },
    { href: "/dashboard/accelerator/scripts", label: "Script Generator", icon: FileText },
];

const intelligenceNav = [
    { href: "/dashboard/intelligence", label: "Insights & Strategy", icon: Lightbulb },
    { href: "/dashboard/scheduler", label: "Content Scheduler", icon: Calendar },
];

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.ElementType; pathname: string }) {
    const active = pathname === href;
    return (
        <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-fuchsia-600/10 text-fuchsia-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}>
            <Icon size={15} />
            {label}
        </Link>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 border-r border-gray-200 flex flex-col"
                style={{ background: "var(--surface-2)" }}>

                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-sm text-gray-900 tracking-wide">Inflomnia</span>
                        <p className="text-[10px] text-fuchsia-600 font-medium">Creator Hub</p>
                    </div>
                </div>

                <nav className="p-3 flex-1 space-y-4 overflow-y-auto">
                    {/* The Shield */}
                    <div>
                        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">
                            🛡️ The Shield
                        </p>
                        <div className="space-y-0.5">
                            {shieldNav.map(item => (
                                <NavLink key={item.href} {...item} pathname={pathname} />
                            ))}
                        </div>
                    </div>

                    {/* The Accelerator */}
                    <div>
                        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1 mt-4">
                            🚀 The Accelerator
                        </p>
                        <div className="space-y-0.5">
                            {acceleratorNav.map(item => (
                                <NavLink key={item.href} {...item} pathname={pathname} />
                            ))}
                        </div>
                    </div>

                    {/* Content Intelligence */}
                    <div>
                        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1 mt-4">
                            🧠 Content Intelligence
                        </p>
                        <div className="space-y-0.5">
                            {intelligenceNav.map(item => (
                                <NavLink key={item.href} {...item} pathname={pathname} />
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200">
                    <div className="rounded-lg p-3 flex items-center gap-3"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <div>
                            <p className="text-[11px] font-semibold text-gray-900">Claude 3.5 Sonnet</p>
                            <p className="text-[10px] text-emerald-600">AI Engine Active</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
