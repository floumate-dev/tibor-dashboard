"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: "#0b0b14" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 50%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 80%, rgba(139,92,246,0.03) 0%, transparent 40%)" }} />

      <div className="relative w-full max-w-[420px] px-5">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-2xl mb-5" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", boxShadow: "0 0 30px rgba(139,92,246,0.25)" }}>
            <span className="text-white text-xl font-bold" style={{ letterSpacing: -1 }}>T</span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>Tracking</h1>
          <p className="text-sm mt-1.5" style={{ color: "#6b6b80" }}>Prijavi se na svoj dashboard</p>
        </div>

        <div className="qcard p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#6b6b80" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@primer.com" className="qinput" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#6b6b80" }}>Lozinka</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="qinput" />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="qbtn w-full py-3.5">{loading ? "Prijavljivanje..." : "Prijavi se"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
