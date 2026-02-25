"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, TrendingDown, Zap, LayoutDashboard } from "lucide-react";

const nav = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/reach", label: "Reach Health", icon: TrendingDown },
    { href: "/dashboard/shield", label: "Comment Shield", icon: Shield },
    { href: "/dashboard/workload", label: "Workload Signals", icon: Zap },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/[0.06]"
                style={{ background: "var(--surface-2)" }}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-sm text-white tracking-wide">Inflomnia</span>
                        <p className="text-[10px] text-indigo-400 font-medium">The Shield · Phase 1</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="p-3 space-y-1">
                    {nav.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link key={href} href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                                        ? "bg-indigo-500/20 text-indigo-300"
                                        : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                                    }`}>
                                <Icon size={16} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-4 left-0 w-64 px-4">
                    <div className="rounded-lg p-3 text-[11px] text-gray-500"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}>
                        <p className="font-semibold text-gray-400 mb-0.5">📡 Status</p>
                        <span className="text-green-400">● API Connected</span>
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
