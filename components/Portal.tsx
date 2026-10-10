import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  CheckCheck,
  MailOpen,
  ExternalLink,
} from "lucide-react";
import type { Wedding, Task } from "@/lib/types";
import { dateLabel } from "@/lib/domain";

export type PortalGuests = {
  attendingPeople: number;
  responses: number;
  declined: number;
};
export default function Portal({
  wedding,
  tasks,
  teamName,
  demo = false,
  guests = null,
  inviteUrl = null,
}: {
  wedding: Wedding;
  tasks: Task[];
  teamName: string;
  demo?: boolean;
  guests?: PortalGuests | null;
  inviteUrl?: string | null;
}) {
  const done = tasks.filter((t) => t.done).length,
    progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <main className="portal">
      <div className="between">
        <Link href="/" className="logo">
          <span className="logo-mark">
            <CheckCheck size={21} />
          </span>
          wedly.
        </Link>
        <span className="badge neutral">
          {demo ? "Minh họa trên trình duyệt" : "Cổng thông tin khách hàng"}
        </span>
      </div>
      <header className="portal-header">
        <span className="eyebrow">Một ngày đặc biệt, cùng chuẩn bị</span>
        <h1>{wedding.couple}</h1>
        <div className="detail-meta">
          <span className="row">
            <CalendarDays size={15} />
            {dateLabel(wedding.date)}
          </span>
          <span className="row">
            <MapPin size={15} />
            {wedding.venue || "Địa điểm đang được chuẩn bị"}
          </span>
          <span className="row">
            <Users size={15} />
            {wedding.guestCount} khách dự kiến
          </span>
        </div>
      </header>
      <div className="portal-grid">
        <section className="panel">
          <h2>Tiến độ chuẩn bị</h2>
          <div className="between" style={{ margin: "20px 0 10px" }}>
            <span className="muted">
              {done} / {tasks.length} công việc đã hoàn thành
            </span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-line" style={{ height: 7 }}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 22 }}>
            Đội ngũ {teamName} đang đồng hành cùng bạn trong từng bước chuẩn bị.
          </p>
        </section>
        <section className="panel">
          <h2>Thông tin ngày cưới</h2>
          <div className="payment-row">
            <span>Ngày cưới</span>
            <strong>{dateLabel(wedding.date)}</strong>
          </div>
          <div className="payment-row">
            <span>Địa điểm</span>
            <strong style={{ textAlign: "right", maxWidth: 200 }}>
              {wedding.venue || "Chưa xác nhận"}
            </strong>
          </div>
          <div className="payment-row">
            <span>Người phụ trách</span>
            <strong>{wedding.lead || "Đội ngũ điều phối"}</strong>
          </div>
        </section>
        {(guests || inviteUrl) && (
          <section className="panel portal-guests">
            <div className="between">
              <h2>Khách mời</h2>
              <MailOpen size={18} className="muted" />
            </div>
            {guests && (
              <div className="portal-guest-stats">
                <div>
                  <strong>{guests.attendingPeople}</strong>
                  <span>người sẽ tham dự</span>
                </div>
                <div>
                  <strong>{guests.responses}</strong>
                  <span>phản hồi</span>
                </div>
                <div>
                  <strong>{guests.declined}</strong>
                  <span>không thể đến</span>
                </div>
              </div>
            )}
            {inviteUrl && (
              <a
                className="btn"
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
                Mở thiệp mời online
              </a>
            )}
          </section>
        )}
      </div>
      <div className="notice" style={{ marginTop: 25 }}>
        Nếu cần thay đổi thông tin hoặc có câu hỏi, hãy liên hệ trực tiếp với
        đội ngũ {teamName}.
      </div>
      {demo && (
        <p className="muted" style={{ fontSize: 11, marginTop: 15 }}>
          Đây là cổng minh họa, chỉ đọc dữ liệu trải nghiệm trong trình duyệt
          của bạn.
        </p>
      )}
    </main>
  );
}
