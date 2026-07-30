export interface ParsedCall {
  external_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  package: string | null;
  amount: number;
  currency: string;
  stage: "lead" | "scheduled" | "showed_up" | "won" | "lost" | "no_show";
  lost_reason: string | null;
  setter: string | null;
  closer: string | null;
  source: string;
  scheduled_at: string | null;
  closed_at: string | null;
  raw_data: Record<string, unknown>;
}

// GHL pipeline stage names → our canonical stages.
// GHL stage labels are configurable per pipeline; map the ones we use and
// fall back to a normalized guess so unknown labels don't get dropped.
const STAGE_MAP: Record<string, ParsedCall["stage"]> = {
  // "Lead" = ušao u pipeline ali poziv NIJE zakazan → zaseban "lead" (NE poziv).
  lead: "lead",
  "new lead": "lead",
  // ZAKAZAN POZIV = SAMO "Call Booked" (Dusan, jun 2026). Ništa drugo nije scheduled.
  scheduled: "scheduled",
  booked: "scheduled",
  "call booked": "scheduled",
  // "Follow Up" je posle poziva (deal u toku), NE zakazan poziv → showed_up.
  "follow up": "showed_up",
  "follow-up": "showed_up",
  "showed up": "showed_up",
  showed: "showed_up",
  show: "showed_up",
  won: "won",
  "closed won": "won",
  // Deposit collected: Dusan (jun 2026) → ZA SAD IGNORISATI kao prodaju.
  // Mapira se na showed_up (deal pokazao interes / kapara, ali NIJE Won → ne ulazi
  // u prihod ni u conversion kao zatvoren). Kad deal pređe na Won broji se kao prodaja.
  "deposit collected": "showed_up",
  lost: "lost",
  "closed lost": "lost",
  "no show": "no_show",
  "no-show": "no_show",
  noshow: "no_show",
  // Tiborov Sales Pipeline stage je doslovno "Didn't Show".
  "didn't show": "no_show",
  "didnt show": "no_show",
  "did not show": "no_show",
};

function mapStage(raw: unknown): ParsedCall["stage"] {
  const key = String(raw ?? "").trim().toLowerCase();
  if (STAGE_MAP[key]) return STAGE_MAP[key];
  if (key.includes("won")) return "won";
  if (key.includes("lost")) return "lost";
  // No-show varijante: "no show", "didn't show", "did not show", "missed".
  if (
    key.includes("show") &&
    (key.includes("no") ||
      key.includes("didn") ||
      key.includes("not") ||
      key.includes("miss"))
  ) {
    return "no_show";
  }
  if (key.includes("show")) return "showed_up";
  if (key.includes("follow")) return "showed_up";
  if (key.includes("book")) return "scheduled";
  // Nepoznata faza → konzervativno "lead" (NE scheduled; scheduled je samo Call Booked).
  return "lead";
}

// Tiborova logika cena. GHL šalje dva polja:
//   produkt = program: "Korak Ispred" | "Edit u Novac"
//   paket   = tier:    "1 mesec" | "3 meseca" | "Webinar ponuda" | "custom"
// Dashboard grupiše "Prodaje po paketima" po kombinovanoj labeli (Edit u Novac
// razbijen po tier-u). Iznos se IZVODI iz produkt+paket; "custom" → ručno unet
// monetary value. Labele MORAJU da se poklapaju sa PACKAGES u data.ts.
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

// IZNOS: Dusan (jun 2026) → `amount` UVEK dolazi iz GHL `amount` polja (novo
// dedikovano polje koje šalje stvarno naplaćen iznos), za SVE dealove. Fiksne
// cene (47/141/98/2500) se VIŠE NE koriste za iznos — tako da popusti/varijacije
// budu tačno prikazani. Ova funkcija i dalje izvodi LABELU paketa iz
// produkt+paket (da "Prodaje po paketima" grupiše po tier-u), ali iznos = monetary.
function derivePackage(
  produktRaw: unknown,
  paketRaw: unknown,
  monetary: number
): { pkg: string | null; amount: number } {
  const produkt = norm(produktRaw);
  const paket = norm(paketRaw);

  let pkg: string | null;

  if (produkt === "korak ispred") {
    pkg = paket === "custom" ? "Custom" : "Korak Ispred";
  } else if (produkt === "edit u novac") {
    if (paket === "1 mesec") pkg = "Edit u Novac · 1 mesec";
    else if (paket === "3 meseca" || paket === "3 mesea")
      pkg = "Edit u Novac · 3 meseca";
    else if (paket === "webinar ponuda" || paket.includes("webinar"))
      pkg = "Edit u Novac · Webinar ponuda";
    else pkg = "Custom"; // nepoznat tier
  } else if (paket === "custom" || produkt) {
    // Nema poznatog produkta ali postoji custom/nepoznat produkt → Custom.
    pkg = "Custom";
  } else {
    // Nema produkta ni paketa (npr. lost/no-show deal bez prodaje).
    pkg = null;
  }

  return { pkg, amount: monetary };
}

function pick(body: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== "") {
      return body[k];
    }
  }
  return undefined;
}

const TERMINAL: ParsedCall["stage"][] = ["won", "lost", "no_show"];

export function parseGhlCall(body: Record<string, unknown>): ParsedCall {
  // GHL Workflow "Webhook" action wraps the mapped Custom Data fields under a
  // `customData` object, while ALSO sending the full contact/opportunity object
  // at the top level. The intentional mapping (stage/produkt/paket/amount/…)
  // lives in customData, so flatten it over the top-level body for lookups —
  // customData wins, top-level keys remain as fallback. raw_data keeps the full
  // original payload untouched.
  const cd =
    body.customData && typeof body.customData === "object"
      ? (body.customData as Record<string, unknown>)
      : {};
  const data: Record<string, unknown> = { ...body, ...cd };

  const first = pick(data, "first_name", "firstName", "contact_first_name");
  const last = pick(data, "last_name", "lastName", "contact_last_name");
  const fullName =
    (pick(data, "full_name", "fullName", "name", "contact_name") as
      | string
      | undefined) ||
    [first, last].filter(Boolean).join(" ") ||
    null;

  // Note GHL's top-level key is misspelled "pipleline_stage" — include it.
  const stage = mapStage(
    pick(data, "stage", "pipeline_stage", "pipleline_stage", "pipelineStage")
  );

  const lostReason =
    stage === "lost"
      ? ((pick(data, "lost_reason", "lostReason", "razlog") as string) || null)
      : null;

  // Paket + iznos: GHL šalje `produkt` (program) i `paket` (tier).
  const monetary =
    Number(
      pick(data, "amount", "value", "monetaryValue", "monetary_value")
    ) || 0;
  const { pkg, amount } = derivePackage(
    pick(data, "produkt", "product", "package"),
    pick(data, "paket", "tier", "package_tier"),
    monetary
  );

  return {
    external_id:
      (pick(data, "opportunity_id", "opportunityId", "id", "external_id") as
        | string
        | undefined) ?? null,
    contact_name: (fullName as string) || null,
    contact_email: (pick(data, "email", "contact_email") as string) || null,
    contact_phone: (pick(data, "phone", "contact_phone") as string) || null,
    package: pkg,
    amount,
    currency: (pick(data, "currency") as string) || "EUR",
    stage,
    lost_reason: lostReason,
    setter: (pick(data, "setter", "appointment_setter") as string) || null,
    closer: (pick(data, "closer", "assigned_to", "assignedTo", "user") as string) || null,
    source: (pick(data, "source", "utm_source") as string) || "direct",
    scheduled_at:
      (pick(data, "scheduled_at", "appointment_time", "appointmentTime") as
        | string
        | undefined) ?? null,
    closed_at: TERMINAL.includes(stage)
      ? ((pick(data, "closed_at", "date_closed", "updated_at") as string) ||
        new Date().toISOString())
      : null,
    raw_data: body,
  };
}
