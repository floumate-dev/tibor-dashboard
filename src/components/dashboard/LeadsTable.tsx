import { formatDateTime } from "@/lib/utils";
import type { Lead } from "@/types";

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="qcard overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(30,30,46,0.5)" }}>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#6b6b80" }}>Poslednji leadovi</h3>
        <span className="text-[11px] font-medium" style={{ color: "#3a3a4e" }}>{leads.length} prikazano</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(30,30,46,0.5)" }}>
              {["Datum", "Source", "Medium", "Campaign", "Email"].map((h) => (
                <th key={h} className="text-left px-6 py-3 font-semibold" style={{ color: "#3a3a4e", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-14 text-center" style={{ color: "#3a3a4e" }}>Nema leadova za izabrani period</td></tr>
            ) : leads.map((lead, i) => (
              <tr key={lead.id} className="transition-colors" style={{
                borderBottom: "1px solid rgba(30,30,46,0.3)",
                background: i % 2 === 0 ? "rgba(17,17,25,0.4)" : "transparent",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(24,24,36,0.6)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "rgba(17,17,25,0.4)" : "transparent"}
              >
                <td className="px-6 py-3.5 whitespace-nowrap" style={{ color: "#a0a0b8" }}>{formatDateTime(lead.created_at)}</td>
                <td className="px-6 py-3.5">
                  <span className="qbadge" style={{ background: "rgba(139,92,246,0.1)", color: "#c4b5fd" }}>{lead.source}</span>
                </td>
                <td className="px-6 py-3.5" style={{ color: "#6b6b80" }}>{lead.medium || "—"}</td>
                <td className="px-6 py-3.5" style={{ color: "#6b6b80" }}>{lead.campaign || "—"}</td>
                <td className="px-6 py-3.5 font-mono" style={{ color: "#6b6b80", fontSize: 12 }}>{lead.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
