"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SourceStats } from "@/types";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(17,17,25,0.95)", border: "1px solid rgba(30,30,46,0.6)", borderRadius: 12, padding: "10px 16px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>{label}</p>
      <p style={{ fontSize: 12, color: "#a0a0b8", marginTop: 3 }}>{payload[0].value} ukupno</p>
    </div>
  );
};

export default function SourceBarChart({ data, title, color }: { data: SourceStats[]; title: string; color: string }) {
  return (
    <div className="qcard p-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] mb-6" style={{ color: "#6b6b80" }}>{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-14"><p style={{ color: "#3a3a4e", fontSize: 13 }}>Nema podataka</p></div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,0.5)" vertical={false} />
            <XAxis dataKey="source" tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={{ stroke: "rgba(30,30,46,0.5)" }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.03)" }} />
            <Bar dataKey="count" fill={color} radius={[8, 8, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
