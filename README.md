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
- **Vercel** for hosting and deployment

## Getting started

```bash
npm install
cp .env.example .env.local   # add your PostHog keys (optional)
npm run dev
```

Visit http://localhost:3000.

## Deploy (Vercel)

Production is hosted on Vercel (project **`1ball1game-website`**, team **Islaintel**) and serves
[1ball1game.org](https://1ball1game.org) and [www.1ball1game.org](https://www.1ball1game.org).

- **Production:** push to `main`. Vercel builds with `npm ci` and `npm run build` and promotes the result to the production domains.
- **Previews:** every other branch gets its own preview URL on `*.vercel.app`.
- **Rollback:** in the Vercel dashboard, open **Deployments**, pick an earlier production deployment and choose **Instant Rollback**.

### Environment variables

Set these in Vercel → **Project Settings** → **Environment Variables**:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key for registration checkout |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for `/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for the payment form |
| `REGISTER_WEBHOOK_URL` | Yes | Where completed registrations are sent |
| `CONTACT_WEBHOOK_URL` | Yes | Where contact form submissions are sent |
| `RESEND_API_KEY` | No | Sends registration confirmation emails through Resend. If unset, notifications go through `REGISTER_WEBHOOK_URL` only. |
| `REGISTER_EMAIL_FROM` | No | Sender address for those emails |
| `NEXT_PUBLIC_REGISTRATION_OPEN` | No | `true` opens the live form and Register Now links. `false` shows the closed state. Defaults to open. |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Defaults to `https://us.i.posthog.com` |

`amplify.yml` is left over from the earlier AWS Amplify setup and isn't used by Vercel.

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
