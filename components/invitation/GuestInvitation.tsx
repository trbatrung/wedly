"use client";
import { useEffect, useState } from "react";
import InvitationView from "./InvitationView";
import { Empty } from "../ui";
import { workspaceSchema, type RsvpInput } from "@/lib/types";
import {
  normalizeRsvp,
  publicInvitation,
  sheetRow,
  type PublicInvitation,
} from "@/lib/invitation";
import { upsertDemoRsvp } from "@/lib/rsvp-store";
import { sendToSheet } from "@/lib/sheets-client";

// Live invitation: answers go to /api/rsvp, which stores them for the team
// and copies them to the couple's Google Sheet when one is connected.
export function LiveInvitation({
  invite,
  token,
}: {
  invite: PublicInvitation;
  token: string;
}) {
  return (
    <InvitationView
      invite={invite}
      mode="live"
      answerScope={token}
      onSubmit={async (answer: RsvpInput) => {
        const response = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, answer }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data.error ?? "Chưa gửi được. Vui lòng thử lại.");
      }}
    />
  );
}

// Demo invitation: reads the browser-stored demo workspace, so it only opens
// on the device that holds the demo data.
export function DemoInvitation({ weddingId }: { weddingId: string }) {
  const [data, setData] = useState<
    | {
        invite: PublicInvitation;
        sheetUrl: string;
        published: boolean;
      }
    | null
    | "missing"
  >(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wedly-workspace-v2");
      const parsed = raw ? workspaceSchema.safeParse(JSON.parse(raw)) : null;
      const state = parsed?.success ? parsed.data : null;
      const wedding = state?.weddings.find((w) => w.id === weddingId);
      const invitation = state?.invitations.find(
        (i) => i.weddingId === weddingId,
      );
      if (!state || !wedding || !invitation) return setData("missing");
      document.title = `${invitation.names || wedding.couple} · Thiệp mời`;
      setData({
        invite: publicInvitation(wedding, invitation, state.teamName),
        sheetUrl: invitation.sheetUrl,
        published: invitation.published,
      });
    } catch {
      setData("missing");
    }
  }, [weddingId]);
  if (data === null) return <div className="loading">Đang mở thiệp…</div>;
  if (data === "missing")
    return (
      <div className="loading">
        <Empty
          title="Không tìm thấy thiệp minh họa"
          description="Thiệp minh họa chỉ mở được trên trình duyệt đã tạo thiệp trong bản trải nghiệm."
        >
          <a className="btn primary" href="/demo">
            Mở bản trải nghiệm
          </a>
        </Empty>
      </div>
    );
  return (
    <InvitationView
      invite={data.invite}
      mode="demo"
      notice={
        data.published ? undefined : "Bản nháp · Khách chưa mở được thiệp này"
      }
      answerScope={`demo:${weddingId}`}
      onSubmit={async (answer) => {
        const now = new Date().toISOString();
        const rsvp = {
          ...normalizeRsvp(answer, data.invite),
          weddingId,
          source: "invite" as const,
          createdAt: now,
          updatedAt: now,
        };
        upsertDemoRsvp(rsvp);
        if (data.sheetUrl)
          await sendToSheet(data.sheetUrl, sheetRow(rsvp, data.invite.names));
      }}
    />
  );
}
