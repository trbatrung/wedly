import { redirect } from "next/navigation";
export default async function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(
    `/dashboard?v=weddings&w=${encodeURIComponent((await params).id)}&t=guests`,
  );
}
