import { isConfigured, supabaseAdmin } from "./supabase/server";
import { workspaceSchema, type Rsvp } from "./types";

// Finds a published invitation by its public token. Server-only: it reads the
// whole team workspace with the service role, so callers must project the
// result through publicInvitation() before anything reaches a guest.
export async function findInvitation(token: string) {
  if (
    !/^[a-f0-9-]{36}$/.test(token) ||
    !isConfigured() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return null;
  const { data, error } = await supabaseAdmin()
    .from("workspaces")
    .select("team_id,payload")
    .contains("payload", { invitations: [{ token }] })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = workspaceSchema.safeParse(data.payload);
  if (!parsed.success) return null;
  const state = parsed.data;
  const invitation = state.invitations.find((i) => i.token === token);
  const wedding =
    invitation && state.weddings.find((w) => w.id === invitation.weddingId);
  if (!invitation || !wedding || !invitation.published || wedding.archived)
    return null;
  return { teamId: data.team_id as string, state, invitation, wedding };
}

export type RsvpRow = {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
  attending: boolean;
  guests: number;
  guest_names: string;
  side: Rsvp["side"];
  dietary: string;
  message: string;
  source: "invite" | "manual";
  created_at: string;
  updated_at: string;
};
export const rsvpColumns =
  "id,wedding_id,name,phone,attending,guests,guest_names,side,dietary,message,source,created_at,updated_at";
export const rowToRsvp = (row: RsvpRow): Rsvp => ({
  id: row.id,
  weddingId: row.wedding_id,
  name: row.name,
  phone: row.phone,
  attending: row.attending,
  guests: row.guests,
  guestNames: row.guest_names,
  side: row.side,
  dietary: row.dietary,
  message: row.message,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
export const rsvpToRow = (rsvp: Rsvp, teamId: string) => ({
  id: rsvp.id,
  team_id: teamId,
  wedding_id: rsvp.weddingId,
  name: rsvp.name,
  phone: rsvp.phone,
  attending: rsvp.attending,
  guests: rsvp.guests,
  guest_names: rsvp.guestNames,
  side: rsvp.side,
  dietary: rsvp.dietary,
  message: rsvp.message,
  updated_at: rsvp.updatedAt,
});
