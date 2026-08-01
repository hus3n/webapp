"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

interface UserProp {
  nama: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  guru: "Guru Pengampu",
  admin: "Administrator",
  superadmin: "Super Admin",
};

export default function DashboardNav({
  user,
  children,
}: {
  user: UserProp;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isManager = user.role === "admin" || user.role === "superadmin";

  const guruNav = [
    { label: "Beranda", href: "/dashboard", icon: "🏠" },
    { label: "Setor Hafalan", href: "/dashboard/guru/hafalan", icon: "📖" },
    { label: "Jadwal Murajaah", href: "/dashboard/guru/murajaah", icon: "📅" },
    { label: "Pesan WA Massal", href: "/dashboard/guru/bulk-message", icon: "💬" },
  ];

  const managerNav = [
    { label: "Beranda", href: "/dashboard", icon: "🏠" },
    { label: "Manajemen User", href: "/dashboard/admin/users", icon: "👥" },
    { label: "Dashboard Hafalan", href: "/dashboard/admin/hafalan", icon: "📊" },
    { label: "Dashboard Murajaah", href: "/dashboard/admin/murajaah", icon: "📅" },
    { label: "Data Kelas", href: "/dashboard/admin/kelas", icon: "🏫" },
    { label: "Data Santri", href: "/dashboard/admin/santri", icon: "🎒" },
    { label: "Laporan CSV", href: "/dashboard/admin/reports", icon: "📥" },
    { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: "📜" },
  ];

  const navItems = isManager ? managerNav : guruNav;

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800">
      {/* Top Header - Mobile Only */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md">
            🕌
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Hafalan Santri</h1>
            <p className="text-[11px] text-emerald-400 font-medium">
              {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-900/95 backdrop-blur-xl animate-fade-in text-white p-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-xl font-bold">
                🕌
              </div>
              <div>
                <p className="font-bold text-lg">{user.nama}</p>
                <p className="text-xs text-emerald-400">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-slate-800">
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white min-h-screen sticky top-0 shadow-xl border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">
              🕌
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">Hafalan Santri</h1>
              <p className="text-xs text-emerald-400 font-medium">Sistem Monitoring Quran</p>
            </div>
          </div>
        </div>

        {/* User Info Badge */}
        <div className="mx-4 my-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user.nama.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.nama}</p>
            <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40 translate-x-1"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white hover:translate-x-0.5"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800/80">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-8 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar (HP Friendly) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                active ? "text-emerald-600 font-bold scale-105" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium leading-tight mt-0.5">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
