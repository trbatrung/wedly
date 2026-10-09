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
    progress = progressFor(state, wedding.id);
  const remaining = state.tasks.filter(
    (t) => t.weddingId === wedding.id && !t.done,
  ).length;
  return (
    <button className="wedding-card compact-card" onClick={onClick}>
      <div className="between">
        <h3>
          <span className="dot" style={{ background: wedding.color }} />
          {wedding.couple}
        </h3>
        <ChevronRight size={15} className="muted" />
      </div>
      <p className="card-venue" title={wedding.venue}>
        {wedding.venue || "Chưa có địa điểm"}
      </p>
      <div className="compact-card-meta">
        <span>
          <CalendarDays size={13} />
          {dateLabel(wedding.date).slice(0, 5)}
        </span>
        <span>
          <Users size={13} />
          {wedding.guestCount}
        </span>
        <span className="badge neutral">
          {wedding.archived
            ? "Lưu trữ"
            : days < 0
              ? "Đã qua"
              : days === 0
                ? "Hôm nay"
                : `${days} ngày`}
        </span>
      </div>
      <div className="compact-card-progress">
        <div className="progress-line">
          <i style={{ width: `${progress}%`, background: wedding.color }} />
        </div>
        <span>{remaining} việc</span>
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
export function Overview({
  state,
  go,
  onTask,
  busy,
  onNewTask,
}: Props & { onNewTask: () => void }) {
  const date = today(),
    active = state.weddings.filter((w) => !w.archived);
  const tasks = state.tasks
    .filter((t) => !t.done && active.some((w) => w.id === t.weddingId))
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));
  const due = tasks.filter((t) => t.dueDate && t.dueDate <= date);
  const pending = state.updates.filter(
    (u) => u.status === "ready" || u.status === "pending",
  );
  const pendingWeddings = active.filter((w) =>
    pending.some((u) => u.weddingId === w.id),
  );
  const payments = state.vendors
    .filter(
      (v) =>
        v.nextAmount > 0 &&
        v.dueDate &&
        daysUntil(v.dueDate) <= 7 &&
        active.some((w) => w.id === v.weddingId),
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  return (
    <>
      <div className="overview-metrics" aria-label="Tóm tắt hôm nay">
        <button onClick={() => go("weddings")}>
          <CalendarDays size={17} />
          <strong>{active.length}</strong>
          <span>Đám cưới</span>
          <ChevronRight size={13} />
        </button>
        <button onClick={() => go("tasks")}>
          <ListTodoIcon />
          <strong>{due.length}</strong>
          <span>Đến hạn</span>
          <ChevronRight size={13} />
        </button>
        <button onClick={() => go("inbox")}>
          <ImagePlus size={17} />
          <strong>{pending.length}</strong>
          <span>Chờ duyệt</span>
          <ChevronRight size={13} />
        </button>
        <button
          onClick={() => go("payments")}
          title="Khoản dự kiến đến hạn trong 7 ngày, gồm cả khoản quá hạn"
        >
          <Wallet size={17} />
          <strong>
            {shortMoney(payments.reduce((sum, v) => sum + v.nextAmount, 0))}
          </strong>
          <span>Sắp trả</span>
          <ChevronRight size={13} />
        </button>
      </div>
      <div className="dashboard-grid quiet-dashboard">
        <div className="stack">
          <section className="panel">
            <div className="section-head">
              <h2>Việc cần làm</h2>
              <div className="row">
                <button className="text-link" onClick={() => go("tasks")}>
                  Tất cả <ArrowRight size={13} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Thêm công việc"
                  onClick={onNewTask}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
            <TaskRows
              tasks={tasks.slice(0, 4)}
              state={state}
              onTask={onTask}
              busy={busy}
            />
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>
                Đám cưới <span className="section-count">{active.length}</span>
              </h2>
              <button className="text-link" onClick={() => go("weddings")}>
                Tất cả <ArrowRight size={13} />
              </button>
            </div>
            <div className="wedding-rows">
              {active
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4)
                .map((w) => (
                  <button
                    className="wedding-row"
                    key={w.id}
                    onClick={() => go("weddings", w.id)}
                  >
                    <span
                      className="wedding-day"
                      style={{ borderLeftColor: w.color }}
                    >
                      <strong>{w.date.slice(8, 10)}</strong>
                      <small>TH {w.date.slice(5, 7)}</small>
                    </span>
                    <span className="wedding-row-name">
                      <strong>{w.couple}</strong>
                      <small>{w.venue || "Chưa có địa điểm"}</small>
                    </span>
                    <span
                      className="wedding-row-progress"
                      title={`${progressFor(state, w.id)}% công việc hoàn thành`}
                    >
                      <span className="progress-line">
                        <i
                          style={{
                            width: `${progressFor(state, w.id)}%`,
                            background: w.color,
                          }}
                        />
                      </span>
                      <small>{progressFor(state, w.id)}%</small>
                    </span>
                    <span className="avatar" title={w.lead}>
                      {w.lead.slice(0, 1) || "?"}
                    </span>
                    <ChevronRight size={14} className="muted" />
                  </button>
                ))}
            </div>
            {!active.length && <Empty title="Chưa có đám cưới" />}
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <div className="section-head">
              <h2>
                Chờ duyệt{" "}
                <span className="section-count">{pending.length}</span>
              </h2>
              <button className="btn small" onClick={() => go("inbox")}>
                <Plus size={13} />
                Thêm ảnh
              </button>
            </div>
            {pendingWeddings.length ? (
              pendingWeddings.slice(0, 3).map((w) => (
                <button
                  className="pending-row"
                  key={w.id}
                  onClick={() => go("inbox", w.id)}
                >
                  <span className="pending-icon">
                    <ImagePlus size={18} />
                  </span>
                  <span>
                    <strong>{w.couple}</strong>
                    <small>
                      {pending.filter((u) => u.weddingId === w.id).length} cập
                      nhật
                    </small>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))
            ) : (
              <p className="quiet-empty">
                <Check size={15} />
                Đã xử lý hết
              </p>
            )}
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Sắp thanh toán</h2>
              <button className="text-link" onClick={() => go("payments")}>
                Tất cả <ArrowRight size={13} />
              </button>
            </div>
            {payments.length ? (
              payments.slice(0, 3).map((v) => (
                <button
                  className="payment-row payment-link"
                  key={v.id}
                  onClick={() => go("payments", v.weddingId)}
                >
                  <span>
                    <strong>{v.name}</strong>
                    <small>
                      {state.weddings.find((w) => w.id === v.weddingId)?.couple}{" "}
                      · {dateLabel(v.dueDate).slice(0, 5)}
                    </small>
                  </span>
                  <strong>{money(v.nextAmount)}</strong>
                </button>
              ))
            ) : (
              <p className="quiet-empty">Chưa có khoản đến hạn</p>
            )}
          </section>
          <section className="panel">
            <div className="section-head">
              <h2>Mới cập nhật</h2>
            </div>
            {state.activity.slice(0, 2).map((a) => (
              <div className="activity-row" key={a.id}>
                <span className="activity-dot" />
                <div>
                  <p className="activity-title" title={a.text}>
                    {a.text}
                  </p>
                  <small>
                    {new Intl.DateTimeFormat("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Ho_Chi_Minh",
                    }).format(new Date(a.at))}
                  </small>
                </div>
              </div>
            ))}
            {!state.activity.length && (
              <p className="quiet-empty">Chưa có hoạt động</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
function ListTodoIcon() {
  return <Clock3 size={17} />;
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
