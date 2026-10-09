import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET,
    supplied = request.headers.get("authorization") ?? "",
    expected = `Bearer ${secret}`;
  if (
    !secret ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Không được phép." }, { status: 401 });
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("screenshots")
      .select("id,object_path")
      .eq("retained", false)
      .is("deleted_at", null)
      .lte("expires_at", new Date().toISOString())
      .limit(200);
    if (error) throw error;
    let deleted = 0;
    for (const record of data ?? []) {
      // Retaining is only allowed before expiry, so expired candidates cannot race a valid retain operation.
      const { error: storageError } = await admin.storage
        .from("screenshots")
        .remove([record.object_path]);
      if (storageError) continue;
      const { error: updateError } = await admin
        .from("screenshots")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", record.id)
        .eq("retained", false);
      if (!updateError) deleted++;
    }
    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json(
      { error: "Không thể dọn ảnh hết hạn." },
      { status: 500 },
    );
  }
}
