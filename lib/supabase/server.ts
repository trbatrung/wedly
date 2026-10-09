import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const isConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
export async function supabaseServer() {
  if (!isConfigured()) throw new Error("Chưa cấu hình cơ sở dữ liệu.");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (changes) => {
          try {
            changes.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot write cookies. API handlers refresh sessions. */
          }
        },
      },
    },
  );
}
export function supabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !isConfigured())
    throw new Error("Chưa cấu hình lưu trữ riêng tư.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
