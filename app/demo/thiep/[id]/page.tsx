import type { Metadata } from "next";
import { DemoInvitation } from "@/components/invitation/GuestInvitation";

export const metadata: Metadata = {
  title: "Thiệp mời minh họa · Wedly",
  robots: { index: false, follow: false },
};
export default async function DemoInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <DemoInvitation weddingId={(await params).id} />;
}
