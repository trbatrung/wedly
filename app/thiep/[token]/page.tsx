import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findInvitation } from "@/lib/invitation-server";
import { publicInvitation } from "@/lib/invitation";
import { dateLabel } from "@/lib/domain";
import { LiveInvitation } from "@/components/invitation/GuestInvitation";

export const dynamic = "force-dynamic";
const load = cache(async (token: string) => {
  const found = await findInvitation(token);
  return found
    ? publicInvitation(found.wedding, found.invitation, found.state.teamName)
    : null;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const invite = await load((await params).token);
  const robots = { index: false, follow: false };
  if (!invite) return { title: "Thiệp mời", robots };
  const title = `${invite.names} · Thiệp mời`;
  const description = [
    invite.headline,
    dateLabel(invite.date),
    invite.venueName,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title,
    description,
    robots,
    openGraph: { title, description, type: "website", locale: "vi_VN" },
  };
}
export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await load(token);
  if (!invite) notFound();
  return <LiveInvitation invite={invite} token={token} />;
}
