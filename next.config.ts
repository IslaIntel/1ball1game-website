import type { NextConfig } from "next";

/**
 * Static export keeps Amplify on CDN hosting (platform WEB) instead of
 * WEB_COMPUTE SSR. Registration previously went down whenever Amplify's SSR
 * compute environment failed — API routes required that compute.
 *
 * Stripe checkout uses Payment Links (no server). Contact/register webhooks
 * are called from the browser. Optional webhook verification lives in /server.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
