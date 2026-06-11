# Nauči Dizajn — Referral System

Referral sistem za webinar prijave. Jedan signup = personal referral link. Dovedeš 5 ljudi = osvajaš nagradu (manualna isporuka).

## Arhitektura

```
Landing page (Webflow)
  ├─ hidden field "ref" + landing-head.html snippet (čita ?r= iz URL-a)
  └─ native Webflow forma — submit ide na Kit kao do sad (tag trigger + welcome automation)
        │
        └─ redirect → Thank-you page
              ├─ thankyou-embed.html widget (iz Webflow Embed elementa)
              ├─ POST → /api/signup (na Vercelu)
              │    ├─ upsert u Supabase
              │    └─ Kit: set custom_fields (referral_code, dashboard_url, share_url)
              │        [Kit automation ima Wait 1min pre welcome mail-a — Kit onda čita popunjena polja]
              └─ widget se renderuje: "Hvala, [Ime]! Evo tvog linka… [Kopiraj]"

Email dashboard link (iz Kita) → standalone dashboard (index.html na Vercelu)
  └─ GET /rest/v1/rpc/get_dashboard?p_token=... → Supabase
  └─ pokazuje progress bar, listu dovedenih, copy button
```

## Repo layout

```
supabase/
  schema.sql                   ← pokreni u Supabase SQL editor-u jednom
api/
  signup.js                    ← Vercel serverless function (POST /api/signup)
dashboard/
  index.html                   ← standalone dashboard (deploy na subdomain)
  thankyou-preview.html        ← lokalni preview embed-a (NE deploy-uj; samo za dev)
webflow/
  landing-head.html            ← paste u landing page <head>
  thankyou-embed.html          ← paste u Embed element na thank-you page
```

---

## Korak-po-korak deploy

### 1. Supabase

1. Idi na supabase.com → New project (region: **eu-west-1**, ime: `nauci-dizajn`).
2. SQL Editor → New query → pejstuj sadržaj `supabase/schema.sql` → Run.
3. Project Settings → API → kopiraj ova dva ključa u sigurnu notu:
   - `Project URL` → ide u `SUPABASE_URL`
   - `service_role` key → ide u `SUPABASE_SERVICE_ROLE_KEY` (server-only, **nikad** u frontend)
   - `anon` key → ide u frontend dashboard HTML

### 2. ConvertKit

1. **Custom fields** — Subscribers → Custom Fields → Add:
   - `referral_code` (Text)
   - `dashboard_url` (Text)
   - `share_url` (Text)
   - `last_name` (Text) — opcionalno, ako već nema
2. **Novi tag za April webinar** — Subscribers → Tags → Create: npr. `uiux-webinar-april-2026`.
   Klikni ga → u URL-u dobiješ `/subscribers?tag_id=XXXXXX`. Zabeleži taj broj.
3. **Automation** — Automations → postojeći "Webinar Welcome" ili napravi novi:
   - Trigger: tag `uiux-webinar-april-2026` added
   - **Wait 1 minute** (kritično — daje API-ju vremena da upiše referral kodove)
   - Send welcome email sa merge tagovima:
     ```
     Hej {{ subscriber.first_name }},
     prijava potvrđena 🎯

     Dovedi 5 prijatelja i osvoji [nagradu].

     Tvoj link:
     {{ subscriber.custom_fields.share_url }}

     Prati napredak:
     {{ subscriber.custom_fields.dashboard_url }}
     ```
4. **API secret** — Settings → Advanced → API Secret. Kopiraj u notu (ide u Vercel env).

### 3. Vercel

1. Napravi nov Vercel projekat: `nauci-dizajn-referral`.
2. Deploy kroz git ili CLI:
   - Preporuka: napravi GitHub repo iz ovog foldera i spoji sa Vercelom, ili
   - `npx vercel deploy --prod` iz foldera `nauci-dizajnu-referral/`.
3. Settings → Environment Variables → dodaj:
   | Variable | Vrednost |
   |---|---|
   | `SUPABASE_URL` | iz Supabase Settings |
   | `SUPABASE_SERVICE_ROLE_KEY` | iz Supabase Settings |
   | `CONVERTKIT_API_SECRET` | iz Kit Settings |
   | `DASHBOARD_BASE_URL` | `https://app.naucidizajn.com` (ili privremeno `https://nauci-dizajn-referral.vercel.app`) |
4. Zabeleži deploy URL (npr. `https://nauci-dizajn-referral.vercel.app`) — treba za Webflow embed config.

### 4. Dashboard hosting (app.naucidizajn.com)

Najlakše: hostuj `dashboard/index.html` na **istom** Vercel projektu, ili napravi poseban:

**Varijanta A — isti Vercel projekat:**
- Vercel servira `dashboard/index.html` pod `/`.
- Postavi custom domain `app.naucidizajn.com` na taj projekat (Vercel → Settings → Domains).

**Varijanta B — zaseban static Vercel projekat:**
- Napravi novi projekat "nauci-dizajn-dashboard" samo sa `dashboard/` folderom.
- Dodaj custom domain `app.naucidizajn.com`.

**Bilo koja varijanta — popuni placeholdere u `dashboard/index.html`:**

```js
const SUPABASE_URL = 'https://usofc....supabase.co';
const SUPABASE_ANON_KEY = 'ey...';   // anon key, NE service_role
```

(Webinar URL je već zaključan na `https://naucidizajn.com/uiux-webinar-april-2026`.)

### 5. Webflow — landing page

1. Duplicate postojeću landing (`/webinar-webflow-novembar-2025`) u `/uiux-webinar-april-2026`.
2. Otvori formu u modalu → dodaj novi Text Input:
   - Name: `ref`
   - Required: off
   - Hide it (combo class `display: none` ili Webflow hidden setting)
3. Page Settings → Custom Code → Head → pejstuj ceo `webflow/landing-head.html`.
4. Publish.

### 6. Webflow — thank-you page

1. Duplicate postojeću thank-you (`/webflow-webinar-novembar-2025-thank-you`) u `/uiux-webinar-april-2026-thank-you`.
2. Ubaci **Embed** element gde hoćeš da se widget pojavi (ispod default "Hvala!" poruke ili umesto nje).
3. Otvori `webflow/thankyou-embed.html` i **pre nego što kopiraš**, popuni CONFIG na vrhu `<script>`:
   ```js
   var CONFIG = {
     apiUrl: 'https://nauci-dizajn-referral.vercel.app/api/signup',
     tagId: '1234567',  // tvoj Kit tag ID za April webinar
     webinarUrl: 'https://naucidizajn.com/uiux-webinar-april-2026',
     dashboardBaseUrl: 'https://app.naucidizajn.com',
     rewardThreshold: 5,
   };
   ```
4. Kopiraj ceo fajl (sa `<style>` i `<script>`) u Webflow Embed element.
5. Webflow formu na landing-u povećaj na `redirect="/uiux-webinar-april-2026-thank-you"` (već je postavljeno kad dupliciraš).
6. Publish.

---

## Testing pre go-live

Test redosled:

1. **Supabase** — u SQL editor-u pokreni:
   ```sql
   select * from create_signup('test@test.com', 'Test User', null);
   ```
   Dobijaš ref_code + dashboard_token. Proveri da je red upisan:
   ```sql
   select * from signups;
   ```

2. **Dashboard** — otvori `https://app.naucidizajn.com/?t=[dashboard_token iz koraka 1]`.
   Vidiš "Pozdrav, Test! …" + prazan spisak dovedenih.

3. **End-to-end forma** — pejstuj referral link u privatan browser:
   ```
   https://naucidizajn.com/uiux-webinar-april-2026?r=[ref_code iz koraka 1]
   ```
   Popuni formu sa drugim email-om. Posle redirect-a na thank-you, očekuj:
   - Widget se renderuje, pokazuje njegov (drugačiji) ref_code
   - Supabase: nov red u `signups` sa `referred_by = [tvoj test ref_code]`
   - Kit: nov subscriber sa popunjenim custom poljima (`referral_code`, `dashboard_url`, `share_url`)
   - Welcome email stiže posle 1 minut sa ispravnim linkovima

4. **Provera dashboard-a** — otvori `https://app.naucidizajn.com/?t=[tvoj test dashboard_token]`.
   Sada vidiš "1 / 5" i ime drugog test korisnika na listi.

5. **Edge cases:**
   - Prijava istog email-a 2x → jedan red u bazi, ref_code se ne menja
   - `?r=GLUPOST` (neispravan kod) → prijava prolazi, `referred_by = null`

---

## Posle webinara — ručni workflow

1. U Supabase SQL editor-u pronađi sve koji su dostigli 5:
   ```sql
   select s.email, s.first_name, s.ref_code,
          (select count(*) from signups x where x.referred_by = s.ref_code) as count
   from signups s
   where (select count(*) from signups x where x.referred_by = s.ref_code) >= 5
     and s.reward_sent = false;
   ```
2. Ručno proveri da li su došli na webinar (po tvom internom procesu).
3. Pošalji nagradu van sistema.
4. Označi kao isporučeno:
   ```sql
   update signups set attended = true, reward_sent = true
   where email in ('...', '...');
   ```

---

## Troubleshooting

- **Widget na thank-you pokazuje "Nismo pročitali tvoju prijavu"** — Webflow forma se ne šalje sa GET metodom, ili polja nisu imenovana tačno `Name` i `Email`. Proveri formu u Designer-u.

- **Custom fields u Kit welcome mail-u su prazni** — dodaj **Wait 1 minute** korak u automation-u pre Send email koraka. Naš API update-uje Kit nekoliko sekundi posle prijave; bez delay-a email ode prazan.

- **"cors" errors u browser console-u na /api/signup** — proveri da li je origin tvog Webflow sajta u `ALLOWED_ORIGINS` u `api/signup.js`. Default-ovano: `naucidizajn.com` i `www.naucidizajn.com`.

- **Supabase 401 iz API-ja** — `SUPABASE_SERVICE_ROLE_KEY` u Vercel env var-ima je pogrešan. **Nije** anon key — service_role key.

- **Referral kod se ne prenosi na prijavu** — proveri da li je `ref` hidden field dodat u formu na landing-u. Custom code u <head> neće raditi ako polja nema.
