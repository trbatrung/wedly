"use client";
import { useEffect, useState } from "react";
import { workspaceSchema, type Rsvp, type Workspace } from "@/lib/types";
import { demoWorkspace } from "@/lib/demo";
import { rsvpSummary } from "@/lib/invitation";
import { loadDemoRsvps } from "@/lib/rsvp-store";
import Portal from "./Portal";
import { Empty } from "./ui";
export default function DemoPortal({ id }: { id: string }) {
  const [state, setState] = useState<Workspace | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wedly-workspace-v2");
      const parsed = raw ? workspaceSchema.safeParse(JSON.parse(raw)) : null;
      setState(parsed?.success ? parsed.data : demoWorkspace());
      setRsvps(loadDemoRsvps() ?? []);
    } catch {
      setState(demoWorkspace());
    }
  }, []);
  if (!state) return <div className="loading">Đang mở cổng minh họa…</div>;
  const wedding = state.weddings.find((w) => w.id === id);
  if (!wedding) return <Empty title="Không tìm thấy hồ sơ minh họa" />;
  const invitation = state.invitations.find((i) => i.weddingId === id);
  const answers = rsvps.filter((r) => r.weddingId === id);
  return (
    <Portal
      wedding={wedding}
      tasks={state.tasks.filter((t) => t.weddingId === id)}
      teamName={state.teamName}
      guests={answers.length ? rsvpSummary(answers) : null}
      inviteUrl={invitation?.published ? `/demo/thiep/${id}` : null}
      demo
    />
  );
}
