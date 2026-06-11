# WatchTime Agency — Setup Guide

This is the Next.js project for the WatchTime Agency landing page + multi-step
qualification form. Built to continue iterating inside Claude Code.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (http://localhost:3000)
npm run dev
```

That's it. Open `http://localhost:3000` to see the landing page and
`http://localhost:3000/form` for the qualification form.

## Project structure

```
watchtime-agency/
├── src/
│   ├── app/
│   │   ├── page.tsx             ← Landing page (Hero → FAQ → FinalCTA)
│   │   ├── form/page.tsx        ← Multi-step qualification form (14 steps)
│   │   ├── layout.tsx
│   │   ├── services/            ← /services page
│   │   └── globals.css          ← Theme variables (colors, fonts)
│   ├── components/
│   │   ├── sections/            ← Landing page sections (Hero, OurWork, ...)
│   │   ├── layout/              ← Nav, Footer
│   │   ├── form/PhoneInput.tsx  ← Phone input with dial-code + auto-detect
│   │   ├── ui/                  ← Button, AnimatedCounter
│   │   └── AttributionTracker.tsx ← Captures URL params on every page load
│   └── lib/
│       ├── constants.ts         ← SITE_NAME, URLs, webhook, nav links, ...
│       ├── form-questions.ts    ← The 14 form questions (edit here to change)
│       ├── countries.ts         ← Country list for phone picker
│       └── tracking.ts          ← Attribution capture + read helpers
├── public/                      ← Images, thumbnails, step icons
└── package.json
```

## Key things to know

### Form webhook

Form submissions POST to a Make.com webhook defined in
`src/lib/constants.ts`:

```ts
export const FORM_WEBHOOK_URL = 'https://hook.eu1.make.com/...';
```

Payload keys are the full question titles (e.g. `"What's your full name?"`)
so they appear 1:1 in Make. Attribution fields (`src`, `sub_src`,
`utm_*`, `referrer`, `landingPage`) ride along automatically.

### Attribution tracking (URL params)

Primary params — what you share in marketing:
- `src` — channel: `instagram`, `youtube`, `linkedin`, `email`, `dm`, `newsletter`
- `sub_src` — specific identifier: `bio`, `story-april`, `video-42`,
  `aleksa-outreach`, `ad-q2-carousel-b`

Example tracked link:
```
https://watchtimeagency.com/?src=instagram&sub_src=story-april
```

Values are captured on the first page load, stored in `localStorage` with a
first-touch rule (first marketing click wins), and attached to every form
submission.

Standard `utm_source`/`utm_medium`/`utm_campaign`/`utm_content`/`utm_term`
are also captured automatically for future paid-ad / GA / Meta Pixel
integration.

### Editing the form

Add / reorder / rename questions in
`src/lib/form-questions.ts`. Each question has:

```ts
{
  id: 'fullName',                 // internal key, don't change once live
  type: 'text',                   // text | email | phone | url | radio
  title: "What's your full name?", // shown to user + used as webhook key
  subtitle: '...',                 // small label above the question
  placeholder: '...',              // for text-type inputs
  options: ['...', '...'],         // for radio-type
}
```

### Design tokens

All colors, fonts, backgrounds defined in CSS variables in
`src/app/globals.css`:

```css
--bg-primary: #080808;
--accent-primary: #703bff;
--text-primary: #ffffff;
/* ... */
```

Headings use **Space Grotesk**, body uses **Inter** (loaded via
`next/font/google` in `src/app/layout.tsx`).

## Commands

```bash
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
```

## Deploy

The project is already configured for Vercel. Easiest deploy:

```bash
npx vercel
```

Follow the prompts. Subsequent deploys with `npx vercel --prod`.

Or connect the GitHub repo to Vercel for auto-deploy on push.

## Using with Claude Code

Open this folder in Claude Code (`claude` in terminal at project root).
Claude has full context via:

- `SETUP.md` — this file
- `AGENTS.md` — Next.js version warning
- Code itself — cleanly organized by feature

Good first things to ask Claude:
- "Add a new step to the form asking X"
- "Change the hero headline to Y"
- "Swap the accent color to green"
- "Add a pricing section below ClientResults"
