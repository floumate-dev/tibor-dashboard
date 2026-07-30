import { subDays, startOfDay, format } from "date-fns";
import type { DateRange } from "@/types";

export function getDateRangeStart(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today":
      return startOfDay(now);
    case "7d":
      return startOfDay(subDays(now, 7));
    case "30d":
      return startOfDay(subDays(now, 30));
    case "90d":
      return startOfDay(subDays(now, 90));
    case "all":
      return null;
  }
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd.MM.yyyy");
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd.MM.yyyy HH:mm");
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export function getSourceColor(index: number): string {
  return COLORS[index % COLORS.length];
}
