import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, ApiError, sameOrigin } from "@/lib/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { findInvitation, rsvpToRow } from "@/lib/invitation-server";
import {
  normalizeRsvp,
  publicInvitation,
  rsvpStatus,
  sheetRow,
} from "@/lib/invitation";
import { rsvpInputSchema, type Rsvp } from "@/lib/types";

// Public endpoint for guests answering an invitation. Guests are not team
// members, so the row is written with the service role after the invitation
// token, publish state and answer have been validated here.
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await request.json();
    const found = await findInvitation(String(body?.token ?? ""));
    if (!found) throw new ApiError("Thiệp mời không còn mở.", 404);
    const invite = publicInvitation(
      found.wedding,
      found.invitation,
      found.state.teamName,
    );
    if (rsvpStatus(invite) !== "open")
      throw new ApiError("Thiệp đã ngừng nhận xác nhận.", 410);
    const answer = normalizeRsvp(rsvpInputSchema.parse(body.answer), invite);
    const admin = supabaseAdmin();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const ipHash = createHash("sha256")
      .update(`${found.teamId}:${ip}`)
      .digest("hex")
      .slice(0, 32);
    const { count } = await admin
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("team_id", found.teamId)
      .eq("ip_hash", ipHash)
      .gte("updated_at", new Date(Date.now() - 10 * 60000).toISOString());
    if ((count ?? 0) >= 20)
      throw new ApiError(
        "Bạn đã gửi nhiều lần. Vui lòng thử lại sau ít phút.",
        429,
      );
    const { data: existing } = await admin
      .from("rsvps")
      .select("team_id,wedding_id,source")
      .eq("id", answer.id)
      .maybeSingle();
    if (
      existing &&
      (existing.team_id !== found.teamId ||
        existing.wedding_id !== found.wedding.id ||
        existing.source !== "invite")
    )
      throw new ApiError("Không thể cập nhật câu trả lời này.", 409);
    const now = new Date().toISOString();
    const rsvp: Rsvp = {
      ...answer,
      weddingId: found.wedding.id,
      source: "invite",
      createdAt: now,
      updatedAt: now,
    };
    const { error } = await admin.from("rsvps").upsert(
      {
        ...rsvpToRow(rsvp, found.teamId),
        source: "invite",
        ip_hash: ipHash,
      },
      { onConflict: "id" },
    );
    if (error)
      throw new ApiError("Chưa lưu được xác nhận. Vui lòng thử lại.", 503);
    // Best effort copy to the couple's Google Sheet; Wedly keeps the answer
    // even when Google is slow or the script was removed.
    if (found.invitation.sheetUrl) {
      const sent = await fetch(found.invitation.sheetUrl, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=utf-8" },
        body: JSON.stringify(sheetRow(rsvp, invite.names)),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      })
        .then((r) => r.ok)
        .catch(() => false);
      await admin
        .from("rsvps")
        .update({ sheet_status: sent ? "sent" : "failed" })
        .eq("id", rsvp.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
