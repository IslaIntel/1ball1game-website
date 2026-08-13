# 1 Ball 1 Game Foundation — Landing Page

**Repository:** [IslaIntel/1ball1game-website](https://github.com/IslaIntel/1ball1game-website)

A production-grade marketing site for the 1 Ball 1 Game Foundation: youth soccer
that returns **75% of every registration fee** directly to participating school
PTAs. Built with an editorial-athletic design system and instrumented end-to-end
with PostHog analytics.

## Stack

- **Next.js 15** (App Router, **static export**) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for the design system
- **Framer Motion** for scroll-triggered and load animations
- **PostHog** for product analytics
- **AWS Amplify Hosting** (**static / CDN**, not SSR compute) for deployment
- **Stripe Payment Links** for registration checkout (hosted by Stripe)

## Why static (not Amplify SSR)

Stripe registration originally used Next.js API routes (`/api/stripe/*`) on Amplify
**WEB_COMPUTE** (SSR). When Amplify’s SSR environment failed — confirmed in
hosting logs — `/register` and checkout went down with it.

This site is now a **static export** (`output: "export"`). Pages are served from
the CDN and do not depend on Amplify SSR compute. Checkout uses **Stripe Payment
Links**; contact and registration data post directly to IslaIntel Waves webhooks
from the browser.

## Getting started

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_STRIPE_PAYMENT_LINK (or _1…_6) and webhook URLs as needed
npm run dev
```

Visit http://localhost:3000.

## Deploy to AWS Amplify

This repo includes an [`amplify.yml`](amplify.yml) build spec and [`.nvmrc`](.nvmrc) (Node 20).

### 1. Platform must be static (`WEB`), not SSR (`WEB_COMPUTE`)

If the Amplify app was previously **Next.js – SSR**, switch it to static hosting so
compute outages cannot take the site down:

```bash
aws amplify update-app --app-id <APP_ID> --platform WEB --region <REGION>
```

In the Amplify console, confirm the framework is treated as a static site and the
build uses this repo’s `amplify.yml` (`baseDirectory: out`).

### 2. Environment variables

In Amplify → **App settings** → **Environment variables**, add:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Defaults to `https://us.i.posthog.com` |
| `NEXT_PUBLIC_CONTACT_WEBHOOK_URL` | No | Defaults to Waves contact webhook |
| `NEXT_PUBLIC_REGISTER_WEBHOOK_URL` | No | Defaults to Waves registration webhook |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_1`…`_6` | Recommended | One Payment Link per player count ($199 × N) |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | Alternative | Single adjustable-quantity Payment Link |

### 3. Stripe Payment Link setup

1. Stripe Dashboard → **Payment Links** → create a product at **$199.00** (Fall 2026 registration).
2. Prefer **six links** with quantity locked to 1–6, map them to `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_1`…`_6`.
3. Or one link with adjustable quantity 1–6 → `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (parents must set quantity on Stripe).
4. After completion, redirect to: `https://1ball1game.org/register/?paid=1`

### 4. Deploy

Push to `main` — Amplify runs `npm ci` + `npm run build` and publishes the `out/` folder.

### Local build check

```bash
nvm use
npm ci
npm run build
npm start   # serves the static out/ folder
```

## Design system

Pulled directly from the 1B1G logo:

| Token        | Value     | Use                          |
| ------------ | --------- | ---------------------------- |
| `--ink`      | `#0a1138` | Primary text / dark sections |
| `--royal`    | `#1d2bac` | Brand blue                   |
| `--magenta`  | `#e2269d` | Accent / calls to action     |
| `--azure`    | `#3099d3` | Secondary                    |
| `--paper`    | `#f4eedf` | Warm cream background        |

- **Display:** Fraunces (expressive serif, optical sizing)
- **Body:** Archivo (athletic grotesque)
- **Meta / labels:** JetBrains Mono

## Analytics markers

Every meaningful interaction is tracked. Event names live in
[`src/lib/analytics.ts`](src/lib/analytics.ts):

| Event                       | Fired when                                        |
| --------------------------- | ------------------------------------------------- |
| `pageview` / `pageleave`    | Built-in PostHog page lifecycle                   |
| `section:view`              | A section scrolls into view (once each)           |
| `engagement:scroll_depth`   | 25 / 50 / 75 / 100% scroll milestones             |
| `nav:link_click`            | Navigation / footer link clicks                   |
| `nav:logo_click`            | Logo clicked                                       |
| `cta:click`                 | Any primary CTA (with `marker` + `location`)      |
| `sponsorship:tier_view`     | A sponsorship tier becomes visible                |
| `sponsorship:tier_select`   | A tier card is clicked                            |
| `sponsorship:tier_cta_click`| A tier "sponsor" button is clicked                |
| `impact:counter_complete`   | The 75% counter finishes animating                |
| `contact:email_click`       | An email link is clicked                          |
| `contact:form_submit`       | The sponsorship inquiry form is submitted         |

Analytics no-op gracefully when no PostHog key is configured, so local
development never breaks.

## Project structure

```
src/
  app/                  layout, global styles, pages (static)
  components/
    analytics/          PostHog provider + section view tracking
    register/           Fall 2026 registration wizard + Stripe Payment Link
    sections/           Nav, Hero, Marquee, About, Impact, WhyMatters,
                        Program, WhyPartner, Contact, Footer
    ui/                 Reveal, AnimatedNumber, CTAButton, BallGlyph
  lib/                  analytics, registration, webhooks, payment links
server/                 optional webhook worker stub (not used by Amplify static)
```
