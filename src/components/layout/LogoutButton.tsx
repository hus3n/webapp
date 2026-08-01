"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={
        className ||
        "w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold px-4 py-2.5 text-sm transition-all duration-200 disabled:opacity-50 border border-red-200/60 shadow-sm"
      }
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      <span>{loading ? "Keluar..." : "Keluar Sesi"}</span>
    </button>
  );
}
