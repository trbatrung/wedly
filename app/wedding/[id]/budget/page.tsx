import { redirect } from "next/navigation";
export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/dashboard?v=payments&w=${encodeURIComponent((await params).id)}`);
}
