import { redirect } from "next/navigation";
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/dashboard?v=tasks&w=${encodeURIComponent((await params).id)}`);
}
