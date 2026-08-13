import type { RegistrationPayload } from "@/lib/registration";

const STORAGE_KEY = "1b1g_registration_draft_v1";

export type RegistrationDraft = {
  payload: RegistrationPayload;
  fingerprint: string;
  totalCents: number;
  savedAt: string;
};

export function saveRegistrationDraft(draft: RegistrationDraft) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadRegistrationDraft(): RegistrationDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegistrationDraft;
  } catch {
    return null;
  }
}

export function clearRegistrationDraft() {
  sessionStorage.removeItem(STORAGE_KEY);
}
