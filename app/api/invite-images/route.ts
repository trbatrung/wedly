import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { apiError, ApiError, sameOrigin, teamContext } from "@/lib/server";

const BUCKET = "invitation-images";
const publicPrefix = (teamId: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${teamId}/`;

// Photos for a team's invitations. Files are compressed in the browser first;
// the server checks membership, the wedding and the real file type.
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, teamId } = await teamContext();
    const form = await request.formData(),
      file = form.get("file"),
      weddingId = String(form.get("weddingId") || "");
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024)
      throw new ApiError("Ảnh cần nhỏ hơn 3 MB sau khi tối ưu.");
    const { data: workspace } = await client
      .from("workspaces")
      .select("payload")
      .eq("team_id", teamId)
      .single();
    if (
      !workspace?.payload.weddings?.some(
        (w: { id: string }) => w.id === weddingId,
      )
    )
      throw new ApiError("Chọn đám cưới hợp lệ.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const type =
      buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
        ? "jpg"
        : buffer
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "png"
          : buffer.toString("ascii", 0, 4) === "RIFF" &&
              buffer.toString("ascii", 8, 12) === "WEBP"
            ? "webp"
            : null;
    if (!type) throw new ApiError("Chọn ảnh JPG, PNG hoặc WebP.");
    const path = `${teamId}/${weddingId}/${randomUUID()}.${type}`;
    const storage = supabaseAdmin().storage.from(BUCKET);
    const { error } = await storage.upload(path, buffer, {
      contentType: type === "jpg" ? "image/jpeg" : `image/${type}`,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error)
      throw new ApiError("Không thể lưu ảnh. Kiểm tra cấu hình lưu trữ.", 503);
    return NextResponse.json({
      url: storage.getPublicUrl(path).data.publicUrl,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { teamId } = await teamContext();
    const url = String((await request.json()).url ?? "");
    const prefix = publicPrefix(teamId);
    if (!url.startsWith(prefix) || url.includes(".."))
      throw new ApiError("Ảnh không thuộc đội ngũ.", 403);
    const { error } = await supabaseAdmin()
      .storage.from(BUCKET)
      .remove([`${teamId}/${url.slice(prefix.length)}`]);
    if (error) throw new ApiError("Không thể xóa ảnh.", 503);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
