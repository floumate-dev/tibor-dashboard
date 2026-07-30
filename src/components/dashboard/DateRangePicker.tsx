"use client";

import { useState, useRef, useEffect } from "react";
import {
  format,
  startOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  getDay,
} from "date-fns";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

const PRESETS = [
  { label: "Danas", days: 0 },
  { label: "Juče", days: 1 },
  { label: "Poslednjih 7 dana", days: 7 },
  { label: "Poslednjih 14 dana", days: 14 },
  { label: "Poslednjih 30 dana", days: 30 },
  { label: "Poslednjih 90 dana", days: 90 },
  { label: "Ovaj mesec", days: -1 },
  { label: "Sve vreme", days: -2 },
];

const WEEKDAYS = ["Ne", "Po", "Ut", "Sr", "Če", "Pe", "Su"];

function CalendarMonth({
  month,
  startDate,
  endDate,
  hoverDate,
  selecting,
  onDayClick,
  onDayHover,
}: {
  month: Date;
  startDate: Date;
  endDate: Date;
  hoverDate: Date | null;
  selecting: boolean;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const effectiveEnd = selecting && hoverDate ? hoverDate : endDate;
  const rangeStart = effectiveEnd < startDate ? effectiveEnd : startDate;
  const rangeEnd = effectiveEnd < startDate ? startDate : effectiveEnd;

  return (
    <div className="w-[280px]">
      <p className="text-center text-[14px] font-semibold mb-4" style={{ color: "#e8e8f0" }}>
        {format(month, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-0 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase py-1" style={{ color: "#3a3a4e" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-9" />
        ))}
        {days.map((day) => {
          const isStart = isSameDay(day, rangeStart);
          const isEnd = isSameDay(day, rangeEnd);
          const inRange =
            rangeStart &&
            rangeEnd &&
            isWithinInterval(day, { start: rangeStart, end: rangeEnd });
          const isToday = isSameDay(day, new Date());

          let bg = "transparent";
          let color = "#a0a0b8";
          let borderRadius = "0";

          if (isStart || isEnd) {
            bg = "linear-gradient(135deg, #7c3aed, #8b5cf6)";
            color = "#fff";
            borderRadius = isStart && isEnd ? "10px" : isStart ? "10px 0 0 10px" : "0 10px 10px 0";
          } else if (inRange) {
            bg = "rgba(139,92,246,0.12)";
            color = "#c4b5fd";
          }

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              onMouseEnter={() => onDayHover(day)}
              className="h-9 flex items-center justify-center cursor-pointer transition-all duration-100 text-[13px] font-medium"
              style={{
                background: bg,
                color,
                borderRadius,
                border: isToday && !isStart && !isEnd ? "1px solid rgba(139,92,246,0.3)" : "none",
              }}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()));
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [selecting, setSelecting] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [activePreset, setActivePreset] = useState("Poslednjih 30 dana");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleDayClick(day: Date) {
    if (!selecting) {
      setTempStart(day);
      setTempEnd(day);
      setSelecting(true);
      setActivePreset("");
    } else {
      if (day < tempStart) {
        setTempEnd(tempStart);
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
      setSelecting(false);
    }
  }

  function handlePreset(preset: typeof PRESETS[number]) {
    const today = startOfDay(new Date());
    setActivePreset(preset.label);
    setSelecting(false);

    if (preset.days === 0) {
      setTempStart(today);
      setTempEnd(today);
    } else if (preset.days === 1) {
      const yesterday = subDays(today, 1);
      setTempStart(yesterday);
      setTempEnd(yesterday);
    } else if (preset.days === -1) {
      setTempStart(startOfMonth(today));
      setTempEnd(today);
    } else if (preset.days === -2) {
      setTempStart(new Date(2020, 0, 1));
      setTempEnd(today);
    } else {
      setTempStart(subDays(today, preset.days));
      setTempEnd(today);
    }
  }

  function handleApply() {
    onChange(tempStart, tempEnd);
    setOpen(false);
  }

  function handleCancel() {
    setTempStart(startDate);
    setTempEnd(endDate);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setTempStart(startDate); setTempEnd(endDate); }}
        className="flex items-center gap-3 px-4 py-[9px] rounded-xl text-[13px] font-medium transition-all duration-200"
        style={{
          background: "rgba(17,17,25,0.8)",
          border: open ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(30,30,46,0.5)",
          color: "#a0a0b8",
          boxShadow: open ? "0 0 16px rgba(139,92,246,0.1)" : "none",
        }}
      >
        <svg className="w-4 h-4" style={{ color: "#6b6b80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        {format(startDate, "dd.MM.yyyy")} – {format(endDate, "dd.MM.yyyy")}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 flex rounded-2xl overflow-hidden"
          style={{
            background: "rgba(14,14,22,0.97)",
            border: "1px solid rgba(30,30,46,0.6)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.05)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Presets */}
          <div className="w-[180px] py-3 flex flex-col" style={{ borderRight: "1px solid rgba(30,30,46,0.5)" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className="text-left px-5 py-[9px] text-[12.5px] font-medium transition-all duration-150"
                style={{
                  background: activePreset === preset.label ? "rgba(139,92,246,0.1)" : "transparent",
                  color: activePreset === preset.label ? "#c4b5fd" : "#6b6b80",
                  borderLeft: activePreset === preset.label ? "2px solid #8b5cf6" : "2px solid transparent",
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendars */}
          <div className="p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2 px-2">
              <button
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#6b6b80", background: "rgba(30,30,46,0.4)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#6b6b80", background: "rgba(30,30,46,0.4)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            <div className="flex gap-6">
              <CalendarMonth
                month={viewMonth}
                startDate={tempStart}
                endDate={tempEnd}
                hoverDate={hoverDate}
                selecting={selecting}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />
              <CalendarMonth
                month={addMonths(viewMonth, 1)}
                startDate={tempStart}
                endDate={tempEnd}
                hoverDate={hoverDate}
                selecting={selecting}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(30,30,46,0.5)" }}>
              <p className="text-[12px] font-mono" style={{ color: "#6b6b80" }}>
                {format(tempStart, "dd.MM.yyyy")} – {format(tempEnd, "dd.MM.yyyy")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-[7px] rounded-xl text-[12px] font-semibold transition-all"
                  style={{ color: "#6b6b80", border: "1px solid rgba(30,30,46,0.6)" }}
                >
                  Otkaži
                </button>
                <button onClick={handleApply} className="qbtn text-[12px] px-4 py-[7px]">
                  Primeni
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
