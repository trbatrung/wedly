import { z } from "zod";
import {
  rsvpInputSchema,
  rsvpSchema,
  type Rsvp,
  type RsvpInput,
} from "./types";
import { upsertRsvp } from "./invitation";

// Demo answers live in this browser only, next to the demo workspace.
export const DEMO_RSVP_KEY = "wedly-rsvps-v1";
export function loadDemoRsvps(): Rsvp[] | null {
  try {
    const raw = localStorage.getItem(DEMO_RSVP_KEY);
    if (!raw) return null;
    const parsed = z.array(rsvpSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
export function saveDemoRsvps(list: Rsvp[]) {
  localStorage.setItem(DEMO_RSVP_KEY, JSON.stringify(list.slice(0, 3000)));
}
export function upsertDemoRsvp(rsvp: Rsvp) {
  const next = upsertRsvp(loadDemoRsvps() ?? [], rsvpSchema.parse(rsvp));
  saveDemoRsvps(next);
  return next;
}
export function deleteDemoRsvp(id: string) {
  const next = (loadDemoRsvps() ?? []).filter((r) => r.id !== id);
  saveDemoRsvps(next);
  return next;
}

// A guest's own last answer, remembered on their device so they can edit it.
const answerKey = (scope: string) => `wedly-rsvp-answer:${scope}`;
export function recallAnswer(scope: string): RsvpInput | null {
  try {
    const parsed = rsvpInputSchema.safeParse(
      JSON.parse(localStorage.getItem(answerKey(scope)) ?? "null"),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export function rememberAnswer(scope: string, answer: RsvpInput) {
  try {
    localStorage.setItem(answerKey(scope), JSON.stringify(answer));
  } catch {
    /* Private browsing can block storage; the answer is still submitted. */
  }
}
