import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createServerSupabaseClient();
  const { data: organizations } = await supabase.from("organizations").select("*").order("name");

  const orgStats = await Promise.all(
    (organizations || []).map(async (org) => {
      const [{ count: leadCount }, { count: purchaseCount }] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }).eq("org_id", org.id),
        supabase.from("purchases").select("*", { count: "exact", head: true }).eq("org_id", org.id),
      ]);
      return { ...org, leadCount: leadCount || 0, purchaseCount: purchaseCount || 0 };
    })
  );

  return (
    <div>
      <div className="mb-9">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>Dashboard</h1>
        <p className="text-[13px] mt-1" style={{ color: "#6b6b80" }}>Pregled leadova i kupovina za sve klijente</p>
      </div>

      {orgStats.length === 0 ? (
        <div className="qcard p-16 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-[14px] mb-5" style={{ color: "#6b6b80" }}>Nema dodanih klijenata.</p>
          <Link href="/settings" className="qbtn inline-flex">Dodaj prvog klijenta</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgStats.map((org) => (
            <Link key={org.id} href={`/dashboard/${org.slug}`} className="qcard-hover p-6 block">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[15px] font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
                  {org.name[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-[15px]" style={{ color: "#e8e8f0" }}>{org.name}</h2>
                  <p className="text-[11px] font-mono" style={{ color: "#3a3a4e" }}>/{org.slug}</p>
                </div>
              </div>
              <div className="flex gap-10">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#3a3a4e" }}>Leadovi</p>
                  <p className="text-[26px] font-bold tracking-tight" style={{ color: "#c4b5fd" }}>{org.leadCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#3a3a4e" }}>Kupovine</p>
                  <p className="text-[26px] font-bold tracking-tight" style={{ color: "#34d399" }}>{org.purchaseCount}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
