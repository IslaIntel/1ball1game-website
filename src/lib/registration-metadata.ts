import type { RegistrationPayload } from "@/lib/registration";

const CHUNK_SIZE = 450;
const CHUNK_PREFIX = "reg_chunk_";
const CHUNK_COUNT_KEY = "reg_chunk_count";

/** Split registration JSON across Stripe metadata keys (500 char limit per value). */
export function encodeRegistrationMetadata(
  payload: RegistrationPayload,
): Record<string, string> {
  const json = JSON.stringify(payload);
  const chunks: string[] = [];
  for (let i = 0; i < json.length; i += CHUNK_SIZE) {
    chunks.push(json.slice(i, i + CHUNK_SIZE));
  }

  const metadata: Record<string, string> = {
    [CHUNK_COUNT_KEY]: String(chunks.length),
  };
  chunks.forEach((chunk, index) => {
    metadata[`${CHUNK_PREFIX}${index}`] = chunk;
  });
  return metadata;
}

export function decodeRegistrationMetadata(
  metadata: Record<string, string>,
): RegistrationPayload | null {
  const count = Number(metadata[CHUNK_COUNT_KEY]);
  if (!count || count < 1) return null;

  let json = "";
  for (let i = 0; i < count; i++) {
    const chunk = metadata[`${CHUNK_PREFIX}${i}`];
    if (chunk === undefined) return null;
    json += chunk;
  }

  try {
    return JSON.parse(json) as RegistrationPayload;
  } catch {
    return null;
  }
}
