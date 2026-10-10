"use client";
import { useState, type FormEvent } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Grid2X2,
  LoaderCircle,
  MailOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Modal, Empty } from "../ui";
import { normalize, today } from "@/lib/domain";
import { rsvpCsv, rsvpSummary } from "@/lib/invitation";
import {
  rsvpSchema,
  sideLabels,
  type Invitation,
  type Rsvp,
  type Wedding,
} from "@/lib/types";

type Filter = "all" | "yes" | "no" | "diet";
export default function GuestList({
  wedding,
  invitation,
  rsvps,
  inviteUrl,
  loadError,
  onOpenInvite,
  onOpenFloorplan,
  onSave,
  onDelete,
  notify,
}: {
  wedding: Wedding;
  invitation?: Invitation;
  rsvps: Rsvp[];
  inviteUrl: string | null;
  loadError: string;
  onOpenInvite: () => void;
  onOpenFloorplan: () => void;
  onSave: (rsvp: Rsvp) => Promise<void>;
  onDelete: (rsvp: Rsvp) => Promise<void>;
  notify: (text: string, error?: boolean) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState<Rsvp | "new" | null>(null),
    [working, setWorking] = useState(false),
    [formError, setFormError] = useState("");
  const summary = rsvpSummary(rsvps);
  const confirmedShare = wedding.guestCount
    ? Math.min(
        100,
        Math.round((summary.attendingPeople / wedding.guestCount) * 100),
      )
    : 0;
  const shown = rsvps
    .filter((r) =>
      filter === "yes"
        ? r.attending
        : filter === "no"
          ? !r.attending
          : filter === "diet"
            ? r.attending && Boolean(r.dietary)
            : true,
    )
    .filter(
      (r) =>
        !query ||
        normalize(`${r.name} ${r.guestNames} ${r.phone}`).includes(
          normalize(query),
        ),
    );
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([rsvpCsv(rsvps)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `khach-moi-${wedding.id}-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = new FormData(event.currentTarget),
      str = (k: string) => String(form.get(k) ?? "").trim();
    const attending = str("attending") === "yes";
    const now = new Date().toISOString();
    const base = editing && editing !== "new" ? editing : null;
    const parsed = rsvpSchema.safeParse({
      id: base?.id ?? crypto.randomUUID(),
      weddingId: wedding.id,
      name: str("name"),
      phone: str("phone"),
      attending,
      guests: attending ? Number(str("guests") || 0) : 0,
      guestNames: attending ? str("guestNames") : "",
      side: str("side"),
      dietary: attending ? str("dietary") : "",
      message: str("message"),
      source: "manual",
      createdAt: base?.createdAt ?? now,
      updatedAt: now,
    });
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Kiểm tra lại thông tin khách.",
      );
      return;
    }
    setWorking(true);
    try {
      await onSave(parsed.data);
      setEditing(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setWorking(false);
    }
  }
  const current = editing && editing !== "new" ? editing : null;
  return (
    <div className="stack guests">
      <section className="panel invite-strip">
        <span className="invite-strip-icon">
          <MailOpen size={18} />
        </span>
        <div className="invite-strip-text">
          <strong>
            {!invitation
              ? "Chưa có thiệp mời online"
              : invitation.published
                ? "Thiệp đang mở"
                : "Thiệp đang là bản nháp"}
          </strong>
          <small>
            {!invitation
              ? "Tạo thiệp để khách tự xác nhận tham dự."
              : (inviteUrl ?? "Đăng thiệp để có liên kết gửi khách.")}
          </small>
        </div>
        <div className="row">
          {inviteUrl && (
            <>
              <button
                className="icon-button"
                aria-label="Sao chép liên kết thiệp"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(inviteUrl)
                    .then(() => notify("Đã sao chép liên kết thiệp."))
                }
              >
                <Copy size={14} />
              </button>
              <a
                className="icon-button"
                aria-label="Mở thiệp"
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
              </a>
            </>
          )}
          <button className="btn small" onClick={onOpenInvite}>
            {invitation ? "Sửa thiệp" : "Tạo thiệp"}
          </button>
        </div>
      </section>
      {loadError && <div className="notice error">{loadError}</div>}
      <div className="stats guest-stats">
        <div className="stat">
          <div className="stat-label">Sẽ tham dự</div>
          <div className="stat-value">{summary.attendingPeople}</div>
          <div className="stat-sub">{summary.attendingParties} phản hồi</div>
        </div>
        <div className="stat">
          <div className="stat-label">Không đến</div>
          <div className="stat-value">{summary.declined}</div>
          <div className="stat-sub">phản hồi</div>
        </div>
        <div className="stat">
          <div className="stat-label">Dự kiến</div>
          <div className="stat-value">{wedding.guestCount}</div>
          <div className="progress-line">
            <i
              style={{ width: `${confirmedShare}%`, background: wedding.color }}
            />
          </div>
          <div className="stat-sub">{confirmedShare}% đã xác nhận</div>
        </div>
        <button className="stat stat-link" onClick={onOpenFloorplan}>
          <div className="stat-label">
            Bàn cần
            <Grid2X2 size={13} />
          </div>
          <div className="stat-value">{summary.tables}</div>
          <div className="stat-sub">10 khách/bàn · Mở sơ đồ</div>
        </button>
      </div>
      <section className="panel">
        <div className="guest-toolbar">
          <div className="filters" style={{ margin: 0 }}>
            {(
              [
                ["all", `Tất cả ${rsvps.length}`],
                ["yes", `Tham dự ${summary.attendingParties}`],
                ["no", `Không đến ${summary.declined}`],
                ["diet", `Ăn uống ${summary.dietary}`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={`filter ${filter === id ? "active" : ""}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="filter-search">
            <Search size={14} />
            <input
              placeholder="Tìm khách…"
              aria-label="Tìm khách"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="row guest-actions">
            <button
              className="btn small"
              disabled={!rsvps.length}
              onClick={exportCsv}
            >
              <Download size={13} />
              CSV
            </button>
            <button
              className="btn small primary"
              onClick={() => {
                setFormError("");
                setEditing("new");
              }}
            >
              <UserPlus size={13} />
              Thêm khách
            </button>
          </div>
        </div>
        {(summary.bride > 0 || summary.groom > 0) && (
          <p className="guest-sides">
            Nhà trai <strong>{summary.groom}</strong> · Nhà gái{" "}
            <strong>{summary.bride}</strong>
            {summary.dietary > 0 && (
              <>
                {" "}
                · Ăn uống riêng <strong>{summary.dietary}</strong>
              </>
            )}
          </p>
        )}
        {shown.length ? (
          <div className="guest-list">
            {shown.map((r) => (
              <div className="guest-row" key={r.id}>
                <span
                  className={`guest-count ${r.attending ? "yes" : "no"}`}
                  title={r.attending ? `${1 + r.guests} người` : "Không đến"}
                >
                  {r.attending ? 1 + r.guests : "—"}
                </span>
                <div className="guest-body">
                  <div className="guest-name">
                    <strong>{r.name}</strong>
                    {r.side && (
                      <span className="badge neutral">
                        {sideLabels[r.side]}
                      </span>
                    )}
                    {r.dietary && (
                      <span className="badge orange">{r.dietary}</span>
                    )}
                    {r.source === "manual" && (
                      <span className="badge purple">Nhập tay</span>
                    )}
                  </div>
                  <small>
                    {[
                      r.attending ? null : "Không thể đến",
                      r.guestNames && `Cùng: ${r.guestNames}`,
                      r.phone,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sẽ tham dự"}
                  </small>
                  {r.message && <p className="guest-message">“{r.message}”</p>}
                </div>
                <time className="guest-time">
                  {new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    timeZone: "Asia/Ho_Chi_Minh",
                  })
                    .format(new Date(r.updatedAt))
                    .slice(0, 5)}
                </time>
                <div className="guest-row-actions">
                  {r.source === "manual" && (
                    <button
                      className="icon-button"
                      aria-label={`Sửa ${r.name}`}
                      onClick={() => {
                        setFormError("");
                        setEditing(r);
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    aria-label={`Xóa ${r.name}`}
                    onClick={() => {
                      if (window.confirm(`Xóa câu trả lời của ${r.name}?`))
                        void onDelete(r).catch((e) =>
                          notify((e as Error).message, true),
                        );
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={
              rsvps.length ? "Không có khách phù hợp" : "Chưa có khách xác nhận"
            }
            description={
              rsvps.length
                ? "Thử bộ lọc hoặc từ khóa khác."
                : "Gửi liên kết thiệp cho cô dâu chú rể. Khách gọi điện xác nhận thì bấm Thêm khách."
            }
          />
        )}
      </section>
      {editing && (
        <Modal
          title={current ? `Sửa ${current.name}` : "Thêm khách xác nhận"}
          onClose={() => {
            if (!working) setEditing(null);
          }}
        >
          <form onSubmit={submit}>
            <div className="fields">
              <label className="field span-2">
                Họ và tên
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={current?.name}
                />
              </label>
              <label className="field">
                Tham dự
                <select
                  name="attending"
                  defaultValue={current && !current.attending ? "no" : "yes"}
                >
                  <option value="yes">Sẽ tham dự</option>
                  <option value="no">Không thể đến</option>
                </select>
              </label>
              <label className="field">
                Người đi cùng
                <input
                  name="guests"
                  type="number"
                  min={0}
                  max={10}
                  defaultValue={current?.guests ?? 0}
                />
              </label>
              <label className="field">
                Khách của
                <select name="side" defaultValue={current?.side ?? ""}>
                  <option value="">Chưa rõ</option>
                  <option value="groom">Nhà trai</option>
                  <option value="bride">Nhà gái</option>
                </select>
              </label>
              <label className="field">
                Điện thoại
                <input
                  name="phone"
                  maxLength={30}
                  inputMode="tel"
                  defaultValue={current?.phone}
                />
              </label>
              <label className="field span-2">
                Tên người đi cùng
                <input
                  name="guestNames"
                  maxLength={500}
                  defaultValue={current?.guestNames}
                />
              </label>
              <label className="field span-2">
                Ăn uống
                <input
                  name="dietary"
                  maxLength={300}
                  placeholder="Ăn chay, dị ứng…"
                  defaultValue={current?.dietary}
                />
              </label>
              <label className="field span-2">
                Ghi chú
                <textarea
                  name="message"
                  rows={2}
                  maxLength={1000}
                  defaultValue={current?.message}
                />
              </label>
            </div>
            {formError && (
              <div
                className="notice error"
                role="alert"
                style={{ marginTop: 16 }}
              >
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn"
                type="button"
                disabled={working}
                onClick={() => setEditing(null)}
              >
                Hủy
              </button>
              <button className="btn primary" disabled={working}>
                {working ? (
                  <LoaderCircle size={15} className="spin" />
                ) : (
                  <Plus size={15} />
                )}
                Lưu khách
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
