import { NextResponse } from "next/server";
import { teamContext, apiError, sameOrigin, ApiError } from "@/lib/server";
import { workspaceSchema } from "@/lib/types";

export async function GET() {
  try {
    const { client, teamId, role, memberName } = await teamContext();
    const { data, error } = await client
      .from("workspaces")
      .select("payload,revision")
      .eq("team_id", teamId)
      .single();
    if (error) throw error;
    return NextResponse.json(
      {
        ...data,
        role,
        memberName,
        aiEnabled: Boolean(process.env.ANTHROPIC_API_KEY),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const { client, teamId } = await teamContext();
    const body = await request.json();
    const payload = workspaceSchema.parse(body.payload);
    if (!Number.isInteger(body.revision) || body.revision < 0)
      throw new ApiError("Phiên bản dữ liệu không hợp lệ.");
    const { data, error } = await client.rpc("save_workspace", {
      p_team_id: teamId,
      p_payload: payload,
      p_revision: body.revision,
    });
    if (error?.message.includes("revision_conflict"))
      throw new ApiError(
        "Một thành viên vừa cập nhật dữ liệu. Tải lại để xem phiên bản mới nhất rồi thử lại.",
        409,
      );
    if (error) throw error;
    return NextResponse.json({ revision: data });
  } catch (error) {
    return apiError(error);
  }
}
