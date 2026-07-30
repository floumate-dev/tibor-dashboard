"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = ["Siječanj","Veljača","Ožujak","Travanj","Svibanj","Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"];
const MONTHS_SHORT = ["sij","velj","ožu","tra","svi","lip","srp","kol","ruj","lis","stu","pro"];
const DOW = ["Ne","Po","Ut","Sr","Če","Pe","Su"];

function ymd(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonthsD(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function fmt(d: Date) { return d.getDate() + ". " + MONTHS_SHORT[d.getMonth()] + " " + d.getFullYear(); }
function eq(a: Date | null, b: Date | null) { return !!a && !!b && a.getTime() === b.getTime(); }

export interface Range { start: Date; end: Date; presetId: string | null; }

interface Preset { id: string; label: string; range: () => [Date, Date]; }

function buildPresets(today: Date): Preset[] {
  return [
    { id: "today", label: "Danas", range: () => [today, today] },
    { id: "yesterday", label: "Jučer", range: () => { const y = addDays(today, -1); return [y, y]; } },
    { id: "this_month", label: "Ovaj mjesec", range: () => [startOfMonth(today), today] },
    { id: "last_7", label: "Posljednjih 7 dana", range: () => [addDays(today, -6), today] },
    { id: "last_14", label: "Posljednjih 14 dana", range: () => [addDays(today, -13), today] },
    { id: "last_30", label: "Posljednjih 30 dana", range: () => [addDays(today, -29), today] },
    { id: "last_3m", label: "Posljednja 3 mjeseca", range: () => [addMonthsD(today, -3), today] },
    { id: "last_6m", label: "Posljednjih 6 mjeseci", range: () => [addMonthsD(today, -6), today] },
    { id: "last_year", label: "Posljednja godina", range: () => [addMonthsD(today, -12), today] },
    { id: "ytd", label: "Od početka godine", range: () => [new Date(today.getFullYear(), 0, 1), today] },
    { id: "all_time", label: "Sve vrijeme", range: () => [new Date(2025, 0, 1), today] },
  ];
}

export function presetLabel(presetId: string | null, start: Date, end: Date, today: Date): string {
  if (presetId) {
    const p = buildPresets(today).find((x) => x.id === presetId);
    if (p) return p.label;
  }
  return fmt(start) + " — " + fmt(end);
}

export default function DateRangePicker({
  today,
  committed,
  onApply,
}: {
  today: Date;
  committed: Range;
  onApply: (r: Range) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | null>(committed.start);
  const [draftEnd, setDraftEnd] = useState<Date | null>(committed.end);
  const [draftPreset, setDraftPreset] = useState<string | null>(committed.presetId);
  const [viewLeft, setViewLeft] = useState<Date>(startOfMonth(committed.start));
  const [pickingEnd, setPickingEnd] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const PRESETS = buildPresets(today);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  function openPicker() {
    setDraftStart(committed.start);
    setDraftEnd(committed.end);
    setDraftPreset(committed.presetId);
    setViewLeft(startOfMonth(committed.start));
    setPickingEnd(false);
    setOpen(true);
  }

  function applyPreset(p: Preset) {
    const [s, e] = p.range();
    setDraftStart(ymd(s));
    setDraftEnd(ymd(e));
    setDraftPreset(p.id);
    let v = addMonthsD(startOfMonth(ymd(e)), -1);
    if (ymd(s).getTime() === ymd(e).getTime()) v = startOfMonth(ymd(s));
    setViewLeft(v);
    setPickingEnd(false);
  }

  function clickDay(day: Date) {
    if (!pickingEnd) {
      setDraftStart(ymd(day));
      setDraftEnd(null);
      setDraftPreset(null);
      setPickingEnd(true);
    } else {
      if (draftStart && day < draftStart) {
        setDraftEnd(draftStart);
        setDraftStart(ymd(day));
      } else {
        setDraftEnd(ymd(day));
      }
      setPickingEnd(false);
      setDraftPreset(null);
    }
  }

  function renderCalendar(month: Date, showLeft: boolean, showRight: boolean) {
    const first = startOfMonth(month);
    const startCell = addDays(first, -first.getDay());
    const cells = Array.from({ length: 42 }, (_, i) => addDays(startCell, i));
    return (
      <div>
        <div className="dp-cal-head">
          <button type="button" className={"dp-nav" + (showLeft ? "" : " invisible")} onClick={() => setViewLeft(addMonthsD(viewLeft, -1))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="dp-cal-title">{MONTHS[month.getMonth()]} {month.getFullYear()}</div>
          <button type="button" className={"dp-nav" + (showRight ? "" : " invisible")} onClick={() => setViewLeft(addMonthsD(viewLeft, 1))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="dp-cal-grid">
          {DOW.map((d) => <div key={d} className="dp-dow">{d}</div>)}
          {cells.map((day, i) => {
            const inMonth = day.getMonth() === month.getMonth();
            const isStart = eq(day, draftStart);
            const isEnd = eq(day, draftEnd);
            const inRange = draftStart && draftEnd && day > draftStart && day < draftEnd;
            const cls = ["dp-day"];
            if (!inMonth) cls.push("outside");
            if (eq(day, today)) cls.push("today");
            if (isStart && isEnd) cls.push("range-single");
            else if (isStart) cls.push("range-start");
            else if (isEnd) cls.push("range-end");
            else if (inRange) cls.push("in-range");
            return (
              <button key={i} type="button" className={cls.join(" ")} onClick={() => clickDay(day)}>{day.getDate()}</button>
            );
          })}
        </div>
      </div>
    );
  }

  const triggerLabel = presetLabel(committed.presetId, committed.start, committed.end, today);

  return (
    <div className="dp-wrap" ref={wrapRef}>
      <button type="button" className={"dp-trigger" + (open ? " open" : "")} onClick={() => (open ? setOpen(false) : openPicker())}>
        <svg className="dp-cal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{triggerLabel}</span>
        <svg className="dp-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      <div className={"dp-popover" + (open ? " open" : "")}>
        <div className="dp-presets">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className={"dp-preset-btn" + (draftPreset === p.id ? " active" : "")} onClick={() => applyPreset(p)}>{p.label}</button>
          ))}
        </div>
        <div className="dp-main">
          <div className="dp-toolbar">
            <select className="dp-select" value={viewLeft.getMonth()} onChange={(e) => setViewLeft(new Date(viewLeft.getFullYear(), parseInt(e.target.value), 1))}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="dp-select" value={viewLeft.getFullYear()} onChange={(e) => setViewLeft(new Date(parseInt(e.target.value), viewLeft.getMonth(), 1))}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="dp-calendars">
            {renderCalendar(viewLeft, true, false)}
            {renderCalendar(addMonthsD(viewLeft, 1), false, true)}
          </div>
          <div className="dp-footer">
            <div className="dp-range-text">
              {draftStart && draftEnd ? (
                <><strong>{fmt(draftStart)}</strong> — <strong>{fmt(draftEnd)}</strong></>
              ) : draftStart ? (
                <><strong>{fmt(draftStart)}</strong> — odaberi krajnji datum</>
              ) : ("Odaberi datum")}
            </div>
            <div className="dp-actions">
              <button type="button" className="dp-btn dp-btn-cancel" onClick={() => setOpen(false)}>Odustani</button>
              <button
                type="button"
                className="dp-btn dp-btn-apply"
                disabled={!draftStart || !draftEnd}
                onClick={() => {
                  if (!draftStart || !draftEnd) return;
                  onApply({ start: draftStart, end: draftEnd, presetId: draftPreset });
                  setOpen(false);
                }}
              >Primijeni</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
