"use client";
import { useState } from "react";
import Link from "next/link";
import { Users, LoaderCircle } from "lucide-react";
import { Logo } from "./ui";
export default function Join({
  token,
  signedIn,
  configured,
}: {
  token: string;
  signedIn: boolean;
  configured: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="auth-form-wrap" style={{ minHeight: "100vh" }}>
      <div className="auth-form">
        <Logo />
        <h1 style={{ marginTop: 35 }}>Lời mời tham gia đội ngũ</h1>
        <p>Cùng quản lý hồ sơ và công việc trong không gian Wedly.</p>
        {!configured ? (
          <Link href="/demo" className="btn">
            Mở bản trải nghiệm
          </Link>
        ) : !signedIn ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/join/${token}`)}`}
            className="btn primary"
          >
            Đăng nhập để tham gia
          </Link>
        ) : (
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const response = await fetch("/api/team", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "join", token }),
                });
                const body = await response.json();
                if (!response.ok) throw new Error(body.error);
                location.href = "/dashboard";
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Users size={16} />
            )}
            Tham gia đội ngũ
          </button>
        )}
        {error && (
          <div className="notice error" style={{ marginTop: 18 }}>
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
