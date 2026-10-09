import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { teamContext, sameOrigin, apiError, ApiError } from "@/lib/server";
import { emptyWorkspace } from "@/lib/demo";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const client = await supabaseServer();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new ApiError("Vui lòng đăng nhập.", 401);
    const body = await request.json();
    if (body.action === "join") {
      if (typeof body.token !== "string" || !/^[a-f0-9-]{36}$/.test(body.token))
        throw new ApiError("Liên kết mời không hợp lệ.");
      const { error } = await client.rpc("accept_team_invite", {
        p_token: body.token,
      });
      if (error)
        throw new ApiError(
          "Liên kết mời đã hết hạn hoặc bạn đã thuộc đội ngũ khác.",
        );
      return NextResponse.json({ ok: true });
    }
    if (body.action === "invite") {
      const { teamId, role } = await teamContext();
      if (role !== "owner")
        throw new ApiError("Chỉ chủ đội ngũ có thể tạo liên kết mời.", 403);
      const { data, error } = await client.rpc("create_team_invite", {
        p_team_id: teamId,
      });
      if (error) throw error;
      return NextResponse.json({ token: data });
    }
    const name = String(body.name ?? "")
        .trim()
        .slice(0, 120),
      member = String(body.member ?? "")
        .trim()
        .slice(0, 80);
    if (!name || !member)
      throw new ApiError("Nhập tên đội ngũ và tên của bạn.");
    const { data, error } = await client.rpc("create_team", {
      p_name: name,
      p_member: member,
      p_payload: emptyWorkspace(name, member),
    });
    if (error)
      throw new ApiError(
        "Không thể tạo đội ngũ. Có thể bạn đã thuộc một đội ngũ.",
      );
    return NextResponse.json({ teamId: data });
  } catch (error) {
    return apiError(error);
  }
}
