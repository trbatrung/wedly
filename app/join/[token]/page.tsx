import { notFound } from "next/navigation";
import Join from "@/components/Join";
import { isConfigured, supabaseServer } from "@/lib/supabase/server";
export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9-]{36}$/.test(token)) notFound();
  const configured = isConfigured();
  const user = configured
    ? (await (await supabaseServer()).auth.getUser()).data.user
    : null;
  return (
    <Join token={token} signedIn={Boolean(user)} configured={configured} />
  );
}
