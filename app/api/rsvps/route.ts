import { NextResponse } from "next/server";
import { apiError, ApiError, sameOrigin, teamContext } from "@/lib/server";
import {
  rowToRsvp,
  rsvpColumns,
  rsvpToRow,
  type RsvpRow,
} from "@/lib/invitation-server";
import { rsvpSchema } from "@/lib/types";

// Team-only guest list: read every answer, add phone/in-person confirmations
// and remove mistaken rows. Guests write through /api/rsvp instead.
export async function GET() {
  try {
    const { client, teamId } = await teamContext();
    const { data, error } = await client
      .from("rsvps")
      .select(rsvpColumns)
      .eq("team_id", teamId)
      .order("updated_at", { ascending: false })
      .limit(3000);
    if (error)
      throw new ApiError(
        "Chưa đọc được danh sách khách. Kiểm tra bảng rsvps trong cơ sở dữ liệu.",
        503,
      );
    return NextResponse.json(
      { rsvps: (data as RsvpRow[]).map(rowToRsvp) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, teamId } = await teamContext();
    const rsvp = rsvpSchema.parse((await request.json()).rsvp);
    if (rsvp.source !== "manual")
      throw new ApiError("Chỉ sửa được khách nhập tay.");
    const { data: workspace } = await client
      .from("workspaces")
      .select("payload")
      .eq("team_id", teamId)
      .single();
    if (
      !workspace?.payload.weddings?.some(
        (w: { id: string }) => w.id === rsvp.weddingId,
      )
    )
      throw new ApiError("Chọn đám cưới hợp lệ.");
    const { error } = await client
      .from("rsvps")
      .upsert(
        { ...rsvpToRow(rsvp, teamId), source: "manual" },
        { onConflict: "id" },
      );
    if (error) throw new ApiError("Không thể lưu khách mời.", 503);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { client, teamId } = await teamContext();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new ApiError("Mã khách không hợp lệ.");
    const { error } = await client
      .from("rsvps")
      .delete()
      .eq("team_id", teamId)
      .eq("id", id);
    if (error) throw new ApiError("Không thể xóa khách mời.", 503);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
