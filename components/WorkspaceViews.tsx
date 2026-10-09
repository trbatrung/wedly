"use client";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Wallet,
  ImagePlus,
  ArrowRight,
  MapPin,
  Users,
  Plus,
  Sparkles,
  CircleCheck,
  Pencil,
  Grid2X2,
} from "lucide-react";
import {
  money,
  shortMoney,
  today,
  dateLabel,
  daysUntil,
  progressFor,
  paidFor,
} from "@/lib/domain";
import {
  dealLabels,
  type Workspace,
  type Wedding,
  type Task,
  type Vendor,
  type View,
} from "@/lib/types";
import { Empty } from "./ui";

type Props = {
  state: Workspace;
  go: (view: View, weddingId?: string | null) => void;
  onTask: (task: Task) => void;
  busy: boolean;
};
export function WeddingCard({
  wedding,
  state,
  onClick,
}: {
  wedding: Wedding;
  state: Workspace;
  onClick: () => void;
}) {
  const days = daysUntil(wedding.date),
    progress = progressFor(state, wedding.id),
    taskCount = state.tasks.filter(
      (t) => t.weddingId === wedding.id && !t.done,
    ).length;
  return (
    <button className="wedding-card" onClick={onClick}>
      <div className="between">
        <span
          className={`badge ${days <= 30 && days >= 0 ? "orange" : "neutral"}`}
        >
          <span className="dot" style={{ background: wedding.color }} />
          {wedding.archived
            ? "Đã lưu trữ"
            : days < 0
              ? "Đã qua ngày cưới"
              : days === 0
                ? "Ngày cưới hôm nay"
                : `Còn ${days} ngày`}
        </span>
        <span className="wedding-date-tile">
          {dateLabel(wedding.date).slice(0, 5)}
        </span>
      </div>
      <h3>{wedding.couple}</h3>
      <div className="meta">
        <CalendarDays size={12} />
        {dateLabel(wedding.date)}
      </div>
      <div className="meta">
        <MapPin size={12} />
        {wedding.venue || "Chưa có địa điểm"}
      </div>
      <div
        className="between"
        style={{ marginTop: 17, fontSize: 10, color: "var(--muted)" }}
      >
        <span>Tiến độ công việc</span>
        <strong style={{ color: "var(--green)" }}>{progress}%</strong>
      </div>
      <div className="progress-line">
        <i style={{ width: `${progress}%`, background: wedding.color }} />
      </div>
      <div className="wedding-card-footer">
        <span className="row">
          <Users size={12} />
          {wedding.guestCount} khách<span style={{ margin: "0 3px" }}>·</span>
          {taskCount} việc còn lại
        </span>
        <span className="row">
          <span
            className="avatar"
            style={{ width: 22, height: 22, fontSize: 9 }}
          >
            {wedding.lead.slice(0, 1) || "?"}
          </span>
          <ChevronRight size={13} />
        </span>
      </div>
    </button>
  );
}
export function TaskRows({
  tasks,
  state,
  onTask,
  busy,
  full = false,
}: {
  tasks: Task[];
  state: Workspace;
  onTask: (task: Task) => void;
  busy: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "task-list-full" : ""}>
      {tasks.length === 0 ? (
        <Empty
          title="Không có công việc trong mục này"
          description="Mọi việc đã được xử lý hoặc chưa được tạo."
        />
      ) : (
        tasks.map((task) => (
          <div
            className={`task-row ${task.done ? "completed" : ""}`}
            key={task.id}
          >
            <button
              className={`check-button ${task.done ? "done" : ""}`}
              disabled={busy}
              aria-label={
                task.done
                  ? `Mở lại: ${task.title}`
                  : `Hoàn thành: ${task.title}`
              }
              onClick={() => onTask(task)}
            >
              {task.done && <Check size={12} />}
            </button>
            <div className="task-body">
              <div className="task-title">{task.title}</div>
              <div className="task-meta">
                <span
                  className="dot"
                  style={{
                    background: state.weddings.find(
                      (w) => w.id === task.weddingId,
                    )?.color,
                  }}
                />
                {state.weddings.find((w) => w.id === task.weddingId)?.couple}
                <span>·</span>
                <span>{task.owner || "Chưa phân công"}</span>
              </div>
            </div>
            <span
              className={`badge ${!task.done && task.dueDate && task.dueDate < today() ? "red" : task.dueDate === today() ? "orange" : "neutral"}`}
            >
              {task.done
                ? "Xong"
                : !task.dueDate
                  ? "Chưa có hạn"
                  : task.dueDate < today()
                    ? "Quá hạn"
                    : task.dueDate === today()
                      ? "Hôm nay"
                      : dateLabel(task.dueDate).slice(0, 5)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
export function Overview({ state, go, onTask, busy }: Props) {
  const date = today(),
    active = state.weddings.filter((w) => !w.archived),
    tasks = state.tasks.filter(
      (t) => !t.done && active.some((w) => w.id === t.weddingId),
    ),
    due = tasks
      .filter((t) => t.dueDate && t.dueDate <= date)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")),
    pending = state.updates.filter(
      (u) => u.status === "ready" || u.status === "pending",
    );
  const payments = state.vendors
    .filter(
      (v) =>
        v.nextAmount > 0 &&
        v.dueDate &&
        daysUntil(v.dueDate) >= 0 &&
        daysUntil(v.dueDate) <= 7 &&
        active.some((w) => w.id === v.weddingId),
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  return (
    <>
      <div className="stats">
        <div className="stat accent">
          <div className="stat-label">
            Đám cưới đang chuẩn bị
            <span className="stat-icon">
              <CalendarDays size={16} />
            </span>
          </div>
          <div className="stat-value">
            {active.length.toString().padStart(2, "0")}
          </div>
          <div className="stat-sub">
            {
              active.filter(
                (w) => daysUntil(w.date) >= 0 && daysUntil(w.date) <= 30,
              ).length
            }{" "}
            đám cưới trong 30 ngày tới
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            Việc cần xử lý hôm nay
            <span className="stat-icon">
              <Clock3 size={16} />
            </span>
          </div>
          <div className="stat-value">
            {due.length.toString().padStart(2, "0")}
          </div>
          <div className="stat-sub">
            <span style={{ color: "var(--red)" }}>
              {due.filter((t) => t.dueDate! < date).length} việc quá hạn
            </span>{" "}
            · {due.filter((t) => t.dueDate === date).length} việc đến hạn
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            Thanh toán trong 7 ngày
            <span className="stat-icon">
              <Wallet size={16} />
            </span>
          </div>
          <div className="stat-value">
            {shortMoney(payments.reduce((s, v) => s + v.nextAmount, 0))}
          </div>
          <div className="stat-sub">
            {payments.length} khoản dự kiến cần theo dõi
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            Cập nhật cần xác nhận
            <span className="stat-icon">
              <ImagePlus size={16} />
            </span>
          </div>
          <div className="stat-value">
            {pending.length.toString().padStart(2, "0")}
          </div>
          <div className="stat-sub">Từ ảnh trao đổi và nội dung đã nhập</div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <section>
            <div className="section-head">
              <h2>
                Đám cưới đang chuẩn bị{" "}
                <span
                  className="muted"
                  style={{ fontSize: 12, fontWeight: 400, marginLeft: 5 }}
                >
                  ({active.length})
                </span>
              </h2>
              <button className="text-link" onClick={() => go("weddings")}>
                Xem tất cả <ArrowRight size={13} />
              </button>
            </div>
            <div className="wedding-grid">
              {active
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4)
                .map((w) => (
                  <WeddingCard
                    key={w.id}
                    wedding={w}
                    state={state}
                    onClick={() => go("weddings", w.id)}
                  />
                ))}
            </div>
            {!active.length && (
              <div className="panel">
                <Empty
                  title="Bắt đầu với đám cưới đầu tiên"
                  description="Thêm cặp đôi, ngày cưới và người phụ trách để mở hồ sơ."
                />
              </div>
            )}
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Việc cần ưu tiên</h2>
              <button className="text-link" onClick={() => go("tasks")}>
                Tất cả công việc <ArrowRight size={13} />
              </button>
            </div>
            <TaskRows
              tasks={due.slice(0, 5)}
              state={state}
              onTask={onTask}
              busy={busy}
            />
          </section>
        </div>
        <div className="stack">
          <section className="quick-inbox">
            <span className="stat-icon" style={{ background: "#e1ebd2" }}>
              <Sparkles size={18} />
            </span>
            <h3>Một ảnh trao đổi. Rõ bước tiếp theo.</h3>
            <p>
              Thả ảnh vào đúng đám cưới, xem đề xuất và xác nhận cập nhật cho cả
              đội ngũ.
            </p>
            <button className="btn green small" onClick={() => go("inbox")}>
              <ImagePlus size={14} />
              Thêm ảnh trao đổi
            </button>
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Khoản thanh toán sắp tới</h2>
              <button
                className="icon-button"
                aria-label="Xem thanh toán"
                onClick={() => go("payments")}
              >
                <ArrowRight size={14} />
              </button>
            </div>
            {payments.length ? (
              payments.slice(0, 4).map((v) => (
                <div className="payment-row" key={v.id}>
                  <div>
                    <strong>{v.name}</strong>
                    <small>
                      {state.weddings.find((w) => w.id === v.weddingId)?.couple}{" "}
                      · {dateLabel(v.dueDate).slice(0, 5)}
                    </small>
                  </div>
                  <strong style={{ fontSize: 12 }}>
                    {money(v.nextAmount)}
                  </strong>
                </div>
              ))
            ) : (
              <p className="muted" style={{ fontSize: 12, padding: "12px 0" }}>
                Chưa có khoản đến hạn trong 7 ngày.
              </p>
            )}
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Hoạt động gần đây</h2>
              <CircleCheck size={16} className="muted" />
            </div>
            {state.activity.slice(0, 4).map((a) => (
              <div className="activity-row" key={a.id}>
                <span className="activity-dot" />
                <div>
                  {a.text}
                  <small>
                    {new Intl.DateTimeFormat("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(new Date(a.at))}
                  </small>
                </div>
              </div>
            ))}
            {!state.activity.length && (
              <p className="muted" style={{ fontSize: 12 }}>
                Các cập nhật của đội ngũ sẽ xuất hiện ở đây.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
export function VendorTable({
  state,
  vendors,
  onEdit,
}: {
  state: Workspace;
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
}) {
  return vendors.length ? (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>NHÀ CUNG CẤP</th>
            <th>TRẠNG THÁI</th>
            <th>ĐÃ CHỐT</th>
            <th>ĐÃ THANH TOÁN</th>
            <th>THANH TOÁN TIẾP</th>
            <th>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id}>
              <td>
                <strong>{v.name}</strong>
                <small>
                  {v.category} ·{" "}
                  {state.weddings.find((w) => w.id === v.weddingId)?.couple}
                </small>
              </td>
              <td>
                <span
                  className={`badge ${v.status === "negotiating" ? "orange" : v.status === "confirmed" ? "" : "neutral"}`}
                >
                  {dealLabels[v.status]}
                </span>
              </td>
              <td>
                {v.agreed ? money(v.agreed) : "Chưa chốt"}
                {v.quoted > 0 && <small>Báo giá {money(v.quoted)}</small>}
              </td>
              <td>
                {money(paidFor(state, v.id))}
                <small>
                  Còn {money(Math.max(0, v.agreed - paidFor(state, v.id)))}
                </small>
              </td>
              <td>
                {v.nextAmount ? money(v.nextAmount) : "—"}
                <small>
                  {v.dueDate ? dateLabel(v.dueDate) : "Chưa có hạn"}
                </small>
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Sửa ${v.name}`}
                  onClick={() => onEdit(v)}
                >
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Chưa có nhà cung cấp"
      description="Thêm nhà cung cấp hoặc xác nhận thông tin từ một ảnh trao đổi."
    />
  );
}
