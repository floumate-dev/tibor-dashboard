"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lead, SourceStats, TimelinePoint } from "@/types";
import KpiCards from "@/components/dashboard/KpiCards";
import SourceBarChart from "@/components/dashboard/SourceBarChart";
import TimelineChart from "@/components/dashboard/TimelineChart";
import LeadsTable from "@/components/dashboard/LeadsTable";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { format, subDays, startOfDay } from "date-fns";

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const supabase = useMemo(() => createClient(), []);

  const [startDate, setStartDate] = useState(() => subDays(startOfDay(new Date()), 30));
  const [endDate, setEndDate] = useState(() => startOfDay(new Date()));
  const [orgName, setOrgName] = useState("");
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topSource, setTopSource] = useState("");
  const [leadsBySource, setLeadsBySource] = useState<SourceStats[]>([]);
  const [purchasesBySource, setPurchasesBySource] = useState<SourceStats[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDateChange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("slug", orgSlug)
        .single();

      if (!org) return;
      setOrgName(org.name);

      // End of endDate day
      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);

      let leadQuery = supabase
        .from("leads")
        .select("*")
        .eq("org_id", org.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", rangeEnd.toISOString())
        .order("created_at", { ascending: false });

      let purchaseQuery = supabase
        .from("purchases")
        .select("*")
        .eq("org_id", org.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", rangeEnd.toISOString())
        .order("created_at", { ascending: false });

      const [{ data: leads }, { data: purchases }] = await Promise.all([
        leadQuery,
        purchaseQuery,
      ]);

      const allLeads = leads || [];
      const allPurchases = purchases || [];

      setTotalLeads(allLeads.length);
      setTotalPurchases(allPurchases.length);
      setRecentLeads(allLeads.slice(0, 20));

      const revenue = allPurchases.reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalRevenue(revenue);

      const leadSourceMap: Record<string, number> = {};
      allLeads.forEach((l) => {
        leadSourceMap[l.source] = (leadSourceMap[l.source] || 0) + 1;
      });
      const leadStats = Object.entries(leadSourceMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      setLeadsBySource(leadStats);
      setTopSource(leadStats[0]?.source || "");

      const purchaseSourceMap: Record<string, number> = {};
      allPurchases.forEach((p) => {
        purchaseSourceMap[p.source] = (purchaseSourceMap[p.source] || 0) + 1;
      });
      setPurchasesBySource(
        Object.entries(purchaseSourceMap)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
      );

      const timelineMap: Record<string, { leads: number; purchases: number }> = {};
      allLeads.forEach((l) => {
        const day = format(new Date(l.created_at), "dd.MM");
        if (!timelineMap[day]) timelineMap[day] = { leads: 0, purchases: 0 };
        timelineMap[day].leads++;
      });
      allPurchases.forEach((p) => {
        const day = format(new Date(p.created_at), "dd.MM");
        if (!timelineMap[day]) timelineMap[day] = { leads: 0, purchases: 0 };
        timelineMap[day].purchases++;
      });
      setTimeline(
        Object.entries(timelineMap)
          .map(([date, data]) => ({ date, ...data }))
          .reverse()
      );

      setLoading(false);
    }

    fetchData();
  }, [orgSlug, startDate, endDate, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "#3a3a4e" }}>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: "#e8e8f0" }}>{orgName}</h1>
        <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateChange} />
      </div>

      <KpiCards
        totalLeads={totalLeads}
        totalPurchases={totalPurchases}
        topSource={topSource}
        totalRevenue={totalRevenue}
        currency="EUR"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SourceBarChart data={leadsBySource} title="Leadovi po source-u" color="#8b5cf6" />
        <SourceBarChart data={purchasesBySource} title="Kupovine po source-u" color="#34d399" />
      </div>

      <TimelineChart data={timeline} />
      <LeadsTable leads={recentLeads} />
    </div>
  );
}
