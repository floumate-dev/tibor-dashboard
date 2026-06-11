# Brief za multi-step formu (Nutribox stil)

> Paste ovaj brief na početku novog chata, dodaj šta tačno hoćeš da forma radi, i dobijaš identičan stil.

---

## Kontekst
Pravim multi-step web formu za Vuksana (Nutribox). Treba mi forma u **istom vizuelnom i kodno-arhitekturnom stilu** kao postojeća `nutripilot` forma. Referentni repo:

**https://github.com/vuksanvasic/nutripilot**

Konkretno, pogledaj `forma.html` u root-u — to je referentna implementacija. Tvoj zadatak je da napraviš novu formu sa istom strukturom, samo drugim sadržajem.

---

## Tehnička arhitektura (obavezno ispoštovati)

- **Jedan HTML fajl**, vanilla JS, bez frameworka, bez build koraka
- **Multi-step kroz `data-screen` sekcije** — sve sekcije u istom DOM-u, JS preklapa vidljivost
- **Auto-advance** na radio izborima (`data-auto-next` atribut na sekciji)
- **Manual "Dalje →"** dugmad za screens sa text input-ima
- **Globalni `state` objekat** drži sve inpute
- **Progress bar gore** sa "Korak X / N · opis"
- **Google Fonts: Instrument Sans** (težine 400–700)
- **CSS variables** u `:root` za boje, sve scope-ovano (bez Tailwind/external CSS)

---

## Vizuelni stil

```css
:root {
  --primary: #317039;       /* zelena */
  --primary-hover: #388041;
  --primary-soft: #e8f1e9;
  --accent: #e89a3c;        /* narandžasta */
  --accent-deep: #d23b3b;   /* crvena */
  --dark: #101a24;
  --text: #2a3540;
  --text-soft: #5f6b75;
  --line: #e6e8ec;
  --bg: #fafaf7;            /* off-white kremasta */
}
```

- **Border radius:** asimetrični `10px 3px` (karakter brenda)
- **Karte sa belom pozadinom** + tanka siva linija
- **Buttons:** zeleni primarni sa hover lift efektom, ghost varijanta za "Nazad"
- **Step-head:** mali uppercase "Korak X · Naziv" label, h1 naslov, sivi lead paragraph

---

## Forma za pisanje na srpskom

- **"Ti" address forma** (informal, ne "Vi")
- **Vokativ za ime** u rezultatima ("Marko, ovo su tvoji brojevi") — koristi helper funkciju `toVocative(ime, pol)` iz reference repo-a
- **Brojevi sa srpskom lokalizacijom** kad treba (`toLocaleString('sr-RS')`)
- **Latinica**, ne ćirilica

---

## Patterns za result stranicu

Ako forma vodi do nekog izračunatog rezultata (npr. score, kategorija, preporuka):

1. **Hero broj** — veliki broj sa labelom ispod
2. **Result cards grid** (3–6 kolona) sa pojedinačnim metrikama
3. **Commentary blok** ispod sa boldovanim ključnim rečima
4. **Zone vizualizacija** sa bojama (zelena → žuta → narandžasta → crvena) — pattern već implementiran u `forma.html` (`.fat-zones` sekcija)
5. **Radar chart u SVG-u** ako je više osa (5 osa primer u repo-u) — sa "Zdrav ideal" referencom i "Razmak do ideala" crveno bojenim gap-om

---

## Scoring patterns (ako treba)

Za samouverenost izbegavaj:
- "Daj svemu 100/100" → koristi nelinearne krive (npr. `Math.pow(raw/100, 1.4) * 75`) da self-report ne ide do 100
- Reference za poređenje treba da budu 100 (idealno), ne "prosečno dobro"

---

## Webflow paste-ready output

Pored `forma.html`, treba i **3 split fajla** za Webflow paste:
- `webflow/forma-head.html` — CSS + font links (paste u Page Settings → Inside `<head>`)
- `webflow/forma-body.html` — HTML markup (paste u Embed komponentu)
- `webflow/forma-footer.html` — JS (paste u Page Settings → Before `</body>`)

Svaki fajl mora da bude **ispod 50KB** (Webflow limit).

---

## Checkout integracija (ako treba plaćanje)

Pattern iz referentne forme:
```js
const res = await fetch('https://raifpay-prod.nutribox.dev/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
const data = await res.json();
window.location.href = data.redirectUrl;
```

Endpoint vraća `{ redirectUrl: '...' }` koji vodi na Raiffeisen kartično plaćanje.

---

## Šta mi treba od tebe (novi chat)

1. **Pre nego što počneš**, otvori `https://github.com/vuksanvasic/nutripilot/blob/main/forma.html` da vidiš tačan stil koji repliciramo
2. Pitaj me za **konkretne korake forme** (koja pitanja, koji inputi, šta računamo, šta je krajnji deliverable)
3. Ne predlaži framework, ne predlaži React/Vue/Astro — vanilla HTML+CSS+JS samo
4. Sav tekst piši na srpskom latinicom, "ti" address forma
5. Na kraju, izgeneriši i 3 Webflow split fajla pored finalnog `forma.html`

---

## Brza checklista nakon završetka

- [ ] Vanilla HTML+CSS+JS, jedan fajl
- [ ] Instrument Sans font
- [ ] CSS variables u `:root`
- [ ] `data-screen` arhitektura sa progress bar-om
- [ ] "Ti" adresa, latinica, srpski tekst
- [ ] Result stranica sa cards + commentary
- [ ] 3 Webflow split fajla, svaki < 50KB
- [ ] CTA dugmad sa zelenim primarom + hover efektom
