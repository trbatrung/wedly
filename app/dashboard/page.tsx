import { redirect } from "next/navigation";
import Workspace from "@/components/Workspace";
import { isConfigured, supabaseServer } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  if (!isConfigured()) redirect("/login");
  const {
    data: { user },
  } = await (await supabaseServer()).auth.getUser();
  if (!user) redirect("/login");
  return <Workspace />;
}
