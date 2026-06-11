"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Header({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="px-8 py-4 flex items-center justify-end" style={{ background: "rgba(11,11,20,0.6)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(30,30,46,0.4)" }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            {email[0].toUpperCase()}
          </div>
          <span className="text-[13px] font-medium" style={{ color: "#a0a0b8" }}>{email}</span>
        </div>
        <div style={{ width: 1, height: 20, background: "rgba(30,30,46,0.6)" }} />
        <button onClick={handleLogout} className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all" style={{ color: "#6b6b80" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#e8e8f0"; e.currentTarget.style.background = "rgba(30,30,46,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6b80"; e.currentTarget.style.background = "transparent"; }}>
          Odjavi se
        </button>
      </div>
    </header>
  );
}
