import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { teamContext, sameOrigin, apiError, ApiError } from "@/lib/server";
import { RETENTION_MS } from "@/lib/domain";

export const maxDuration = 60;
export async function GET() {
  try {
    const { client, teamId } = await teamContext();
    const { data, error } = await client
      .from("screenshots")
      .select(
        "id,wedding_id,filename,created_at,expires_at,retained,deleted_at,analysis,hash",
      )
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json(
      { screenshots: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, teamId, user } = await teamContext();
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 4 * 1024 * 1024)
      throw new ApiError("Ảnh cần được tối ưu trước khi tải lên.", 413);
    const form = await request.formData(),
      file = form.get("file"),
      weddingId = String(form.get("weddingId") || "");
    if (
      !(file instanceof File) ||
      file.size > 3.5 * 1024 * 1024 ||
      file.size === 0
    )
      throw new ApiError("Ảnh cần được tối ưu trước khi tải lên.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      throw new ApiError("Chọn ảnh PNG, JPG hoặc WebP.");
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
    const buffer = Buffer.from(await file.arrayBuffer()),
      hash = createHash("sha256").update(buffer).digest("hex");
    const isPng = buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      isJpg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255,
      isWebp =
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP";
    if (
      (file.type === "image/png" && !isPng) ||
      (file.type === "image/jpeg" && !isJpg) ||
      (file.type === "image/webp" && !isWebp)
    )
      throw new ApiError("Định dạng ảnh không hợp lệ.");
    const { data: existing } = await client
      .from("screenshots")
      .select("*")
      .eq("team_id", teamId)
      .eq("hash", hash)
      .maybeSingle();
    if (existing) {
      if (existing.wedding_id !== weddingId)
        throw new ApiError(
          "Ảnh này đã thuộc một đám cưới khác. Kiểm tra lại nguồn.",
        );
      return NextResponse.json({ screenshot: existing, duplicate: true });
    }
    const { count } = await client
      .from("screenshots")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString());
    if ((count ?? 0) >= 100)
      throw new ApiError("Đội ngũ đã đạt giới hạn 100 ảnh hôm nay.", 429);
    const admin = supabaseAdmin(),
      id = randomUUID(),
      path = `${teamId}/${id}.${isPng ? "png" : isJpg ? "jpg" : "webp"}`;
    const { error: uploadError } = await admin.storage
      .from("screenshots")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError)
      throw new ApiError("Không thể lưu ảnh. Kiểm tra cấu hình lưu trữ.", 503);
    const { data, error } = await client
      .from("screenshots")
      .insert({
        id,
        team_id: teamId,
        wedding_id: weddingId,
        filename: file.name.slice(0, 160),
        object_path: path,
        hash,
        created_by: user.id,
        expires_at: new Date(Date.now() + RETENTION_MS).toISOString(),
      })
      .select()
      .single();
    if (error) {
      await admin.storage.from("screenshots").remove([path]);
      throw error;
    }
    return NextResponse.json({ screenshot: data });
  } catch (error) {
    return apiError(error);
  }
}
