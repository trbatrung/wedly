import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { teamContext, sameOrigin, apiError, ApiError } from "@/lib/server";

async function record(id: string) {
  const { client, teamId } = await teamContext();
  const { data, error } = await client
    .from("screenshots")
    .select("*")
    .eq("id", id)
    .eq("team_id", teamId)
    .single();
  if (error || !data) throw new ApiError("Không tìm thấy ảnh.", 404);
  return { data, client };
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data } = await record((await params).id);
    if (
      data.deleted_at ||
      (!data.retained && Date.parse(data.expires_at) <= Date.now())
    )
      throw new ApiError("Ảnh đã hết hạn và không còn truy cập được.", 410);
    const { data: file, error } = await supabaseAdmin()
      .storage.from("screenshots")
      .download(data.object_path);
    if (error || !file) throw new ApiError("Không thể đọc ảnh.", 404);
    return new Response(await file.arrayBuffer(), {
      headers: {
        "Content-Type": file.type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const { data, client } = await record((await params).id);
    const { retained } = await request.json();
    if (typeof retained !== "boolean")
      throw new ApiError("Thông tin không hợp lệ.");
    if (
      data.deleted_at ||
      (!data.retained && Date.parse(data.expires_at) <= Date.now())
    )
      throw new ApiError("Ảnh đã hết hạn.", 410);
    const { error } = await client
      .from("screenshots")
      .update({ retained })
      .eq("id", data.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const { data, client } = await record((await params).id);
    const { error: storageError } = await supabaseAdmin()
      .storage.from("screenshots")
      .remove([data.object_path]);
    if (storageError) throw storageError;
    const { error } = await client
      .from("screenshots")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
