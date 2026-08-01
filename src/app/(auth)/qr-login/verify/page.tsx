"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyState = "loading" | "success" | "error";

function QrVerifyInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("error");
      setMessage("Token QR tidak ditemukan");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/qr-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState("error");
          setMessage(data.error ?? "Verifikasi gagal");
          return;
        }
        setState("success");
      } catch {
        setState("error");
        setMessage("Terjadi kesalahan saat verifikasi");
      }
    }

    verify();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Verifikasi QR</h1>
      {state === "loading" && <p>Memverifikasi...</p>}
      {state === "success" && (
        <>
          <p className="text-green-600">Login berhasil dikonfirmasi!</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Buka Dashboard
          </button>
        </>
      )}
      {state === "error" && <p className="text-red-600">{message}</p>}
    </main>
  );
}

export default function QrVerifyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Memuat...</p>}>
      <QrVerifyInner />
    </Suspense>
  );
}
