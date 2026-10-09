import Login from "@/components/Login";
import { isConfigured } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return <Login configured={isConfigured()} />;
}
