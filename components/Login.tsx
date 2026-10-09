"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Check, LoaderCircle } from "lucide-react";
import { Logo } from "./ui";
import { supabaseBrowser } from "@/lib/supabase/browser";
export default function Login({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Logo />
        <div>
          <h1>
            Cùng đội ngũ.
            <br />
            Rõ từng đầu việc.
          </h1>
          <p>
            Mọi đám cưới, nhà cung cấp, khoản thanh toán và bố trí bàn tiệc
            trong cùng một không gian làm việc.
          </p>
        </div>
        <span style={{ fontSize: 11, color: "#bacabd" }}>
          Wedly · Thiết kế cho nhịp làm việc mùa cưới
        </span>
      </aside>
      <main className="auth-form-wrap">
        <div className="auth-form">
          <h1>
            {sent ? "Kiểm tra hộp thư của bạn" : "Chào mừng đến với Wedly"}
          </h1>
          <p>
            {sent
              ? "Mở liên kết trong email để đăng nhập. Liên kết chỉ dùng một lần."
              : "Đăng nhập bằng email để vào không gian riêng của đội ngũ."}
          </p>
          {!configured ? (
            <div className="stack">
              <div className="notice">
                Không gian đội ngũ đang được chuẩn bị. Bạn có thể khám phá giao
                diện, công việc và sơ đồ bàn tiệc ngay trong bản trải nghiệm.
              </div>
              <Link href="/demo" className="btn primary">
                Mở bản trải nghiệm <ArrowRight size={15} />
              </Link>
            </div>
          ) : sent ? (
            <div className="stack">
              <span className="row" style={{ color: "var(--green)" }}>
                <Check size={18} />
                {email}
              </span>
              <button className="btn" onClick={() => setSent(false)}>
                Dùng email khác
              </button>
            </div>
          ) : (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const params = new URLSearchParams(location.search),
                    raw = params.get("next");
                  const next =
                    raw && /^\/join\/[a-f0-9-]{36}$/.test(raw)
                      ? raw
                      : "/dashboard";
                  const callback = new URL("/auth/callback", location.origin);
                  callback.searchParams.set("next", next);
                  const { error } = await supabaseBrowser().auth.signInWithOtp({
                    email,
                  options: { emailRedirectTo: callback.toString() },
                  });
                  if (error) throw error;
                  setSent(true);
                } catch {
                  setError(
                    "Không thể gửi liên kết đăng nhập. Hãy kiểm tra email hoặc thử lại sau.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                Email của bạn
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@doingu.vn"
                />
              </label>
              {error && (
                <div className="notice error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Mail size={15} />
                )}
                Gửi liên kết đăng nhập
              </button>
              <Link
                href="/demo"
                className="text-link"
                style={{ justifyContent: "center" }}
              >
                Xem bản trải nghiệm trước
              </Link>
            </form>
          )}
          <div className="divider" />
          <Link href="/" className="text-link">
            Về trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}
