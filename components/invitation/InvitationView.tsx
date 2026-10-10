"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  LoaderCircle,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  Shirt,
  X,
} from "lucide-react";
import { inviteFontVariables } from "@/lib/fonts";
import { daysUntil, dateLabel } from "@/lib/domain";
import {
  calendarEvent,
  inviteStyle,
  rsvpStatus,
  splitNames,
  type PublicInvitation,
} from "@/lib/invitation";
import {
  rsvpInputSchema,
  type InviteSection,
  type RsvpInput,
} from "@/lib/types";
import { recallAnswer, rememberAnswer } from "@/lib/rsvp-store";
import { usePhoto } from "@/lib/invite-photos";

type Mode = "live" | "demo" | "preview";
const WEEKDAYS = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];
const weekday = (date: string) =>
  WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
const longDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return `${weekday(date)}, ${d} tháng ${m}, ${y}`;
};

export default function InvitationView({
  invite,
  mode,
  answerScope,
  onSubmit,
  notice,
}: {
  invite: PublicInvitation;
  mode: Mode;
  answerScope: string;
  onSubmit?: (answer: RsvpInput) => Promise<void>;
  notice?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const preview = mode === "preview";
  const [first, second] = splitNames(invite.names);
  const status = rsvpStatus(invite);
  const [viewer, setViewer] = useState<number | null>(null);
  const cover = usePhoto(invite.coverUrl);
  const shown = (section: InviteSection) => !invite.hidden.includes(section);
  const has = {
    message: shown("message") && Boolean(invite.message),
    schedule: shown("schedule") && invite.events.length > 0,
    venue: shown("venue") && Boolean(invite.venueName || invite.venueAddress),
    gallery: shown("gallery") && invite.gallery.length > 0,
    rsvp: status !== "off",
    faq: shown("faq") && invite.faqs.length > 0,
    thanks: shown("thanks") && Boolean(invite.giftNote),
  };
  const sections = (
    [
      ["schedule", "Lịch trình"],
      ["venue", "Địa điểm"],
      ["gallery", "Album"],
      ["rsvp", "Xác nhận"],
      ["faq", "Hỏi đáp"],
    ] as const
  ).filter(([id]) => has[id]);
  const jump = (id: string) =>
    root.current
      ?.querySelector(`[data-section="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  // Gentle reveal on scroll; content stays visible if scripts never run.
  useEffect(() => {
    if (preview || !root.current || !("IntersectionObserver" in window)) return;
    const node = root.current;
    node.dataset.reveal = "on";
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    node.querySelectorAll(".inv-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [preview]);
  const calendar = calendarEvent(invite);
  function downloadIcs() {
    const url = URL.createObjectURL(
      new Blob([calendar.ics], { type: "text/calendar;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "dam-cuoi.ics";
    a.click();
    URL.revokeObjectURL(url);
  }
  const count = invite.gallery.length;
  return (
    <div
      ref={root}
      className={`inv inv-font-${invite.font} inv-align-${invite.align} ${inviteFontVariables} ${preview ? "inv-preview" : ""}`}
      style={inviteStyle(invite.theme, invite.accent) as CSSProperties}
    >
      {mode === "demo" && (
        <div className="inv-demo-bar">
          {notice ?? "Bản minh họa · Câu trả lời chỉ lưu trên trình duyệt này"}
        </div>
      )}
      <article className="inv-card">
        <header className={`inv-hero inv-hero-${invite.layout}`}>
          {invite.layout === "photo" && cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="inv-cover"
              src={cover}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
          {invite.layout === "arch" && (
            <div className="inv-arch">
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={`Ảnh cưới ${invite.names}`}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}
          <div className="inv-hero-content">
            {invite.headline && (
              <p className="inv-eyebrow">{invite.headline}</p>
            )}
            <h1 className="inv-names">
              {first}
              {second && (
                <>
                  <span className="inv-amp" aria-label="và">
                    &
                  </span>
                  {second}
                </>
              )}
            </h1>
            <p className="inv-date">
              {invite.date.split("-").reverse().join(" · ")}
            </p>
            <p className="inv-weekday">
              {weekday(invite.date)}
              {invite.venueName && ` · ${invite.venueName}`}
            </p>
            {invite.lunar && <p className="inv-lunar">{invite.lunar}</p>}
            <Countdown date={invite.date} />
            <div className="inv-hero-actions">
              {status === "open" && (
                <button className="inv-btn" onClick={() => jump("rsvp")}>
                  Xác nhận tham dự
                </button>
              )}
              {has.schedule && (
                <button
                  className="inv-btn ghost"
                  onClick={() => jump("schedule")}
                >
                  Xem lịch trình
                </button>
              )}
            </div>
          </div>
        </header>
        {sections.length > 1 && (
          <nav className="inv-nav" aria-label="Mục lục thiệp">
            {sections.map(([id, label]) => (
              <button key={id} onClick={() => jump(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        {has.message && (
          <section className="inv-section inv-message inv-reveal">
            <span className="inv-ornament" aria-hidden />
            <p>{invite.message}</p>
          </section>
        )}
        {has.schedule && (
          <section className="inv-section inv-reveal" data-section="schedule">
            <p className="inv-label">Lịch trình</p>
            <h2 className="inv-title">{longDate(invite.date)}</h2>
            {invite.lunar && <p className="inv-sub">{invite.lunar}</p>}
            <ol className="inv-timeline">
              {invite.events.map((e) => (
                <li key={e.id}>
                  <time>{e.time}</time>
                  <div>
                    <strong>{e.title}</strong>
                    {e.note && <span>{e.note}</span>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="inv-row-actions">
              <a
                className="inv-btn ghost small"
                href={calendar.google}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarPlus size={14} />
                Google Lịch
              </a>
              <button className="inv-btn ghost small" onClick={downloadIcs}>
                <CalendarPlus size={14} />
                Lịch điện thoại
              </button>
            </div>
          </section>
        )}
        {has.venue && (
          <section className="inv-section inv-reveal" data-section="venue">
            <p className="inv-label">Địa điểm</p>
            <h2 className="inv-title">{invite.venueName}</h2>
            {invite.venueAddress && (
              <p className="inv-sub">
                <MapPin size={14} />
                {invite.venueAddress}
              </p>
            )}
            {invite.dressCode && (
              <p className="inv-chip">
                <Shirt size={14} />
                Trang phục: {invite.dressCode}
              </p>
            )}
            {invite.mapUrl && (
              <div className="inv-row-actions">
                <a
                  className="inv-btn small"
                  href={invite.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={14} />
                  Chỉ đường
                </a>
              </div>
            )}
          </section>
        )}
        {has.gallery && (
          <section className="inv-section inv-reveal" data-section="gallery">
            <p className="inv-label">Album ảnh</p>
            <h2 className="inv-title">Khoảnh khắc của chúng tôi</h2>
            <div
              className={`inv-gallery ${count === 2 ? "pair" : count % 2 ? "odd" : "even"}`}
            >
              {invite.gallery.map((ref, index) => (
                <GalleryPhoto
                  key={ref}
                  photoRef={ref}
                  label={`Xem ảnh ${index + 1}`}
                  onOpen={preview ? undefined : () => setViewer(index)}
                />
              ))}
            </div>
          </section>
        )}
        {has.rsvp && (
          <section className="inv-section inv-reveal" data-section="rsvp">
            <p className="inv-label">Xác nhận tham dự</p>
            <h2 className="inv-title">Bạn sẽ đến chung vui chứ?</h2>
            {invite.rsvpDeadline && status === "open" && (
              <div className="inv-deadline">
                <span>Vui lòng xác nhận trước</span>
                <strong>{dateLabel(invite.rsvpDeadline)}</strong>
              </div>
            )}
            {status === "closed" ? (
              <p className="inv-sub">
                Đã kết thúc nhận xác nhận. Cảm ơn bạn đã quan tâm!
              </p>
            ) : (
              <RsvpForm
                invite={invite}
                preview={preview}
                answerScope={answerScope}
                onSubmit={onSubmit}
              />
            )}
          </section>
        )}
        {has.faq && (
          <section className="inv-section inv-reveal" data-section="faq">
            <p className="inv-label">Hỏi đáp</p>
            <h2 className="inv-title">Điều bạn cần biết</h2>
            <div className="inv-faq">
              {invite.faqs.map((f) => (
                <details key={f.id}>
                  <summary>
                    {f.question}
                    <Plus size={16} aria-hidden />
                  </summary>
                  {f.answer && <p>{f.answer}</p>}
                </details>
              ))}
            </div>
          </section>
        )}
        {has.thanks && (
          <section className="inv-section inv-thanks inv-reveal">
            <Gift size={20} className="inv-accent" />
            <h2 className="inv-title">Lời cảm ơn</h2>
            <p>{invite.giftNote}</p>
          </section>
        )}
        <footer className="inv-footer">
          <p className="inv-footer-names">{invite.names}</p>
          <p className="inv-weekday">
            {invite.date.split("-").reverse().join(" · ")}
          </p>
          {invite.contact && (
            <p className="inv-contact">
              <Phone size={13} />
              {invite.contact}
            </p>
          )}
          <p className="inv-credit">
            {invite.teamName && `Tổ chức bởi ${invite.teamName} · `}
            Thiệp tạo bằng{" "}
            <a href="/" target={preview ? "_blank" : undefined}>
              Wedly
            </a>
          </p>
        </footer>
      </article>
      {viewer !== null && (
        <PhotoViewer
          photos={invite.gallery}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

function GalleryPhoto({
  photoRef,
  label,
  onOpen,
}: {
  photoRef: string;
  label: string;
  onOpen?: () => void;
}) {
  const src = usePhoto(photoRef);
  return (
    <button
      type="button"
      className="inv-photo"
      aria-label={label}
      onClick={onOpen}
      tabIndex={onOpen ? 0 : -1}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
      )}
    </button>
  );
}

// Full-screen album viewer: arrow keys or buttons to browse, Esc to close.
function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const src = usePhoto(photos[index]);
  const close = useRef<HTMLButtonElement>(null);
  const step = (delta: number) =>
    onIndex((index + delta + photos.length) % photos.length);
  useEffect(() => {
    const overflow = document.body.style.overflow,
      opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  return (
    <div
      className="inv-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh ${index + 1} / ${photos.length}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        ref={close}
        className="inv-viewer-close"
        aria-label="Đóng ảnh"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" referrerPolicy="no-referrer" />
      )}
      {photos.length > 1 && (
        <>
          <button
            className="inv-viewer-nav prev"
            aria-label="Ảnh trước"
            onClick={() => step(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="inv-viewer-nav next"
            aria-label="Ảnh sau"
            onClick={() => step(1)}
          >
            <ChevronRight size={22} />
          </button>
          <span className="inv-viewer-count">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}

function Countdown({ date }: { date: string }) {
  // Computed after mount so server and browser render the same markup.
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(daysUntil(date)), [date]);
  if (days === null || days < 0) return null;
  return (
    <p className="inv-countdown">
      {days === 0
        ? "Hôm nay là ngày vui"
        : days === 1
          ? "Ngày mai là ngày vui"
          : `Còn ${days} ngày`}
    </p>
  );
}

type Draft = Omit<RsvpInput, "attending"> & { attending: boolean | null };
const blank = (): Draft => ({
  id: crypto.randomUUID(),
  name: "",
  phone: "",
  attending: null,
  guests: 0,
  guestNames: "",
  side: "",
  dietary: "",
  message: "",
});
function RsvpForm({
  invite,
  preview,
  answerScope,
  onSubmit,
}: {
  invite: PublicInvitation;
  preview: boolean;
  answerScope: string;
  onSubmit?: (answer: RsvpInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(blank);
  const [special, setSpecial] = useState(false);
  const [saved, setSaved] = useState<RsvpInput | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const trap = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (preview) return;
    const previous = recallAnswer(answerScope);
    if (previous) {
      setSaved(previous);
      setDraft(previous);
      setSpecial(Boolean(previous.dietary));
    }
  }, [answerScope, preview]);
  const set = (change: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...change }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (preview || !onSubmit) return;
    if (trap.current?.value) return;
    if (draft.attending === null) {
      setError("Vui lòng chọn bạn có tham dự hay không.");
      return;
    }
    const parsed = rsvpInputSchema.safeParse({
      ...draft,
      dietary: special ? draft.dietary : "",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ.");
      return;
    }
    setSending(true);
    try {
      await onSubmit(parsed.data);
      rememberAnswer(answerScope, parsed.data);
      setSaved(parsed.data);
    } catch (e) {
      setError((e as Error).message || "Chưa gửi được. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }
  if (saved && !preview)
    return (
      <div className="inv-done" role="status">
        <span className="inv-done-icon">
          <Check size={20} />
        </span>
        <h3>Cảm ơn {saved.name}!</h3>
        <p>
          {saved.attending
            ? `Đã ghi nhận ${1 + saved.guests} người tham dự. Hẹn gặp bạn trong ngày vui.`
            : "Rất tiếc vì bạn không thể đến. Cảm ơn lời chúc của bạn."}
        </p>
        <button className="inv-link" onClick={() => setSaved(null)}>
          Sửa câu trả lời
        </button>
      </div>
    );
  return (
    <form className="inv-form" onSubmit={submit} noValidate>
      <label className="inv-field">
        <span>Họ và tên *</span>
        <input
          className="inv-input"
          value={draft.name}
          maxLength={120}
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      <fieldset className="inv-field">
        <legend>Tham dự *</legend>
        <div className="inv-pills">
          {(
            [
              [true, "Sẽ tham dự"],
              [false, "Không thể đến"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={label}
              aria-pressed={draft.attending === value}
              className={`inv-pill ${draft.attending === value ? "active" : ""}`}
              onClick={() => set({ attending: value })}
            >
              {draft.attending === value && <Check size={13} />}
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {invite.askSide && (
        <fieldset className="inv-field">
          <legend>Bạn là khách của</legend>
          <div className="inv-pills">
            {(
              [
                ["groom", "Nhà trai"],
                ["bride", "Nhà gái"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={draft.side === value}
                className={`inv-pill ${draft.side === value ? "active" : ""}`}
                onClick={() => set({ side: draft.side === value ? "" : value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {draft.attending && invite.maxGuests > 0 && (
        <div className="inv-field">
          <span>Số người đi cùng</span>
          <div className="inv-stepper">
            <button
              type="button"
              aria-label="Bớt một người"
              disabled={draft.guests <= 0}
              onClick={() => set({ guests: draft.guests - 1 })}
            >
              <Minus size={15} />
            </button>
            <output aria-live="polite">{draft.guests}</output>
            <button
              type="button"
              aria-label="Thêm một người"
              disabled={draft.guests >= invite.maxGuests}
              onClick={() => set({ guests: draft.guests + 1 })}
            >
              <Plus size={15} />
            </button>
            <small>Không tính bạn · tối đa {invite.maxGuests}</small>
          </div>
          {draft.guests > 0 && (
            <input
              className="inv-input"
              value={draft.guestNames}
              maxLength={500}
              placeholder="Tên người đi cùng (không bắt buộc)"
              onChange={(e) => set({ guestNames: e.target.value })}
            />
          )}
        </div>
      )}
      {draft.attending && invite.askDietary && (
        <fieldset className="inv-field">
          <legend>Ăn uống</legend>
          <div className="inv-pills">
            <button
              type="button"
              aria-pressed={!special}
              className={`inv-pill ${!special ? "active" : ""}`}
              onClick={() => setSpecial(false)}
            >
              Bình thường
            </button>
            <button
              type="button"
              aria-pressed={special}
              className={`inv-pill ${special ? "active" : ""}`}
              onClick={() => setSpecial(true)}
            >
              Ăn chay / dị ứng
            </button>
          </div>
          {special && (
            <input
              className="inv-input"
              value={draft.dietary}
              maxLength={300}
              placeholder="Ví dụ: ăn chay, dị ứng hải sản"
              onChange={(e) => set({ dietary: e.target.value })}
            />
          )}
        </fieldset>
      )}
      <label className="inv-field">
        <span>Số điện thoại</span>
        <input
          className="inv-input"
          value={draft.phone}
          maxLength={30}
          inputMode="tel"
          autoComplete="tel"
          placeholder="Không bắt buộc"
          onChange={(e) => set({ phone: e.target.value })}
        />
      </label>
      <label className="inv-field">
        <span>Lời chúc</span>
        <textarea
          className="inv-input"
          rows={3}
          value={draft.message}
          maxLength={1000}
          placeholder="Gửi đôi lời đến cô dâu chú rể"
          onChange={(e) => set({ message: e.target.value })}
        />
      </label>
      <input
        ref={trap}
        className="inv-trap"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        name="website"
      />
      {error && (
        <p className="inv-error" role="alert">
          {error}
        </p>
      )}
      <button className="inv-btn wide" disabled={preview || sending}>
        {sending && <LoaderCircle size={15} className="spin" />}
        {preview ? "Khách gửi xác nhận tại liên kết thiệp" : "Gửi xác nhận"}
      </button>
    </form>
  );
}
