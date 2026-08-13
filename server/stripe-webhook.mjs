/**
 * Optional Stripe webhook worker (Node 20+).
 *
 * The static Amplify site no longer hosts /api routes. Deploy this file to any
 * always-on HTTPS endpoint (Lambda Function URL, Fly.io, Railway, etc.) and
 * point Stripe → Developers → Webhooks at that URL for checkout.session.completed
 * (Payment Links) or payment_intent.succeeded.
 *
 * Env:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   REGISTER_WEBHOOK_URL (optional override)
 *   RESEND_API_KEY (optional)
 *
 * Run locally: node --experimental-strip-types server/stripe-webhook.mjs
 * (Or compile/bundle as needed for your host.)
 *
 * This file is intentionally standalone documentation + stub entry; wire it to
 * the shared submit helpers in src/lib when you deploy a Node host.
 */

import http from "node:http";

const port = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "1b1g-stripe-webhook" }));
    return;
  }

  res.writeHead(501, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error:
        "Deploy a full webhook handler using src/lib/submit-registration.ts before enabling Stripe webhooks. Client-side Waves submit is the primary path for the static site.",
    }),
  );
});

server.listen(port, () => {
  console.log(`Optional webhook stub listening on :${port}`);
});
