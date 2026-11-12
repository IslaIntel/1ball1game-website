import type Stripe from "stripe";

/** Winter Indoor Streetball 2026. Amount comes from this product's active USD price. */
export const WINTER_STREETBALL_PRODUCT_ID = "prod_VYai22Ofqnw2hO";

export type WinterStreetballPrice = {
  productId: string;
  priceId: string;
  unitAmount: number;
  productName: string;
};

const PRICE_CACHE_MS = 10 * 60 * 1000;
let cachedPrice: { value: WinterStreetballPrice; expiresAt: number } | null = null;

export async function getWinterStreetballPrice(
  stripe: Stripe,
): Promise<WinterStreetballPrice> {
  if (cachedPrice && cachedPrice.expiresAt > Date.now()) return cachedPrice.value;
  const value = await loadWinterStreetballPrice(stripe);
  cachedPrice = { value, expiresAt: Date.now() + PRICE_CACHE_MS };
  return value;
}

async function loadWinterStreetballPrice(
  stripe: Stripe,
): Promise<WinterStreetballPrice> {
  const product = await stripe.products.retrieve(WINTER_STREETBALL_PRODUCT_ID);
  if (!product.active) {
    throw new Error("Winter Streetball product is not active.");
  }

  let price: Stripe.Price | null = null;
  if (typeof product.default_price === "string") {
    price = await stripe.prices.retrieve(product.default_price);
  } else if (product.default_price) {
    price = product.default_price;
  }

  if (!price?.active) {
    const listed = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1,
    });
    price = listed.data[0] ?? null;
  }

  if (!price?.active || price.currency !== "usd" || price.unit_amount == null) {
    throw new Error("Winter Streetball price is not available.");
  }

  return {
    productId: product.id,
    priceId: price.id,
    unitAmount: price.unit_amount,
    productName: product.name || "Winter Indoor Streetball 2026",
  };
}
