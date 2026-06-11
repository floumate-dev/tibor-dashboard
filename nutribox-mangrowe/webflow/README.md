# Webflow paste guide

6 fajlova spremnih za paste u Webflow, podeljenih po stranicama (landing × 2 verzije, forma) i tri Webflow zone (Head / Body / Footer).

## Veličine (sve unutar Webflow limita)

| Fajl | KB | Webflow limit |
|---|---|---|
| `forma-head.html` | 17 | 50KB |
| `forma-body.html` | 19 | 50KB |
| `forma-footer.html` | 31 | 50KB |
| `index-head.html` | 21 | 50KB |
| `index-body.html` | 17 | 50KB |
| `index-footer.html` | 1 | 50KB |
| `index-v2-head.html` | 27 | 50KB |
| `index-v2-body.html` | 26 | 50KB |
| `index-v2-footer.html` | 1 | 50KB |

## Postupak za jednu stranicu (npr. landing)

**Korak 1 — Napravi praznu stranicu u Webflow**
Pages panel → New Page → daj joj slug (npr. `/` za root, ili `/prijava` za formu).

**Korak 2 — Otvori Page Settings (zupčanik pored imena stranice) → Custom Code sekcija**

**Korak 3 — Paste u "Inside <head> tag"**
Otvori `index-head.html` u editoru, kopiraj **sav sadržaj** i paste-uj u to polje.

**Korak 4 — Paste u "Before </body> tag"**
Otvori `index-footer.html`, kopiraj sadržaj, paste.

**Korak 5 — Sačuvaj Page Settings**

**Korak 6 — Vrati se na canvas → dodaj Embed komponentu**
Drag & drop "Embed" element gde želiš sadržaj stranice. Otvori `index-body.html`, kopiraj **sav sadržaj**, paste u Embed code editor.

**Korak 7 — Publish**

## Šta se gde pastuje (tablica)

| Webflow zona | index.html | index-v2.html | forma.html |
|---|---|---|---|
| Page Settings → Inside `<head>` | `index-head.html` | `index-v2-head.html` | `forma-head.html` |
| Page → Embed komponenta | `index-body.html` | `index-v2-body.html` | `forma-body.html` |
| Page Settings → Before `</body>` | `index-footer.html` | `index-v2-footer.html` | `forma-footer.html` |

## Bitne stavke pre publish-a

### 1) CTA linkovi u landing-u
U `index-body.html` i `index-v2-body.html` postoji ~4-5 CTA-a sa `href="forma.html"`. Webflow stranice nemaju `.html` ekstenziju — kad napraviš formu na Webflow page-u sa slug-om npr. `/prijava`, **search & replace** u body fajlu pre paste-a:

```
href="forma.html"   →   href="/prijava"
```

### 2) Checkout endpoint
`forma-footer.html` POST-uje na `https://raifpay-prod.nutribox.dev/checkout` (Raiffeisen produkcija). To je već **produkcioni** endpoint — radi odmah, ali svaka prijava do kraja inicira pravi payment flow. Za testiranje, ako Marko ima staging URL, zameni ovaj string u `forma-footer.html` pre paste-a.

### 3) Webflow CSS kolizije
Webflow ubacuje svoj reset CSS koji može da utiče na padding/margin tela. Ako po paste-u izgleda razmaknuto, otvori Webflow Designer → daj body-ju klasu "no-default" ili u page custom code dodaj:
```css
body { padding: 0; margin: 0; }
```
(Već je u head fajlu, ali Webflow ponekad override-uje.)

### 4) Fonts
Head fajlovi već uključuju preconnect i `<link>` za Instrument Sans sa Google Fonts. Ne treba dodatno podešavanje.

## Alternativa — iframe (ako paste pravi probleme)

Ako bilo koji od ovih fajlova pravi konflikt u Webflow-u (najčešće CSS reset ili JS conflict), umesto paste-a možeš da:
1. Hostuješ originalni `forma.html` na zasebnom URL-u (Vercel project `nutribox-mangrowe` je već konfigurisan)
2. U Webflow stranici dodaš Embed sa:
   ```html
   <iframe src="https://your-vercel-url.vercel.app/forma.html" 
           width="100%" height="900" frameborder="0"
           style="border:none;"></iframe>
   ```

To je sigurnije rešenje za formu jer Webflow ne dira interno ponašanje iframe sadržaja.

## Brza komanda za deploy na Vercel (ako odeš na iframe rutu)

```bash
cd /Users/dusan/Tracking/nutribox-mangrowe
npx vercel --prod
```

Vercel projekat `nutribox-mangrowe` već postoji (`.vercel/project.json`), pa deploy ide direktno.
