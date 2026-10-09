"use client";
import { useState } from "react";
import {
  Sparkles,
  X,
  ArrowUp,
  LoaderCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { normalize, today, money } from "@/lib/domain";
import type { AssistantResult, Workspace, View } from "@/lib/types";

export default function Assistant({
  state,
  demo,
  weddingId,
  go,
  onTask,
}: {
  state: Workspace;
  demo: boolean;
  weddingId: string | null;
  go: (view: View, weddingId?: string | null) => void;
  onTask: (task: NonNullable<AssistantResult["task"]>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [messages, setMessages] = useState<
      { text: string; user?: boolean; action?: AssistantResult }[]
    >([]);
  async function send(value = input) {
    if (!value.trim() || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { text: value, user: true }]);
    try {
      let result: AssistantResult;
      if (demo) {
        const plain = normalize(value);
        const wedding =
          state.weddings.find((w) =>
            normalize(value).includes(normalize(w.couple).split(" & ")[0]),
          ) ?? state.weddings.find((w) => w.id === weddingId);
        let view: View = "overview",
          text =
            "Bạn có thể mở ảnh trao đổi, công việc, thanh toán hoặc sơ đồ bàn tiệc. Bản trải nghiệm dùng điều hướng có sẵn; AI sẽ có khi kết nối đội ngũ.";
        if (/anh|cap nhat|zalo/.test(plain)) {
          view = "inbox";
          text = "Mở cập nhật để thêm nguồn và xem cập nhật cần xác nhận.";
        } else if (/so do|ban tiec|mat bang/.test(plain)) {
          view = "floorplan";
          text =
            "Mở công cụ sơ đồ. Chọn đám cưới, nhập kích thước rồi tạo bố trí.";
        } else if (/thanh toan|tien|coc/.test(plain)) {
          view = "payments";
          text = `Đội ngũ có ${state.vendors.filter((v) => v.nextAmount > 0).length} khoản thanh toán tiếp theo được lên kế hoạch. Tổng dự kiến ${money(state.vendors.reduce((s, v) => s + v.nextAmount, 0))}.`;
        } else if (/viec|qua han|hom nay/.test(plain)) {
          view = "tasks";
          text = `Có ${state.tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= today()).length} công việc đến hạn hoặc quá hạn cần xử lý.`;
        } else if (wedding) {
          view = "weddings";
          text = `Mở hồ sơ ${wedding.couple}.`;
        }
        result = {
          message: text,
          view,
          weddingId: wedding?.id ?? null,
          task: null,
        };
      } else {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: value, weddingId }),
        });
        result = await response.json();
        if (!response.ok)
          throw new Error((result as unknown as { error: string }).error);
      }
      setMessages((prev) => [
        ...prev,
        { text: result.message, action: result },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!open && (
        <button className="assistant-launch" onClick={() => setOpen(true)}>
          <Sparkles size={17} />
          Trợ lý Wedly
        </button>
      )}
      {open && (
        <aside className="assistant-panel" aria-label="Trợ lý Wedly">
          <div className="assistant-head">
            <div className="row">
              <span className="stat-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <strong style={{ fontSize: 13 }}>Trợ lý Wedly</strong>
                <div className="muted" style={{ fontSize: 10 }}>
                  {demo
                    ? "Điều hướng bản trải nghiệm"
                    : "Hỗ trợ công việc bằng tiếng Việt"}
                </div>
              </div>
            </div>
            <button
              className="icon-button"
              aria-label="Đóng trợ lý"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="assistant-body">
            <div className="assistant-message">Bạn cần làm gì?</div>
            {!messages.length && (
              <div className="assistant-chips">
                {[
                  "Việc hôm nay",
                  "Mở cập nhật",
                  "Xem thanh toán",
                  "Mở sơ đồ tiệc",
                ].map((prompt) => (
                  <button key={prompt} onClick={() => void send(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                className={`assistant-message ${m.user ? "user" : ""}`}
                key={i}
              >
                {m.text}
                {m.action?.view && (
                  <button
                    className="btn small"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      go(m.action!.view!, m.action!.weddingId);
                      setOpen(false);
                    }}
                  >
                    Mở trang <ArrowRight size={13} />
                  </button>
                )}
                {m.action?.task && (
                  <button
                    className="btn small primary"
                    style={{ marginTop: 12 }}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await onTask(m.action!.task!);
                        setMessages((prev) =>
                          prev.map((item, j) =>
                            j === i
                              ? { text: item.text + "\nĐã tạo công việc." }
                              : item,
                          ),
                        );
                      } catch (e) {
                        setMessages((prev) => [
                          ...prev,
                          { text: (e as Error).message },
                        ]);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Check size={13} />
                    Xác nhận tạo công việc
                  </button>
                )}
              </div>
            ))}
            {busy && <LoaderCircle size={18} className="spin muted" />}
          </div>
          <form
            className="assistant-compose"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              className="input"
              aria-label="Yêu cầu cho trợ lý"
              placeholder="Nhập yêu cầu bằng tiếng Việt…"
              value={input}
              maxLength={1500}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="btn primary"
              style={{ padding: "9px" }}
              aria-label="Gửi yêu cầu"
              disabled={busy || !input.trim()}
            >
              <ArrowUp size={17} />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
