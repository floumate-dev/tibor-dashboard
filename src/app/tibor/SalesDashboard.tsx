"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DateRangePicker, { presetLabel, Range } from "./DateRangePicker";
import { CallRow, PACKAGES, PACKAGE_FALLBACK_COLOR, Stage } from "./data";

const USERS: Record<string, { name: string; vocative: string; photo: string }> = {
  "1212": { name: "Tibor", vocative: "Tibore", photo: "/tibor.png" },
  "3344": { name: "Matej", vocative: "Matej", photo: "/matej.png" },
};

type WebinarData = {
  webinar: string;
  webinarLabel: string;
  optin: number;
  application: number;
  sources: { key: string; label: string; count: number }[];
  availableWebinars: { slug: string; label: string }[];
};

const MONTHS_SHORT = ["jan","feb","mar","apr","maj","jun","jul","avg","sep","okt","nov","dec"];
const PAGE_SIZE = 10;

function fmtNum(n: number) { return n.toLocaleString("de-DE"); }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function dayDiff(a: Date, b: Date) { return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000); }

function relativeLabel(d: Date, today: Date) {
  const diff = dayDiff(today, d);
  if (diff <= 0) return "danas";
  if (diff === 1) return "juče";
  return `pre ${diff} dana`;
}

function dateCell(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${hh}:${mm}`;
}

const STAGE_BADGE: Record<Stage, { cls: string; label: string }> = {
  won: { cls: "badge-won", label: "Won" },
  lost: { cls: "badge-lost", label: "Lost" },
  no_show: { cls: "badge-noshow", label: "No-show" },
  lead: { cls: "badge-lead", label: "Lead" },
  scheduled: { cls: "badge-pending", label: "Zakazano" },
  showed_up: { cls: "badge-pending", label: "Awaiting" },
};

export default function SalesDashboard({ calls }: { calls: CallRow[] }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [screen, setScreen] = useState<"login" | "dept" | "dashboard" | "webinar">("login");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [user, setUser] = useState<{ name: string; vocative: string; photo: string } | null>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const [range, setRange] = useState<Range>({
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    end: today,
    presetId: "last_30",
  });
  const [pkgMode] = useState<"count" | "revenue">("count");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ---- webinar funnel (live from GHL via /api/webinar) ----
  const [webinar, setWebinar] = useState<WebinarData | null>(null);
  const [webinarLoading, setWebinarLoading] = useState(false);
  const [webinarError, setWebinarError] = useState("");
  // null = pusti API da auto-detektuje aktivni webinar; inače izabrani slug.
  const [webinarSlug, setWebinarSlug] = useState<string | null>(null);

  useEffect(() => {
    if (screen !== "webinar") return;
    let cancelled = false;
    setWebinarLoading(true);
    setWebinarError("");
    const url = webinarSlug
      ? `/api/webinar/tibor?webinar=${encodeURIComponent(webinarSlug)}`
      : "/api/webinar/tibor";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: WebinarData) => { if (!cancelled) setWebinar(d); })
      .catch((e) => { if (!cancelled) setWebinarError(e?.message || "Greška pri učitavanju"); })
      .finally(() => { if (!cancelled) setWebinarLoading(false); });
    return () => { cancelled = true; };
  }, [screen, webinarSlug]);

  function tryLogin() {
    const u = USERS[pin];
    if (u) {
      setUser(u);
      setScreen("dept");
    } else {
      setPinError("Pogrešan PIN, pokušaj ponovo");
      setPin("");
    }
  }

  // ---- aggregations over the selected range ----
  const filtered = useMemo(() => {
    const s = range.start.getTime();
    const e = range.end.getTime() + 86400000 - 1;
    return calls
      .filter((c) => { const t = new Date(c.date).getTime(); return t >= s && t <= e; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [calls, range]);

  // Lead = lead za zakazivanje poziva (NIJE zakazan poziv) → izdvojen iz metrika
  // poziva i prikazan zasebno. callRows = svi pravi pozivi (Call Booked +).
  const leads = useMemo(() => filtered.filter((c) => c.stage === "lead"), [filtered]);
  const callRows = useMemo(() => filtered.filter((c) => c.stage !== "lead"), [filtered]);

  const stats = useMemo(() => {
    const won = callRows.filter((c) => c.stage === "won");
    const noShow = callRows.filter((c) => c.stage === "no_show").length;
    const revenue = won.reduce((sum, c) => sum + (c.amount || 0), 0);
    const total = callRows.length;
    const conversion = total ? (won.length / total) * 100 : 0;
    const currency = won[0]?.currency || "EUR";
    return { total, wonCount: won.length, notClosed: total - won.length, noShow, revenue, conversion, currency, leadCount: leads.length };
  }, [callRows, leads]);

  const packages = useMemo(() => {
    const won = callRows.filter((c) => c.stage === "won");
    const map = new Map<string, { count: number; revenue: number }>();
    for (const c of won) {
      const key = c.package || "Custom";
      const cur = map.get(key) || { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += c.amount || 0;
      map.set(key, cur);
    }
    const ordered = PACKAGES.map((p) => ({
      name: p.name, color: p.color, price: p.price,
      count: map.get(p.name)?.count || 0,
      revenue: map.get(p.name)?.revenue || 0,
    }));
    for (const [name, v] of Array.from(map.entries())) {
      if (!PACKAGES.some((p) => p.name === name)) {
        ordered.push({ name, color: PACKAGE_FALLBACK_COLOR, price: null, count: v.count, revenue: v.revenue });
      }
    }
    const maxVal = Math.max(1, ...ordered.map((p) => (pkgMode === "count" ? p.count : p.revenue)));
    return ordered.map((p) => ({ ...p, width: ((pkgMode === "count" ? p.count : p.revenue) / maxVal) * 100 }));
  }, [callRows, pkgMode]);

  const lostReasons = useMemo(
    () => callRows.filter((c) => c.stage === "lost" && c.lost_reason),
    [callRows]
  );

  // Tabela "Svi pozivi" prikazuje samo prave pozive (bez Lead-ova).
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return callRows;
    return callRows.filter(
      (c) => (c.contact_name || "").toLowerCase().includes(q) || (c.contact_phone || "").toLowerCase().includes(q)
    );
  }, [callRows, search]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageRows = searched.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const rangeLabel = presetLabel(range.presetId, range.start, range.end, today);

  return (
    <div className="tibor-page">
      {/* LOGIN */}
      <div className={"login-screen" + (screen !== "login" ? " hidden" : "")}>
        <div className="login-card">
          <div className="login-brand" style={{ marginBottom: 28 }}>Tibor <span>· Dashboard</span></div>
          <div className="login-avatar">
            <img src="/tibor.png" alt="Tibor" />
          </div>
          <div className="login-greeting">Ćao 👋</div>
          <div className="login-greeting-sub">Unesi svoj PIN za pristup</div>
          <input
            ref={pinRef}
            className={"pin-input" + (pinError ? " error" : "")}
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="• • • •"
            autoComplete="off"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 4) tryLogin(); }}
          />
          <div className="pin-error-msg">{pinError}</div>
          <button className="login-btn-primary" disabled={pin.length !== 4} onClick={tryLogin}>Uloguj se</button>
          <div className="login-footer">powered by Floumate</div>
        </div>
      </div>

      {/* DEPARTMENT PICKER */}
      <div className={"dept-screen" + (screen === "dept" ? " visible" : "")}>
        <div className="dept-card">
          <div className="dept-brand">Tibor <span>· Dashboard</span></div>
          <div className="dept-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div>
          <div className="dept-greeting">Ćao, {user?.vocative || "Tibore"} 👋</div>
          <div className="dept-greeting-sub">Izaberi departman</div>
          <div className="dept-grid">
            <button className="dept-btn setting" type="button" onClick={() => alert("Appointment Setting Department\n\nOvo bi otvorilo postojeći setter tracker. U ovoj verziji aktivan je samo Sales dashboard.")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dept-name">Appointment Setting</div>
              <div className="dept-desc">Booked calls, conversations, follow-up-ovi, conversion rate. Postojeća platforma.</div>
            </button>
            <button className="dept-btn sales" type="button" onClick={() => setScreen("dashboard")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div className="dept-name">Sales</div>
              <div className="dept-desc">Pozivi, zatvoreni paketi, prihod i razlozi za izgubljene prilike.</div>
            </button>
            <button className="dept-btn webinar" type="button" onClick={() => setScreen("webinar")}>
              <div className="dept-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div className="dept-name">Webinar</div>
              <div className="dept-desc">Prijave, izvori dolaska i broj aplikacija po webinaru.</div>
            </button>
          </div>
          <button className="dept-back" type="button" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>← Odjavi se</button>
        </div>
      </div>

      {/* DASHBOARD — render only when logged in & department chosen, so it
          never flashes underneath the login/department overlays. */}
      {screen === "dashboard" && (
      <>
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">Tibor<em>· Sales Dashboard</em></div>
        <div className="header-right">
          <div className="header-user"><div className="header-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div><span>{user?.name || "Tibor"}</span></div>
          <button className="btn-dept" onClick={() => setScreen("dept")}>↔ Departmani</button>
          <button className="btn-logout" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>Odjava</button>
        </div>
      </header>

      {/* TAB BAR (decorative) */}
      <nav className="tab-bar">
        <button className="tab-btn active">Pregled</button>
        <button className="tab-btn">Grafici</button>
        <button className="tab-btn">Po paketima</button>
        <button className="tab-btn">Razlozi za lost</button>
        <button className="tab-btn">Svi pozivi</button>
      </nav>

      <main className="main-content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Pregled prodaje</div>
            <div className="page-subtitle">{rangeLabel}</div>
          </div>
          <DateRangePicker today={today} committed={range} onApply={(r) => { setRange(r); setPage(1); }} />
        </div>

        {/* KPI */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Leadovi</div>
            <div className="kpi-value">{stats.leadCount}</div>
            <div className="kpi-sub">za zakazivanje poziva</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pozivi</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">zakazani u periodu</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Zatvoreno</div>
            <div className="kpi-value green">{stats.wonCount}</div>
            <div className="kpi-sub"><strong>{stats.conversion.toFixed(1)}%</strong> conversion</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Nije zatvoreno</div>
            <div className="kpi-value danger">{stats.notClosed}</div>
            <div className="kpi-sub"><strong>{stats.noShow}</strong> no-show uračunato</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Prihod</div>
            <div className="kpi-value green">{fmtNum(stats.revenue)}</div>
            <div className="kpi-sub">{stats.currency}</div>
          </div>
        </div>

        {/* Packages + Lost reasons */}
        <div className="grid-2">
          <div className="section-card">
            <div className="section-head">
              <div>
                <div className="section-title">Prodaje po paketima</div>
                <div className="section-sub">{stats.wonCount} zatvorenih · {fmtNum(stats.revenue)} {stats.currency}</div>
              </div>
            </div>
            <div className="pkg-list">
              {packages.map((p) => (
                <div className="pkg-row" key={p.name}>
                  <div className="pkg-dot" style={{ background: p.color }} />
                  <div className="pkg-info">
                    <div className="pkg-name">{p.name}</div>
                    <div className="pkg-price-label">{p.price ? `${fmtNum(p.price)} € / kom` : "manuelna cena"}</div>
                  </div>
                  <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${p.width}%`, background: p.color }} /></div>
                  <div className="pkg-stats">
                    <div className="pkg-count">{p.count}</div>
                    <div className="pkg-revenue">{fmtNum(p.revenue)} €</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <div>
                <div className="section-title">Razlozi za lost</div>
                <div className="section-sub">{lostReasons.length} lost · originalni custom upisi</div>
              </div>
            </div>
            <div className="reasons-wrap">
              {lostReasons.length === 0 && <div className="reasons-empty">Nema izgubljenih poziva u ovom periodu.</div>}
              {lostReasons.map((c) => (
                <div className="reason-item" key={c.id}>
                  <div className="reason-quote-mark">&ldquo;</div>
                  <div className="reason-body">
                    <div className="reason-quote">{c.lost_reason}</div>
                    <div className="reason-meta">{c.contact_name} <span className="reason-meta-dot" /> {`${String(new Date(c.date).getDate()).padStart(2, "0")}.${MONTHS_SHORT[new Date(c.date).getMonth()]}`}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="reasons-footer">
              <div className="reasons-footer-info">
                <div className="reasons-footer-icon">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                </div>
                <span>Svaki razlog je tekst koji prodavac ručno upiše posle poziva</span>
              </div>
              <span className="reasons-footer-count">Prikazano {lostReasons.length} od {lostReasons.length}</span>
            </div>
          </div>
        </div>

        {/* Calls table */}
        <div className="calls-table-wrap">
          <div className="calls-table-head">
            <div>
              <div className="section-title">Svi pozivi</div>
              <div className="section-sub">{searched.length} zapisa · klik na red za detalje</div>
            </div>
            <input
              className="search-input"
              type="search"
              name="pozivi-pretraga"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              placeholder="Pretraga po imenu, telefonu…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <table>
            <thead>
              <tr>
                <th>Datum</th><th>Lead</th><th>Paket</th><th>Status</th>
                <th style={{ textAlign: "right" }}>Prihod</th><th>Razlog (lost)</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => {
                const badge = STAGE_BADGE[c.stage];
                return (
                  <tr key={c.id}>
                    <td><div className="cell-primary">{dateCell(c.date)}</div><div className="cell-sub">{relativeLabel(new Date(c.date), today)}</div></td>
                    <td><div className="cell-primary">{c.contact_name || "—"}</div><div className="cell-sub">{c.contact_phone || ""}</div></td>
                    <td className={c.package ? "" : "cell-muted"}>{c.package || "—"}</td>
                    <td><span className={"badge " + badge.cls}>{badge.label}</span></td>
                    <td className={c.stage === "won" ? "cell-revenue" : "cell-muted"} style={c.stage === "won" ? undefined : { textAlign: "right" }}>
                      {c.stage === "won" ? `${fmtNum(c.amount)} €` : "—"}
                    </td>
                    <td className={c.stage === "lost" && c.lost_reason ? "cell-quote" : "cell-muted"}>
                      {c.stage === "lost" && c.lost_reason ? `“${c.lost_reason}”` : "—"}
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={6}><div className="table-empty">Nema poziva za prikaz.</div></td></tr>
              )}
            </tbody>
          </table>

          <div className="table-foot">
            <div>Prikazano <strong>{pageRows.length}</strong> od {searched.length}</div>
            <div className="pager">
              <button className="pager-btn" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((n) => (
                <button key={n} className={"pager-btn" + (n === curPage ? " active" : "")} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="pager-btn" disabled={curPage >= totalPages} onClick={() => setPage(curPage + 1)}>›</button>
            </div>
          </div>
        </div>
      </main>
      </>
      )}

      {/* WEBINAR DASHBOARD */}
      {screen === "webinar" && (
      <>
      <header className="app-header">
        <div className="header-brand">Tibor<em>· Webinar Dashboard</em></div>
        <div className="header-right">
          <div className="header-user"><div className="header-avatar"><img src={user?.photo || "/tibor.png"} alt={user?.name || "Tibor"} /></div><span>{user?.name || "Tibor"}</span></div>
          <button className="btn-dept" onClick={() => setScreen("dept")}>↔ Departmani</button>
          <button className="btn-logout" onClick={() => { setScreen("login"); setPin(""); setPinError(""); }}>Odjava</button>
        </div>
      </header>

      <main className="main-content">
        <div className="page-title-row">
          <div>
            <div className="page-title">Webinar funnel</div>
          </div>
          {webinar && webinar.availableWebinars?.length > 0 && (
            <select
              className="webinar-select"
              value={webinarSlug ?? webinar.webinar}
              onChange={(e) => setWebinarSlug(e.target.value)}
            >
              {webinar.availableWebinars.map((w) => (
                <option key={w.slug} value={w.slug}>
                  Webinar {w.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {webinarLoading && !webinar && (
          <div className="webinar-state">Učitavam podatke iz GHL-a…</div>
        )}
        {webinarError && !webinar && (
          <div className="webinar-state error">Greška: {webinarError}</div>
        )}

        {webinar && (
          <>
            {/* Prijave — progres ka cilju od 10.000 */}
            {(() => {
              const goal = 10000;
              const pct = Math.min(100, (webinar.optin / goal) * 100);
              const remaining = Math.max(0, goal - webinar.optin);
              return (
                <div className="webinar-goal-card">
                  <div className="webinar-goal-head">
                    <div className="kpi-label">Prijave (optin)</div>
                    <div className="webinar-goal-pct">{pct.toFixed(1)}%</div>
                  </div>
                  <div className="webinar-goal-value">
                    <span className="goal-current">{fmtNum(webinar.optin)}</span>
                    <span className="goal-target"> / {fmtNum(goal)}</span>
                  </div>
                  <div className="webinar-goal-bar">
                    <div className="webinar-goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="kpi-sub">
                    {remaining > 0 ? <>jo&scaron; <strong>{fmtNum(remaining)}</strong> do cilja od {fmtNum(goal)}</> : <>cilj od {fmtNum(goal)} dostignut 🎉</>}
                  </div>
                </div>
              );
            })()}

            {/* Aplikacije */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-label">Aplikacije</div>
                <div className="kpi-value">{fmtNum(webinar.application)}</div>
                <div className="kpi-sub">
                  <strong>{webinar.optin ? ((webinar.application / webinar.optin) * 100).toFixed(1) : "0"}%</strong> od prijava
                </div>
              </div>
            </div>

            {/* Source breakdown */}
            <div className="section-card">
              <div className="section-head">
                <div>
                  <div className="section-title">Prijave po izvoru</div>
                  <div className="section-sub">{fmtNum(webinar.optin)} prijava · odakle su došli</div>
                </div>
              </div>
              <div className="pkg-list">
                {webinar.sources.length === 0 && (
                  <div className="reasons-empty">Nema taggovanih izvora za ovaj webinar.</div>
                )}
                {webinar.sources.map((s, i) => {
                  const maxVal = Math.max(1, ...webinar.sources.map((x) => x.count));
                  const colors = ["#7895ed", "#a3b8f3", "#cdd6f9", "#6b84d9", "#9aa0aa"];
                  const color = colors[i] || PACKAGE_FALLBACK_COLOR;
                  const pct = webinar.optin ? ((s.count / webinar.optin) * 100).toFixed(1) : "0";
                  return (
                    <div className="pkg-row" key={s.key}>
                      <div className="pkg-dot" style={{ background: color }} />
                      <div className="pkg-info">
                        <div className="pkg-name">{s.label}</div>
                        <div className="pkg-price-label">{pct}% od prijava</div>
                      </div>
                      <div className="pkg-bar-wrap"><div className="pkg-bar-fill" style={{ width: `${(s.count / maxVal) * 100}%`, background: color }} /></div>
                      <div className="pkg-stats">
                        <div className="pkg-count">{fmtNum(s.count)}</div>
                        <div className="pkg-revenue">prijava</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
      </>
      )}
    </div>
  );
}
