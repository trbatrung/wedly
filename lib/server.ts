import { NextResponse } from "next/server";
import { supabaseServer, isConfigured } from "./supabase/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function teamContext() {
  if (!isConfigured())
    throw new ApiError(
      "Chưa kết nối cơ sở dữ liệu. Bạn có thể dùng bản trải nghiệm.",
      503,
    );
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new ApiError("Vui lòng đăng nhập để tiếp tục.", 401);
  const { data: membership, error } = await client
    .from("team_members")
    .select("team_id,role,display_name")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error)
    throw new ApiError(
      "Không thể đọc đội ngũ. Kiểm tra cấu hình cơ sở dữ liệu.",
      503,
    );
  if (!membership) throw new ApiError("Bạn chưa tham gia đội ngũ.", 404);
  return {
    client,
    user,
    teamId: membership.team_id as string,
    role: membership.role as string,
    memberName: membership.display_name as string,
  };
}
export async function consumeAi(
  client: Awaited<ReturnType<typeof supabaseServer>>,
  teamId: string,
) {
  const { data, error } = await client.rpc("consume_ai_request", {
    p_team_id: teamId,
  });
  if (error || !data)
    throw new ApiError(
      "Đội ngũ đã đạt giới hạn AI hôm nay. Hãy thử lại ngày mai.",
      429,
    );
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error && typeof error === "object" && "issues" in error)
    return NextResponse.json(
      { error: "Thông tin chưa hợp lệ. Hãy kiểm tra lại các trường." },
      { status: 400 },
    );
  return NextResponse.json(
    { error: "Không thể hoàn tất thao tác. Hãy thử lại." },
    { status: 500 },
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new ApiError("Yêu cầu không hợp lệ.", 403);
}
