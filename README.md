# 1 Ball 1 Game Foundation — Landing Page

**Repository:** [IslaIntel/1ball1game-website](https://github.com/IslaIntel/1ball1game-website)

A production-grade marketing site for the 1 Ball 1 Game Foundation: youth soccer
that returns **75% of every registration fee** directly to participating school
PTAs. Built with an editorial-athletic design system and instrumented end-to-end
with PostHog analytics.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** for the design system
- **Framer Motion** for scroll-triggered and load animations
- **PostHog** for product analytics
- **AWS Amplify Hosting** (SSR / WEB_COMPUTE) for deployment

## Getting started

```bash
npm install
cp .env.example .env.local   # add your PostHog keys (optional)
npm run dev
```

Visit http://localhost:3000.

## Deploy to AWS Amplify

This repo includes an [`amplify.yml`](amplify.yml) build spec and [`.nvmrc`](.nvmrc) (Node 20) for Amplify Hosting compute (Next.js SSR).

### 1. Connect the repository

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/) → **Create new app** → **Host web app**.
2. Connect your Git provider and select **`IslaIntel/1ball1game-website`**.
3. Amplify should auto-detect **Next.js - SSR**. Confirm the build spec uses `amplify.yml`.

### 2. Environment variables

In Amplify → **App settings** → **Environment variables**, add:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Defaults to `https://us.i.posthog.com` |

These are written to `.env.production` during the build via `amplify.yml`.

### 3. Deploy

Push to `main` — Amplify builds with `npm ci` and `npm run build`, then deploys the `.next` output.

### Local build check

```bash
nvm use
npm ci
npm run build
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
  app/                  layout, global styles, page composition
  components/
    analytics/          PostHog provider + section view tracking
    sections/           Nav, Hero, Marquee, About, Impact, WhyMatters,
                        Program, WhyPartner, Sponsorship, Contact, Footer
    ui/                 Reveal, AnimatedNumber, CTAButton, BallGlyph
  lib/analytics.ts      event registry + safe track() helper
```
