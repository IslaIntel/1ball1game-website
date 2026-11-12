import assert from "node:assert/strict";
import { test } from "node:test";
import type Stripe from "stripe";
import {
  PAYMENT_INTENT_KEY_PREFIX,
  createOrReusePaymentIntent,
} from "./stripe-payment-intent";
import type { WinterStreetballPrice } from "./stripe-winter-product";

const price: WinterStreetballPrice = {
  productId: "prod_test",
  priceId: "price_test",
  unitAmount: 17500,
  productName: "Winter Indoor Streetball 2026",
};

const options = {
  amount: 17500,
  email: "parent@example.com",
  playerCount: 1,
  fingerprint: "97b746edf9d7fef05976e01276426bc",
  season: "Winter 2026",
  price,
  idempotencySuffix: "_cap_1",
};

const baseKey = `${PAYMENT_INTENT_KEY_PREFIX}${options.fingerprint}${options.idempotencySuffix}`;

type Stored = {
  cachedCreate: Stripe.PaymentIntent;
  live: Stripe.PaymentIntent;
};

function fakeStripe() {
  const byKey = new Map<string, Stored>();
  const byId = new Map<string, Stored>();
  const creates: string[] = [];
  let seq = 0;

  function remember(key: string, status: Stripe.PaymentIntent.Status) {
    seq += 1;
    const id = `pi_${seq}`;
    const intent = {
      id,
      amount: options.amount,
      status,
      client_secret: `secret_${id}`,
      metadata: { registration_fingerprint: options.fingerprint },
    } as unknown as Stripe.PaymentIntent;
    const stored = { cachedCreate: { ...intent }, live: intent };
    byKey.set(key, stored);
    byId.set(id, stored);
    return stored.cachedCreate;
  }

  const stripe = {
    creates,
    paymentIntents: {
      async create(
        _params: Stripe.PaymentIntentCreateParams,
        request: { idempotencyKey: string },
      ) {
        creates.push(request.idempotencyKey);
        const existing = byKey.get(request.idempotencyKey);
        if (existing) return { ...existing.cachedCreate };
        return { ...remember(request.idempotencyKey, "requires_payment_method") };
      },
      async retrieve(id: string) {
        const stored = byId.get(id);
        if (!stored) throw new Error(`missing ${id}`);
        return { ...stored.live };
      },
      async list() {
        return { data: [...byId.values()].map((stored) => ({ ...stored.live })).reverse() };
      },
    },
    cancel(id: string) {
      const stored = byId.get(id);
      if (!stored) throw new Error(`missing ${id}`);
      stored.live.status = "canceled";
    },
    mark(id: string, status: Stripe.PaymentIntent.Status) {
      const stored = byId.get(id);
      if (!stored) throw new Error(`missing ${id}`);
      stored.live.status = status;
    },
  };

  return stripe;
}

test("a cached create response is not reused after the payment is canceled", async () => {
  const stripe = fakeStripe();
  const first = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);
  stripe.cancel(first.intent.id);

  const again = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);

  assert.equal(again.intent.status, "requires_payment_method");
  assert.notEqual(again.intent.id, first.intent.id);
  assert.equal(again.idempotencyKey, `${baseKey}_${first.intent.id}`);
  assert.equal(stripe.creates.filter((key) => key === again.idempotencyKey).length, 1);
});

test("two callers share one replacement for a canceled payment", async () => {
  const stripe = fakeStripe();
  const first = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);
  stripe.cancel(first.intent.id);

  const [left, right] = await Promise.all([
    createOrReusePaymentIntent(stripe as unknown as Stripe, options),
    createOrReusePaymentIntent(stripe as unknown as Stripe, options),
  ]);

  assert.equal(left.intent.id, right.intent.id);
  assert.equal(left.intent.status, "requires_payment_method");
  assert.notEqual(left.intent.id, first.intent.id);
  const open = new Set(
    stripe.creates.filter((key) => key.startsWith(`${baseKey}_pi_`)),
  );
  assert.equal(open.size, 1);
});

test("a succeeded payment is returned without starting another charge", async () => {
  const stripe = fakeStripe();
  const first = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);
  stripe.mark(first.intent.id, "succeeded");
  const before = stripe.creates.length;

  const again = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);

  assert.equal(again.intent.id, first.intent.id);
  assert.equal(again.intent.status, "succeeded");
  assert.equal(stripe.creates.length, before);
});

test("a processing payment is returned without starting another charge", async () => {
  const stripe = fakeStripe();
  const first = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);
  stripe.mark(first.intent.id, "processing");
  const before = stripe.creates.length;

  const again = await createOrReusePaymentIntent(stripe as unknown as Stripe, options);

  assert.equal(again.intent.id, first.intent.id);
  assert.equal(again.intent.status, "processing");
  assert.equal(stripe.creates.length, before);
});
