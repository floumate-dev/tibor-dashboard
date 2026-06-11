"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { TimelinePoint } from "@/types";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(17,17,25,0.95)", border: "1px solid rgba(30,30,46,0.6)", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0", marginBottom: 6 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2" style={{ fontSize: 12, marginTop: 3 }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: "#a0a0b8" }}>{entry.name}:</span>
          <span style={{ color: "#e8e8f0", fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function TimelineChart({ data }: { data: TimelinePoint[] }) {
  return (
    <div className="qcard p-6">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] mb-6" style={{ color: "#6b6b80" }}>Leadovi i kupovine kroz vreme</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center py-14"><p style={{ color: "#3a3a4e", fontSize: 13 }}>Nema podataka</p></div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,30,46,0.5)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={{ stroke: "rgba(30,30,46,0.5)" }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b6b80" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#6b6b80" }} iconType="circle" iconSize={7} />
            <Area type="monotone" dataKey="leads" name="Leadovi" stroke="#8b5cf6" strokeWidth={2} fill="url(#gL)" />
            <Area type="monotone" dataKey="purchases" name="Kupovine" stroke="#34d399" strokeWidth={2} fill="url(#gP)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
