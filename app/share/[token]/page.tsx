import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isConfigured, supabaseAdmin } from "@/lib/supabase/server";
import { workspaceSchema } from "@/lib/types";
import { rsvpSummary } from "@/lib/invitation";
import Portal from "@/components/Portal";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cổng thông tin khách hàng · Wedly",
  robots: { index: false, follow: false },
};
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (
    !/^[a-f0-9-]{36}$/.test(token) ||
    !isConfigured() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    notFound();
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("team_id,payload")
    .contains("payload", { weddings: [{ shareToken: token }] })
    .limit(1)
    .maybeSingle();
  if (error || !data) notFound();
  const state = workspaceSchema.parse(data.payload),
    wedding = state.weddings.find((w) => w.shareToken === token);
  if (!wedding || wedding.archived) notFound();
  const invitation = state.invitations.find(
    (i) => i.weddingId === wedding.id && i.published && i.token,
  );
  // Aggregate counts only: guest names, phones and messages stay with the team.
  const { data: answers } = await admin
    .from("rsvps")
    .select("attending,guests,dietary,side")
    .eq("team_id", data.team_id)
    .eq("wedding_id", wedding.id);
  // Public portals receive only selected wedding basics and aggregate task progress.
  // Quotes, payments, sources, filenames, internal notes and team membership stay private.
  return (
    <Portal
      wedding={{ ...wedding, note: "", shareToken: null, budget: 0 }}
      tasks={state.tasks
        .filter((t) => t.weddingId === wedding.id)
        .map((t) => ({ ...t, title: "", owner: "", sourceId: null }))}
      teamName={state.teamName}
      guests={answers?.length ? rsvpSummary(answers) : null}
      inviteUrl={invitation ? `/thiep/${invitation.token}` : null}
    />
  );
}
