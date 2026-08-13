/**
 * Public Waves webhook URLs (capability URLs). Called from the browser so the
 * static Amplify site does not need SSR compute for contact/registration.
 */
export const CONTACT_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_CONTACT_WEBHOOK_URL ??
  process.env.CONTACT_WEBHOOK_URL ??
  "https://waves.islaintel.com/api/v1/webhooks/S2bgx5mxtevAMOyUCunRR";

export const REGISTER_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_REGISTER_WEBHOOK_URL ??
  process.env.REGISTER_WEBHOOK_URL ??
  "https://waves.islaintel.com/api/v1/webhooks/oQwh7JAcfDrZ8CgUvymgO";
