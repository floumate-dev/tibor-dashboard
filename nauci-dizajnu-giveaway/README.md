# Nauči Dizajn — Giveaway Forma

Multi-step prijavna forma za giveaway 6-mesečnog web dizajn mentorstva (maj 2026). Dizajn 1:1 sa kvizom (`naucidizajn/quiz`), integrisana sa postojećim referral sistemom (`naucidizajn/nauci-dizajnu-referral`).

## URL-ovi

- **Landing (Webflow prod):** https://naucidizajn.com/giveaway-maj-2026
- **Thank-you (Webflow prod):** https://naucidizajn.com/giveaway-maj-2026-uspesna-prijava
- **GitHub Pages (test):** https://naucidizajn.github.io/giveaway/ (otvara `index.html`)
- **Make webhook:** https://hook.eu2.make.com/dlstkyxp1k8vf20lfy6xjmhjordumax3

## Repo layout

```
/
├── README.md                       ← ovaj fajl
├── master.html                     ← source-of-truth forme (CSS + JS + HTML u jednom). RADI U OVOM FAJLU.
├── naucidizajn-giveaway.css        ← ekstrakt iz master.html (deploy artifact)
├── naucidizajn-giveaway.js         ← ekstrakt iz master.html (deploy artifact)
├── embed.html                      ← Webflow embed snippet za landing (paste-uj u Embed Code element)
├── index.html                      ← GitHub Pages test wrapper za formu
└── thankyou.html                   ← Webflow embed za thank-you page (referral kartica, sve u jednom fajlu)
```

## Forma — pitanja po redu

1. Welcome screen sa "Prijavi se" CTA
2. **Q1** Da li imaš laptop / računar? (DA / NE)
3. **Q2** Da li trenutno imaš posao? (DA / NE)
4. **Q3** Šta želiš da se desi nakon 6 meseci mentorstva? (full-time posao / freelance)
5. **Q4** Da li se trenutno baviš dizajnom? (od nule / malo bez klijenata / sa klijentima)
6. **Q5** Koliko vremena dnevno možeš da posvetiš? (manje od 1h / 1-2h / 2-5h / 5h+)
7. **Q6** Ako osvojiš, kada bi krenuo? (odmah / mesec dana / kasnije)
8. **Q7** Zašto bismo baš tebe izabrali za punu stipendiju? (textarea, 2-3 rečenice)
9. **Q8** Kontakt: ime, prezime, email, telefon (svi obavezni, telefon ima per-country max-digit validaciju)
10. **Q9** Pristanak na kontakt (DA / NE) — uvek prolazi dalje, value se šalje u payload
11. Loading screen → redirect na `/giveaway-maj-2026-uspesna-prijava`

## Webhook payload

POST na Make webhook. Keys u `answers` objektu su **puna pitanja** (kako je tražio Dušan):

```json
{
  "submitted_at": "2026-05-20T19:50:06.367Z",
  "started_at": "2026-05-20T19:49:43.566Z",
  "form_id": "naucidizajn-giveaway-maj-2026",
  "session_id": "nd_gv_xxx_xxx",
  "is_partial": false,
  "completed_full": true,
  "visited_count": 9,
  "contact": {
    "first_name": "Petar",
    "last_name": "Petrovic",
    "name": "Petar Petrovic",
    "email": "petar@test.com",
    "phone": "601112233",
    "phone_country": "RS",
    "phone_dial": "+381",
    "phone_full": "+381601112233"
  },
  "opt_in": true,
  "opt_in_raw": "DA",
  "answers": {
    "Da li imaš laptop / računar": "DA",
    "Da li trenutno imaš posao": "DA",
    "Šta želiš da se desi nakon 6 meseci mentorstva?": "Nađem full-time posao web dizajnera",
    "Da li se trenutno baviš dizajnom?": "Ne, hteo bih da krenem sa mentorom od nule",
    "Koliko vremena možeš dnevno da posvetiš učenju nove veštine?": "1-2h dnevno",
    "Ako osvojiš, kada bi mogao/la da kreneš sa mentorstvom?": "Odmah",
    "Zašto bismo baš tebe izabrali za punu stipendiju?": "<2-3 rečenice>",
    "Želim da me Nauči Dizajn kontaktira ... posebnim ponudama.": "DA"
  },
  "referral": { "referred_by_code": "ABCD1234", "source_url": "..." },
  "utm": { "utm_source": "..." },
  "page_url": "...", "referrer": "...", "user_agent": "..."
}
```

## Referral integracija

Mehanika: **ako pobedi neko ko se prijavio preko tvog linka, ti takođe pobeđuješ.** Bez Kit-a (samo Supabase tracking) — Bitrix integraciju Make scenario radi paralelno preko webhook-a iznad.

- **URL capture**: `?r=CODE` se čita iz URL-a (8 char A-Z+0-9). Čuva se u `localStorage.nd_ref` — isti key kao u `nauci-dizajnu-referral/webflow/landing-head.html`, integracija je drop-in.
- **Pad-back**: ako URL nema `?r=`, čita se iz `localStorage.nd_ref`.
- **Payload**: kod ide u `referral.referred_by_code` polje glavnog webhook payload-a.
- **Thank-you stash**: finalize() upisuje `{email, name, ref, ts}` u `sessionStorage.nd_signup` koji `thankyou.html` čita posle redirect-a.
- **Thank-you fetch**: `thankyou.html` poziva `/api/signup` BEZ `tagId`. API tada radi **Supabase-only mod** — upsert u `signups` tabelu sa `referred_by` (iz ref koda), vraća novi `ref_code` + `share_url` + `dashboard_url`, NE poziva Kit. Modifikovan je u `nauci-dizajnu-referral/api/signup.js`.

### Kako izvući pobednika i njegove referral-e

U Supabase SQL editor-u:

```sql
-- 1. Lista svih signup-a za giveaway (filtriraj po datumu kampanje):
select email, first_name, last_name, ref_code, referred_by, created_at
from signups
where created_at >= '2026-05-01'
order by created_at;

-- 2. Kad izvučeš pobednika (npr. po emailu 'winner@example.com'), nađi sve koje je doveo:
select s.email, s.first_name, s.last_name, s.created_at
from signups s
where s.referred_by = (select ref_code from signups where email = 'winner@example.com');

-- 3. Ako referred_by od pobednika nije null, ta osoba TAKOĐE osvaja:
select email, first_name, last_name
from signups
where ref_code = (select referred_by from signups where email = 'winner@example.com');
```

## Kako menjati formu

Source-of-truth je **`master.html`**. CSS, JS i HTML su sve unutar njega tokom razvoja — to pojednostavljuje lokalni preview.

Posle izmena:

```bash
# Ekstrahuj CSS i JS u zasebne fajlove za deploy:
sed -n '12,620p' master.html > naucidizajn-giveaway.css
sed -n '637,1657p' master.html > naucidizajn-giveaway.js
```

**Napomena**: brojevi linija u `sed` komandama zavise od master.html — proveri lokacije `<style>` i `<script>` tag-ova ako su se pomerile:

```bash
grep -n "^  </style>\|^  <style>\|^  <script>\|^  </script>" master.html
```

Posle ekstrakcije, **povećaj `?v=N`** u `embed.html` (i u Webflow Embed elementu na stranici) da forsiraš browser cache refresh.

## Test okruženje

**TEST env detection** (u `naucidizajn-giveaway.js`):

```js
host === 'localhost' || host === '127.0.0.1' || host.includes('.github.io')
```

U TEST env-u:
- Webhook se NE šalje (samo console.log payload-a)
- Redirect je isključen (loading screen ostaje + zeleni `✓ TEST mode` indikator)
- Žuti banner na vrhu

PROD env (naucidizajn.com): sve radi normalno.

## Lokalni dev

```bash
# Iz Tracking foldera:
npx serve nauci-dizajnu-giveaway -l 4630
# Otvori http://localhost:4630/master.html  (ili /index.html za artifact verziju)
```

Ili koristi Claude Code preview (`npm run dev` u launch.json — `giveaway` config).

## Deploy

1. **Push na GitHub repo `naucidizajn/giveaway`** sa fajlovima u root-u.
2. **Settings → Pages → Source: `main` branch / `/ (root)`**.
3. **Webflow stranica `/giveaway-maj-2026`**: dodaj Embed Code element sa sadržajem iz `embed.html` (povećaj `?v=N` na svaku CSS/JS izmenu).
4. **Webflow stranica `/giveaway-maj-2026-uspesna-prijava`**: dodaj Embed Code element sa sadržajem iz `thankyou.html` — kopiraj sve između komentara `START: Webflow Embed` i `END: paste blok`. Ne treba `tagId` (giveaway je Supabase-only).
5. **Deploy izmenu `/api/signup` na Vercel-u** (`nauci-dizajnu-referral/api/signup.js` je modifikovan da Kit bude opcionalan kad `tagId` nedostaje). `cd nauci-dizajnu-referral && npx vercel deploy --prod` ili kroz git push ako je spojen sa GitHub-om.
6. **Make scenario**: spoji se na webhook `https://hook.eu2.make.com/dlstkyxp1k8vf20lfy6xjmhjordumax3`, mapuj polja u Bitrix custom list-e.

**NE TREBA**: Kit tag, Kit automation, welcome email. Sve to je samo za webinar kampanje — giveaway koristi samo Supabase za referral tracking + Make za Bitrix lead.

## Gotchas

- **Telefon — per-country validation**: `ND_PHONE_NSN_LEN` mapa pokriva ~40 zemalja (Balkan + EU + US/CA + UK/RU/TR). Default fallback za ostatak je 6–15 cifara (ITU E.164). Ako treba dodati zemlju sa specifičnim range-om, dopuni mapu u `naucidizajn-giveaway.js`.
- **Country picker je default Srbija**, IP geolocation (3 fallback providera, 3sec timeout) postavlja drugačiju zemlju ako uspe.
- **Phone payload format**: šaljemo `phone` (samo cifre, bez country code), `phone_country` (ISO), `phone_dial` (+381), `phone_full` (E.164 sa +). Make scenario bira šta mu treba.
- **Pristanak Q9**: i DA i NE prolaze dalje, value se šalje u payload kao `opt_in: bool` + `opt_in_raw: "DA"|"NE"`. Logiku ko šta dobija u Bitrix-u radi Dušan na Make strani.
- **GitHub Pages caching**: Webflow embed koristi `?v=N` da forsira refresh. Default cache je ~10 minuta inače.
