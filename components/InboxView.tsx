"use client";
import { useState, useEffect, useRef } from "react";
import {
  Upload,
  ImagePlus,
  FileText,
  ShieldCheck,
  Clock3,
  Sparkles,
  Check,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { imageExpired, dateLabel, analyzeText } from "@/lib/domain";
import {
  analysisSchema,
  dealLabels,
  categoryLabels,
  type Workspace,
  type Analysis,
  type Update,
} from "@/lib/types";
import { getImage } from "@/lib/browser-storage";
import { Empty } from "./ui";

type Props = {
  state: Workspace;
  demo: boolean;
  weddingId: string | null;
  busy: boolean;
  onUpload: (file: File, weddingId: string) => Promise<string | undefined>;
  onText: (
    text: string,
    weddingId: string,
    updateId?: string,
  ) => Promise<string | undefined>;
  onAnalyze: (update: Update) => Promise<void>;
  onReview: (
    update: Update,
    analysis: Analysis,
    payment: boolean,
  ) => Promise<void>;
  onRetain: (update: Update, retain: boolean) => Promise<void>;
  onDismiss: (update: Update) => Promise<void>;
};
export default function InboxView({
  state,
  demo,
  weddingId,
  busy,
  onUpload,
  onText,
  onAnalyze,
  onReview,
  onRetain,
  onDismiss,
}: Props) {
  const [target, setTarget] = useState(
      weddingId || state.weddings.find((w) => !w.archived)?.id || "",
    ),
    [selected, setSelected] = useState<string | null>(null),
    [text, setText] = useState(""),
    [dragging, setDragging] = useState(false),
    [url, setUrl] = useState<string | null>(null),
    [payment, setPayment] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<Analysis | null>(null),
    [working, setWorking] = useState(false),
    [filter, setFilter] = useState<"pending" | "all">("pending"),
    [, setExpiryTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const updates = state.updates
    .filter(
      (u) =>
        (!weddingId || u.weddingId === weddingId) &&
        (filter === "all" || u.status === "pending" || u.status === "ready"),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const current = state.updates.find(
    (u) => u.id === (selected ?? updates[0]?.id),
  );
  useEffect(() => {
    setDraft(current?.analysis ?? null);
    setPayment(false);
    setError("");
    setText("");
  }, [current?.id, current?.status]);
  useEffect(() => {
    let alive = true,
      objectUrl: string | undefined;
    setUrl(null);
    if (current?.source === "image" && !imageExpired(current)) {
      if (demo) {
        getImage(current.id)
          .then((blob) => {
            if (blob && alive) {
              objectUrl = URL.createObjectURL(blob);
              setUrl(objectUrl);
            }
          })
          .catch(() => {});
      } else setUrl(`/api/screenshots/${current.id}`);
    }
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [current?.id, current?.retained, current?.imageDeleted, demo]);
  useEffect(() => {
    if (!current || current.retained || current.source !== "image") return;
    const delay = Date.parse(current.expiresAt) - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => {
      setUrl(null);
      setExpiryTick((n) => n + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [current?.id, current?.retained, current?.expiresAt]);
  async function upload(file?: File) {
    if (!file || working) return;
    setError("");
    if (!target) {
      setError("Thêm hoặc chọn đám cưới trước khi tải ảnh.");
      return;
    }
    setWorking(true);
    try {
      const id = await onUpload(file, target);
      if (id) {
        setFilter("all");
        setSelected(id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        e.preventDefault();
        void upload(file);
      }
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [target, working, state]);
  async function addText(sample = false) {
    const content = sample
      ? "Chốt decor 35 triệu. Chuyển thêm 5 triệu trước 20/11 giúp em nhé."
      : text;
    if (!content.trim()) return;
    setWorking(true);
    setError("");
    try {
      const id = await onText(
        content,
        target,
        current?.status === "pending" && current.source === "image"
          ? current.id
          : undefined,
      );
      if (id) {
        setFilter("all");
        setSelected(id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  const disabled = busy || working,
    reviewed =
      current?.status === "reviewed" || current?.status === "dismissed";
  return (
    <div className="inbox-layout">
      <div className="stack">
        <section className="panel">
          <div className="section-head">
            <h2>Thêm ảnh</h2>
            <ImagePlus size={17} className="muted" />
          </div>
          <label className="field" style={{ marginBottom: 15 }}>
            Đám cưới
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={Boolean(weddingId)}
            >
              <option value="">Chọn đám cưới</option>
              {state.weddings
                .filter((w) => !w.archived)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.couple}
                  </option>
                ))}
            </select>
          </label>
          <label
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void upload(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              disabled={disabled}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Upload size={29} />
            <strong>{working ? "Đang xử lý…" : "Chọn hoặc thả ảnh"}</strong>
            <p>JPG, PNG, WebP · 5 MB · Ctrl/Cmd + V</p>
          </label>
          <div className="retention">
            <ShieldCheck size={13} />
            {demo ? "Lưu trên thiết bị" : "Chỉ đội ngũ được xem"}
          </div>
          <div className="retention">
            <Clock3 size={13} />
            Hết hạn sau 48 giờ
          </div>
          <details className="input-details" open={demo || undefined}>
            <summary>Dán nội dung</summary>
            <label className="field">
              <span className="sr-only">Nội dung trao đổi</span>
              <textarea
                rows={3}
                maxLength={12000}
                placeholder="Chốt decor 35 triệu, cọc 10 triệu trước 20/11…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
            <div className="between" style={{ marginTop: 12 }}>
              <button
                className="btn small"
                disabled={disabled || !text.trim() || !target}
                onClick={() => void addText()}
              >
                <FileText size={14} />
                Tạo đề xuất
              </button>
              {demo && (
                <button
                  className="text-link"
                  disabled={disabled || !target}
                  onClick={() => void addText(true)}
                >
                  Dùng mẫu
                </button>
              )}
            </div>
            {demo && (
              <p className="field-hint">
                AI đọc ảnh chưa bật. Dùng nội dung để thử.
              </p>
            )}
          </details>
          {error && (
            <div
              className="notice error"
              style={{ marginTop: 14 }}
              role="alert"
            >
              {error}
            </div>
          )}
        </section>
        <section>
          <div className="section-head">
            <h2>Cập nhật</h2>
            <button
              className="text-link"
              onClick={() => setFilter(filter === "all" ? "pending" : "all")}
            >
              {filter === "all" ? "Cần xử lý" : "Xem tất cả"}
            </button>
          </div>
          {updates.length ? (
            updates.map((u) => (
              <button
                className={`inbox-item ${current?.id === u.id ? "active" : ""}`}
                key={u.id}
                onClick={() => setSelected(u.id)}
              >
                {u.source === "image" ? (
                  <ImagePlus size={19} className="muted" />
                ) : (
                  <FileText size={19} className="muted" />
                )}
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{u.filename}</strong>
                  <small>
                    {state.weddings.find((w) => w.id === u.weddingId)?.couple} ·{" "}
                    {u.status === "reviewed"
                      ? "Đã xác nhận"
                      : u.status === "dismissed"
                        ? "Đã bỏ qua"
                        : u.status === "ready"
                          ? "Cần xác nhận"
                          : "Chờ đọc nội dung"}
                  </small>
                </span>
                {u.status === "reviewed" && (
                  <Check size={14} style={{ color: "var(--green)" }} />
                )}
              </button>
            ))
          ) : (
            <p className="muted" style={{ fontSize: 12, padding: "10px 0" }}>
              Chưa có cập nhật trong mục này.
            </p>
          )}
        </section>
      </div>
      <section className="panel">
        {!current ? (
          <Empty
            title="Mỗi cập nhật đều có bước tiếp theo"
            description="Thêm ảnh hoặc nội dung để bắt đầu xem đề xuất."
          />
        ) : (
          <>
            <div className="review-header">
              <div>
                <h2>{reviewed ? "Đã xử lý" : "Xác nhận cập nhật"}</h2>
                <p>
                  {
                    state.weddings.find((w) => w.id === current.weddingId)
                      ?.couple
                  }{" "}
                  · {current.filename}
                </p>
              </div>
              <span
                className={`badge ${draft?.confidence === "low" ? "orange" : ""}`}
              >
                {reviewed
                  ? "Đã xử lý"
                  : draft
                    ? "Cần kiểm tra"
                    : "Chưa phân tích"}
              </span>
            </div>
            {url && (
              <img src={url} className="image-preview" alt={current.filename} />
            )}{" "}
            {current.source === "image" && imageExpired(current) && (
              <div className="notice">
                Ảnh đã hết hạn. Các thông tin đã xác nhận vẫn được giữ.
              </div>
            )}
            {current.source === "image" && !imageExpired(current) && (
              <div
                className="between"
                style={{ marginTop: 12, alignItems: "flex-start" }}
              >
                <span className="retention" style={{ margin: 0 }}>
                  <Clock3 size={13} />
                  {current.retained
                    ? "Đang giữ làm chứng từ"
                    : `Hết hạn ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(current.expiresAt))}`}
                </span>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={current.retained}
                    disabled={disabled}
                    onChange={(e) =>
                      void onRetain(current, e.target.checked).catch((e) =>
                        setError(e.message),
                      )
                    }
                  />
                  Giữ làm chứng từ
                </label>
              </div>
            )}
            {!draft && !reviewed && (
              <div style={{ marginTop: 24 }}>
                <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                  Đọc ảnh, kiểm tra rồi xác nhận.
                </p>
                <button
                  className="btn primary"
                  disabled={disabled || imageExpired(current) || demo}
                  onClick={async () => {
                    setWorking(true);
                    try {
                      await onAnalyze(current);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setWorking(false);
                    }
                  }}
                >
                  {working ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  Phân tích ảnh
                </button>
                {demo && (
                  <div className="notice" style={{ marginTop: 16 }}>
                    AI đọc ảnh chưa bật. Dán nội dung để thử.
                  </div>
                )}
              </div>
            )}
            {draft && (
              <>
                <div className="source-quote">
                  <span className="eyebrow" style={{ fontSize: 9 }}>
                    Nội dung tham chiếu
                  </span>
                  <p style={{ marginTop: 6 }}>
                    {draft.excerpt || draft.summary}
                  </p>
                </div>
                {draft.warnings.map((w, i) => (
                  <div className="notice" key={i} style={{ marginBottom: 10 }}>
                    {w}
                  </div>
                ))}
                <fieldset
                  disabled={reviewed || disabled}
                  style={{ border: 0, padding: 0, margin: "19px 0 0" }}
                >
                  <div className="fields">
                    <label className="field">
                      Nhà cung cấp
                      <input
                        list="vendor-options"
                        maxLength={160}
                        value={draft.vendorName ?? ""}
                        placeholder="Chọn hoặc nhập tên"
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            vendorName: e.target.value || null,
                          })
                        }
                      />
                      <datalist id="vendor-options">
                        {state.vendors
                          .filter((v) => v.weddingId === current.weddingId)
                          .map((v) => (
                            <option key={v.id} value={v.name} />
                          ))}
                      </datalist>
                    </label>
                    <label className="field">
                      Hạng mục
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          setDraft({ ...draft, category: e.target.value })
                        }
                      >
                        {categoryLabels.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Trạng thái
                      <select
                        value={draft.dealStatus ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dealStatus:
                              (e.target.value as Analysis["dealStatus"]) ||
                              null,
                          })
                        }
                      >
                        <option value="">Chưa xác định</option>
                        {Object.entries(dealLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Đã chốt (₫)
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={draft.agreedAmount ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            agreedAmount: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Báo giá (₫)
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={draft.quotedAmount ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            quotedAmount: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Sắp trả (₫)
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={draft.nextPayment ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            nextPayment: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Hạn xử lý
                      <input
                        type="date"
                        value={draft.dueDate ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dueDate: e.target.value || null,
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Người phụ trách
                      <select
                        value={draft.ownerName ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            ownerName: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Chưa phân công</option>
                        {state.members.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field" style={{ gridColumn: "1/-1" }}>
                      Tạo công việc
                      <input
                        maxLength={200}
                        placeholder="Để trống nếu không cần tạo công việc"
                        value={draft.taskTitle ?? ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            taskTitle: e.target.value || null,
                          })
                        }
                      />
                    </label>
                    {draft.paymentAmount !== null && (
                      <label className="field">
                        Khoản báo đã trả (₫)
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={draft.paymentAmount}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              paymentAmount: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    )}
                  </div>
                  {draft.paymentAmount !== null && draft.paymentAmount > 0 && (
                    <div className="notice" style={{ marginTop: 17 }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={payment}
                          onChange={(e) => setPayment(e.target.checked)}
                        />
                        Tôi đã kiểm tra khoản thanh toán này và xác nhận chưa
                        được ghi nhận trước đó.
                      </label>
                      <p style={{ fontSize: 11, marginTop: 7 }}>
                        Chỉ khi được xác nhận, khoản này mới cộng vào tổng đã
                        thanh toán.
                      </p>
                    </div>
                  )}
                </fieldset>
                {!reviewed && (
                  <div className="review-footer">
                    <button
                      className="btn small"
                      disabled={disabled}
                      onClick={() =>
                        void onDismiss(current).catch((e) =>
                          setError(e.message),
                        )
                      }
                    >
                      Bỏ qua
                    </button>
                    <button
                      className="btn primary"
                      disabled={disabled}
                      onClick={async () => {
                        try {
                          setError("");
                          await onReview(
                            current,
                            analysisSchema.parse(draft),
                            payment,
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "Thông tin chưa hợp lệ.",
                          );
                        }
                      }}
                    >
                      <Check size={15} />
                      Xác nhận cập nhật
                    </button>
                  </div>
                )}
                {reviewed && (
                  <p className="muted" style={{ marginTop: 20, fontSize: 12 }}>
                    Cập nhật này đã được xử lý. Mỗi nguồn chỉ được ghi nhận một
                    lần.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
