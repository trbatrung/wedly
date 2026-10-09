import { notFound } from "next/navigation";
import { isConfigured, supabaseAdmin } from "@/lib/supabase/server";
import { workspaceSchema } from "@/lib/types";
import Portal from "@/components/Portal";
export const dynamic = "force-dynamic";
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
  const { data, error } = await supabaseAdmin()
    .from("workspaces")
    .select("payload")
    .contains("payload", { weddings: [{ shareToken: token }] })
    .limit(1)
    .maybeSingle();
  if (error || !data) notFound();
  const state = workspaceSchema.parse(data.payload),
    wedding = state.weddings.find((w) => w.shareToken === token);
  if (!wedding || wedding.archived) notFound();
  // Public portals receive only selected wedding basics and aggregate task progress.
  // Quotes, payments, sources, filenames, internal notes and team membership stay private.
  return (
    <Portal
      wedding={{ ...wedding, note: "", shareToken: null, budget: 0 }}
      tasks={state.tasks
        .filter((t) => t.weddingId === wedding.id)
        .map((t) => ({ ...t, title: "", owner: "", sourceId: null }))}
      teamName={state.teamName}
    />
  );
}
