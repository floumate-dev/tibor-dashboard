"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types";

export default function OrgSettingsPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const supabase = createClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    supabase.from("organizations").select("*").eq("slug", orgSlug).single().then(({ data }) => { if (data) setOrg(data); });
  }, [orgSlug]);

  function copy(text: string, id: string) { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 2000); }

  if (!org) return <div className="flex items-center justify-center py-20"><p style={{ color: "#3a3a4e" }}>Učitavanje...</p></div>;
  const wh = (p: string) => `${baseUrl}/api/webhooks/${p}/${org.slug}`;

  const webhooks = [
    { id: "generic", label: "Generički lead", url: wh("generic"), hint: 'POST {"email", "source", "medium", "campaign"}' },
    { id: "generic-purchase", label: "Generička kupovina", url: wh("generic-purchase"), hint: 'POST {"email", "source", "amount", "currency"}' },
    { id: "typeform", label: "Typeform", url: wh("typeform"), hint: "Podesi u Typeform > Connect > Webhooks" },
    { id: "stripe", label: "Stripe", url: wh("stripe"), hint: "Podesi u Stripe Dashboard > Webhooks" },
  ];

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="mb-9">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>{org.name}</h1>
        <p className="text-[13px] mt-1" style={{ color: "#6b6b80" }}>Webhook konfiguracija</p>
      </div>

      <div className="qcard p-7 mb-5">
        <h2 className="font-semibold text-[14px] mb-1.5" style={{ color: "#e8e8f0" }}>Webhook URL-ovi</h2>
        <p className="text-[12px] mb-7" style={{ color: "#3a3a4e" }}>Povežite forme i payment sisteme sa dashboardom.</p>
        <div className="space-y-5">
          {webhooks.map((w) => (
            <div key={w.id}>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: "#6b6b80" }}>{w.label}</label>
              <div className="flex gap-2">
                <code className="flex-1 px-4 py-2.5 rounded-xl text-[12px] font-mono break-all" style={{ background: "rgba(14,14,24,0.8)", border: "1px solid rgba(30,30,46,0.5)", color: "#c4b5fd" }}>{w.url}</code>
                <button onClick={() => copy(w.url, w.id)} className="px-3.5 py-2.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all" style={{ background: "rgba(24,24,36,0.8)", border: "1px solid rgba(30,30,46,0.5)", color: copied === w.id ? "#34d399" : "#6b6b80" }}>
                  {copied === w.id ? "Kopirano!" : "Kopiraj"}
                </button>
              </div>
              <p className="text-[10.5px] mt-1.5" style={{ color: "#3a3a4e" }}>{w.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="qcard p-7">
        <h2 className="font-semibold text-[14px] mb-5" style={{ color: "#e8e8f0" }}>Primer</h2>
        <pre className="p-5 rounded-xl text-[12px] font-mono leading-relaxed overflow-x-auto" style={{ background: "rgba(14,14,24,0.8)", border: "1px solid rgba(30,30,46,0.5)", color: "#a0a0b8" }}>
{`curl -X POST "${wh("generic")}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "lead@primer.com",
    "source": "facebook",
    "medium": "cpc",
    "campaign": "promo-mart"
  }'`}
        </pre>
      </div>
    </div>
  );
}
