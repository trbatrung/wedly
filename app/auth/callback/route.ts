import { NextResponse } from "next/server";
import { supabaseServer, isConfigured } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    raw = url.searchParams.get("next"),
    next = raw && /^\/join\/[a-f0-9-]{36}$/.test(raw) ? raw : "/dashboard";
  if (code && isConfigured()) {
    const { error } = await (
      await supabaseServer()
    ).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=expired", url.origin));
}
