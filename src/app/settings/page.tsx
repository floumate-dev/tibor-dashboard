"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Organization } from "@/types";

export default function SettingsPage() {
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchOrgs(); }, []);
  async function fetchOrgs() { const { data } = await supabase.from("organizations").select("*").order("name"); setOrganizations(data || []); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newSlug) return;
    setSaving(true);
    const { error } = await supabase.from("organizations").insert({ name: newName, slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
    if (!error) { setNewName(""); setNewSlug(""); fetchOrgs(); }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="mb-9">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>Podešavanja</h1>
        <p className="text-[13px] mt-1" style={{ color: "#6b6b80" }}>Upravljanje klijentima i integracijama</p>
      </div>

      <div className="qcard p-6 mb-5">
        <h2 className="font-semibold text-[14px] mb-5" style={{ color: "#e8e8f0" }}>Dodaj novog klijenta</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input type="text" placeholder="Ime klijenta" value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")); }} className="qinput flex-1" />
          <input type="text" placeholder="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="qinput w-36 font-mono" />
          <button type="submit" disabled={saving} className="qbtn">Dodaj</button>
        </form>
      </div>

      <div className="qcard overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(30,30,46,0.5)" }}>
          <h2 className="font-semibold text-[14px]" style={{ color: "#e8e8f0" }}>Klijenti</h2>
        </div>
        {organizations.map((org, i) => (
          <div key={org.id} className="px-6 py-4 flex items-center justify-between transition-colors"
            style={{ borderBottom: i < organizations.length - 1 ? "1px solid rgba(30,30,46,0.3)" : "none" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(24,24,36,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>{org.name[0]}</div>
              <div>
                <p className="font-medium text-[13.5px]" style={{ color: "#e8e8f0" }}>{org.name}</p>
                <p className="text-[10.5px] font-mono" style={{ color: "#3a3a4e" }}>/{org.slug}</p>
              </div>
            </div>
            <Link href={`/settings/${org.slug}`} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ color: "#a78bfa", background: "rgba(139,92,246,0.08)" }}>Webhook setup</Link>
          </div>
        ))}
        {organizations.length === 0 && <p className="px-6 py-14 text-center text-[13px]" style={{ color: "#3a3a4e" }}>Nema dodanih klijenata</p>}
      </div>
    </div>
  );
}
