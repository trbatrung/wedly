"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  EyeOff,
  FileSpreadsheet,
  HelpCircle,
  Heart,
  ImagePlus,
  LoaderCircle,
  MailOpen,
  MapPin,
  Palette,
  Plus,
  Send,
  Star,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import InvitationView from "./InvitationView";
import {
  appsScriptCode,
  defaultInvitation,
  eventPresets,
  faqTemplates,
  fontLabels,
  layoutLabels,
  publicInvitation,
  sectionLabels,
  splitNames,
  themeLabels,
  themePalettes,
} from "@/lib/invitation";
import { inviteFontVariables } from "@/lib/fonts";
import { usePhoto } from "@/lib/invite-photos";
import { lunarLabel } from "@/lib/lunar";
import { dateLabel, today } from "@/lib/domain";
import { sendToSheet } from "@/lib/sheets-client";
import {
  invitationSchema,
  inviteFonts,
  inviteLayouts,
  inviteThemes,
  type Invitation,
  type InviteSection,
  type Wedding,
} from "@/lib/types";

type Props = {
  wedding: Wedding;
  invitation?: Invitation;
  teamName: string;
  demo: boolean;
  busy: boolean;
  inviteUrl: (invitation: Invitation) => string | null;
  onSave: (next: Invitation, message: string) => Promise<Invitation>;
  // Compresses and stores a photo, returning its reference for the invitation.
  onUploadPhoto: (file: File) => Promise<string>;
  notify: (text: string, error?: boolean) => void;
};
const MAX_PHOTOS = 12;

export default function InvitationStudio({
  wedding,
  invitation,
  teamName,
  demo,
  busy,
  inviteUrl,
  onSave,
  onUploadPhoto,
  notify,
}: Props) {
  const [draft, setDraft] = useState<Invitation | null>(invitation ?? null),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState(""),
    [pane, setPane] = useState<"edit" | "preview">("edit"),
    [testing, setTesting] = useState(false),
    [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!dirty) setDraft(invitation ?? null);
  }, [invitation, dirty]);
  async function save(next: Invitation, message: string) {
    setError("");
    const parsed = invitationSchema.safeParse(next);
    if (!parsed.success) {
      const text = parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ.";
      setError(text);
      // The field may be far below the save button; the toast is always visible.
      notify(text, true);
      return;
    }
    try {
      const saved = await onSave(parsed.data, message);
      setDraft(saved);
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!draft)
    return (
      <section className="panel studio-intro">
        <span className="studio-intro-icon">
          <MailOpen size={22} />
        </span>
        <h2>Thiệp mời online cho {wedding.couple}</h2>
        <p>
          Một liên kết gồm lịch trình, địa điểm, xác nhận tham dự và hỏi đáp.
          Khách trả lời sẽ vào danh sách Khách mời.
        </p>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() =>
            void save(
              defaultInvitation(wedding),
              "Đã tạo thiệp mời. Kiểm tra nội dung rồi đăng thiệp.",
            )
          }
        >
          <Plus size={15} />
          Tạo thiệp từ hồ sơ
        </button>
      </section>
    );
  const set = (change: Partial<Invitation>) => {
    setDraft((d) => (d ? { ...d, ...change } : d));
    setDirty(true);
  };
  const url = inviteUrl(draft);
  const preview = publicInvitation(wedding, draft, teamName);
  const usedFaqs = new Set(draft.faqs.map((f) => f.question));
  const [firstName, secondName] = splitNames(preview.names);
  const sample = secondName ? `${firstName} & ${secondName}` : firstName;
  async function addPhotos(files: FileList | null, target: "cover" | "album") {
    if (!files?.length || !draft) return;
    setUploading(true);
    try {
      if (target === "cover") {
        const ref = await onUploadPhoto(files[0]);
        // A first cover photo switches the text layout to the photo frame.
        setDraft((d) =>
          d
            ? {
                ...d,
                coverUrl: ref,
                layout: d.layout === "text" ? "arch" : d.layout,
              }
            : d,
        );
      } else {
        const room = MAX_PHOTOS - draft.gallery.length;
        for (const file of Array.from(files).slice(0, room)) {
          const ref = await onUploadPhoto(file);
          setDraft((d) => (d ? { ...d, gallery: [...d.gallery, ref] } : d));
        }
        if (files.length > room)
          notify(`Album tối đa ${MAX_PHOTOS} ảnh; đã thêm ${room} ảnh đầu.`);
      }
      setDirty(true);
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setUploading(false);
    }
  }
  const move = (index: number, delta: number) => {
    const gallery = draft.gallery.slice();
    const [photo] = gallery.splice(index, 1);
    gallery.splice(index + delta, 0, photo);
    set({ gallery });
  };
  const visible = (section: InviteSection) => (
    <label className="checkbox-label studio-visible">
      <input
        type="checkbox"
        checked={!draft.hidden.includes(section)}
        onChange={(e) =>
          set({
            hidden: e.target.checked
              ? draft.hidden.filter((h) => h !== section)
              : [...draft.hidden, section],
          })
        }
      />
      Hiện mục “{sectionLabels[section]}” trên thiệp
    </label>
  );
  return (
    <div className="studio">
      <section className="panel studio-bar">
        <div className="studio-state">
          <span className={`badge ${draft.published ? "" : "neutral"}`}>
            {draft.published ? "Đang mở" : "Bản nháp"}
          </span>
          {dirty && <span className="badge orange">Chưa lưu</span>}
        </div>
        {url ? (
          <div className="studio-link">
            <input
              className="input"
              readOnly
              value={url}
              aria-label="Liên kết thiệp mời"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              className="icon-button"
              aria-label="Sao chép liên kết"
              onClick={() =>
                void navigator.clipboard
                  .writeText(url)
                  .then(() => notify("Đã sao chép liên kết thiệp."))
              }
            >
              <Copy size={14} />
            </button>
            <a
              className="icon-button"
              aria-label="Mở thiệp trong thẻ mới"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <p className="studio-hint">Đăng thiệp để có liên kết gửi khách.</p>
        )}
        <div className="row studio-actions">
          <button
            className="btn small"
            disabled={busy}
            onClick={() =>
              void save(
                { ...draft, published: !draft.published },
                draft.published
                  ? "Đã tạm ẩn thiệp. Khách không mở được liên kết."
                  : "Đã đăng thiệp. Sao chép liên kết để gửi khách.",
              )
            }
          >
            {draft.published ? <EyeOff size={13} /> : <Send size={13} />}
            {draft.published ? "Tạm ẩn" : "Đăng thiệp"}
          </button>
          <button
            className="btn primary small"
            disabled={busy || !dirty}
            onClick={() => void save(draft, "Đã lưu thiệp mời.")}
          >
            {busy ? (
              <LoaderCircle size={13} className="spin" />
            ) : (
              <Check size={13} />
            )}
            Lưu
          </button>
        </div>
        {error && (
          <div className="notice error studio-error" role="alert">
            {error}
          </div>
        )}
      </section>
      <div className="segmented studio-switch" role="tablist">
        {(
          [
            ["edit", "Nội dung"],
            ["preview", "Xem trước"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={pane === key}
            className={pane === key ? "active" : ""}
            onClick={() => setPane(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`studio-grid show-${pane}`}>
        <div className="studio-form">
          <Group title="Giao diện" icon={<Palette size={15} />} open>
            <div className="design-field">
              <span className="design-label">Bố cục</span>
              <div className="design-options">
                {inviteLayouts.map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    aria-pressed={draft.layout === layout}
                    className={`design-option ${draft.layout === layout ? "active" : ""}`}
                    onClick={() => set({ layout })}
                  >
                    <span className={`layout-sketch ${layout}`} aria-hidden>
                      <i />
                      <b />
                      <b />
                    </span>
                    {layoutLabels[layout]}
                  </button>
                ))}
              </div>
              {draft.layout !== "text" && !draft.coverUrl && (
                <small className="field-note">
                  Thêm ảnh bìa ở mục Ảnh để dùng bố cục này.
                </small>
              )}
            </div>
            <div className="design-field">
              <span className="design-label">Kiểu chữ</span>
              <div className={`design-options fonts ${inviteFontVariables}`}>
                {inviteFonts.map((font) => (
                  <button
                    key={font}
                    type="button"
                    aria-pressed={draft.font === font}
                    className={`design-option font-option inv-font-${font} ${draft.font === font ? "active" : ""}`}
                    onClick={() => set({ font })}
                  >
                    <span className="font-sample">{sample}</span>
                    <small>{fontLabels[font]}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="design-field">
              <span className="design-label">Màu sắc</span>
              <div className="palette-swatches">
                {inviteThemes.map((theme) => {
                  const p = themePalettes[theme];
                  return (
                    <button
                      key={theme}
                      type="button"
                      title={themeLabels[theme]}
                      aria-pressed={draft.theme === theme}
                      className={`palette-swatch ${draft.theme === theme ? "active" : ""}`}
                      onClick={() => set({ theme })}
                    >
                      <i style={{ background: p.paper, borderColor: p.line }}>
                        <b style={{ background: p.accent }} />
                      </i>
                      {themeLabels[theme]}
                    </button>
                  );
                })}
              </div>
              <div className="accent-row">
                <label className="accent-picker">
                  <input
                    type="color"
                    value={draft.accent || themePalettes[draft.theme].accent}
                    onChange={(e) => set({ accent: e.target.value })}
                  />
                  {draft.accent
                    ? `Màu nhấn riêng ${draft.accent}`
                    : "Chọn màu nhấn riêng"}
                </label>
                {draft.accent && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => set({ accent: "" })}
                  >
                    Dùng màu của bảng
                  </button>
                )}
              </div>
            </div>
            <div className="design-field">
              <span className="design-label">Căn chữ</span>
              <div className="segmented floor-segmented">
                {(
                  [
                    ["center", "Giữa"],
                    ["left", "Trái"],
                  ] as const
                ).map(([align, label]) => (
                  <button
                    key={align}
                    type="button"
                    aria-pressed={draft.align === align}
                    className={draft.align === align ? "active" : ""}
                    onClick={() => set({ align })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Group>
          <Group
            title="Ảnh"
            icon={<ImagePlus size={15} />}
            badge={`${draft.gallery.length + (draft.coverUrl ? 1 : 0)} ảnh`}
            open
          >
            <div className="design-field">
              <span className="design-label">Ảnh bìa</span>
              {draft.coverUrl ? (
                <div className="cover-pick">
                  <PhotoThumb
                    photoRef={draft.coverUrl}
                    className="cover-thumb"
                  />
                  <div className="cover-actions">
                    <label className="btn small">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        disabled={uploading}
                        onChange={(e) => {
                          void addPhotos(e.target.files, "cover");
                          e.target.value = "";
                        }}
                      />
                      <ImagePlus size={13} />
                      Đổi ảnh
                    </label>
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => set({ coverUrl: "" })}
                    >
                      <X size={13} />
                      Bỏ ảnh bìa
                    </button>
                  </div>
                </div>
              ) : (
                <label className="photo-drop">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      void addPhotos(e.target.files, "cover");
                      e.target.value = "";
                    }}
                  />
                  <ImagePlus size={20} />
                  <strong>Chọn ảnh bìa</strong>
                  <small>
                    Ảnh được thu nhỏ và xóa thông tin vị trí trước khi lưu
                  </small>
                </label>
              )}
              <details className="cover-link">
                <summary>Hoặc dán liên kết ảnh</summary>
                <input
                  className="input"
                  value={
                    draft.coverUrl.startsWith("https://") ? draft.coverUrl : ""
                  }
                  maxLength={500}
                  inputMode="url"
                  placeholder="https://…/anh-cuoi.jpg"
                  onChange={(e) => set({ coverUrl: e.target.value.trim() })}
                />
              </details>
            </div>
            <div className="design-field">
              <span className="design-label">
                Album · {draft.gallery.length}/{MAX_PHOTOS}
              </span>
              <div className="album-grid">
                {draft.gallery.map((ref, i) => (
                  <div className="album-item" key={ref}>
                    <PhotoThumb photoRef={ref} />
                    <div className="album-actions">
                      <button
                        type="button"
                        aria-label="Đưa lên trước"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Đặt làm ảnh bìa"
                        title="Đặt làm ảnh bìa"
                        onClick={() =>
                          set({
                            coverUrl: ref,
                            layout:
                              draft.layout === "text" ? "arch" : draft.layout,
                          })
                        }
                      >
                        <Star size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Đưa xuống sau"
                        disabled={i === draft.gallery.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label="Bỏ ảnh khỏi album"
                        onClick={() =>
                          set({
                            gallery: draft.gallery.filter((g) => g !== ref),
                          })
                        }
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {draft.gallery.length < MAX_PHOTOS && (
                  <label className="album-add">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={(e) => {
                        void addPhotos(e.target.files, "album");
                        e.target.value = "";
                      }}
                    />
                    {uploading ? (
                      <LoaderCircle size={18} className="spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    {uploading ? "Đang tải…" : "Thêm ảnh"}
                  </label>
                )}
              </div>
              {visible("gallery")}
            </div>
          </Group>
          <Group title="Lời mời" icon={<Heart size={15} />}>
            {visible("message")}
            <div className="fields">
              <label className="field">
                Tên hiển thị
                <input
                  value={draft.names}
                  maxLength={120}
                  placeholder={wedding.couple}
                  onChange={(e) => set({ names: e.target.value })}
                />
              </label>
              <label className="field">
                Lời mở đầu
                <input
                  value={draft.headline}
                  maxLength={80}
                  placeholder="Trân trọng kính mời"
                  onChange={(e) => set({ headline: e.target.value })}
                />
              </label>
              <label className="field span-2">
                Lời mời
                <textarea
                  rows={3}
                  value={draft.message}
                  maxLength={800}
                  onChange={(e) => set({ message: e.target.value })}
                />
              </label>
              <label className="checkbox-label span-2">
                <input
                  type="checkbox"
                  checked={draft.showLunar}
                  onChange={(e) => set({ showLunar: e.target.checked })}
                />
                <span>
                  Hiện ngày âm lịch
                  <small className="field-note">
                    {dateLabel(wedding.date)} · {lunarLabel(wedding.date)}
                  </small>
                </span>
              </label>
            </div>
          </Group>
          <Group title="Lịch trình" icon={<CalendarClock size={15} />}>
            {visible("schedule")}
            <p className="field-note" style={{ marginBottom: 12 }}>
              Ngày cưới theo hồ sơ: {dateLabel(wedding.date)}. Sửa ngày trong
              “Sửa hồ sơ”.
            </p>
            {draft.events.map((event, i) => (
              <div className="studio-event" key={event.id}>
                <input
                  type="time"
                  aria-label="Giờ"
                  value={event.time}
                  onChange={(e) =>
                    set({
                      events: draft.events.map((x, j) =>
                        j === i ? { ...x, time: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  aria-label="Tên mốc"
                  value={event.title}
                  maxLength={80}
                  placeholder="Tên mốc"
                  onChange={(e) =>
                    set({
                      events: draft.events.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  aria-label="Ghi chú"
                  value={event.note}
                  maxLength={200}
                  placeholder="Ghi chú (không bắt buộc)"
                  onChange={(e) =>
                    set({
                      events: draft.events.map((x, j) =>
                        j === i ? { ...x, note: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  className="icon-button"
                  aria-label={`Xóa ${event.title || "mốc lịch trình"}`}
                  onClick={() =>
                    set({ events: draft.events.filter((_, j) => j !== i) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {draft.events.length < 10 && (
              <div className="chip-row">
                {eventPresets
                  .filter((p) => !draft.events.some((e) => e.title === p))
                  .map((title) => (
                    <button
                      key={title}
                      className="chip"
                      onClick={() =>
                        set({
                          events: [
                            ...draft.events,
                            {
                              id: crypto.randomUUID(),
                              time:
                                draft.events[draft.events.length - 1]?.time ??
                                "18:00",
                              title,
                              note: "",
                            },
                          ],
                        })
                      }
                    >
                      <Plus size={12} />
                      {title}
                    </button>
                  ))}
                <button
                  className="chip"
                  onClick={() =>
                    set({
                      events: [
                        ...draft.events,
                        {
                          id: crypto.randomUUID(),
                          time: "18:00",
                          title: "",
                          note: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus size={12} />
                  Mốc khác
                </button>
              </div>
            )}
          </Group>
          <Group title="Địa điểm" icon={<MapPin size={15} />}>
            {visible("venue")}
            <div className="fields">
              <label className="field">
                Tên địa điểm
                <input
                  value={draft.venueName}
                  maxLength={160}
                  placeholder={
                    wedding.venue.split("·")[0].trim() || "Nhà hàng…"
                  }
                  onChange={(e) => set({ venueName: e.target.value })}
                />
              </label>
              <label className="field">
                Trang phục
                <input
                  value={draft.dressCode}
                  maxLength={160}
                  placeholder="Lịch sự · Tông pastel"
                  onChange={(e) => set({ dressCode: e.target.value })}
                />
              </label>
              <label className="field span-2">
                Địa chỉ
                <input
                  value={draft.venueAddress}
                  maxLength={240}
                  placeholder="Số nhà, đường, phường, tỉnh/thành"
                  onChange={(e) => set({ venueAddress: e.target.value })}
                />
              </label>
              <label className="field span-2">
                Liên kết Google Maps (không bắt buộc)
                <input
                  value={draft.mapUrl}
                  maxLength={500}
                  inputMode="url"
                  placeholder="Để trống: tự tìm theo tên và địa chỉ"
                  onChange={(e) => set({ mapUrl: e.target.value.trim() })}
                />
              </label>
            </div>
          </Group>
          <Group title="Xác nhận tham dự" icon={<UserCheck size={15} />}>
            <div className="fields">
              <label className="checkbox-label span-2">
                <input
                  type="checkbox"
                  checked={draft.rsvpEnabled}
                  onChange={(e) => set({ rsvpEnabled: e.target.checked })}
                />
                Nhận xác nhận tham dự trên thiệp
              </label>
              <label className="field">
                Hạn xác nhận
                <input
                  type="date"
                  value={draft.rsvpDeadline ?? ""}
                  min={today()}
                  max={wedding.date}
                  disabled={!draft.rsvpEnabled}
                  onChange={(e) =>
                    set({ rsvpDeadline: e.target.value || null })
                  }
                />
              </label>
              <label className="field">
                Người đi cùng tối đa
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={draft.maxGuests}
                  disabled={!draft.rsvpEnabled}
                  onChange={(e) =>
                    set({
                      maxGuests: Math.max(
                        0,
                        Math.min(10, Math.round(Number(e.target.value) || 0)),
                      ),
                    })
                  }
                />
              </label>
              <label className="checkbox-label span-2">
                <input
                  type="checkbox"
                  checked={draft.askSide}
                  disabled={!draft.rsvpEnabled}
                  onChange={(e) => set({ askSide: e.target.checked })}
                />
                Hỏi khách nhà trai hay nhà gái
              </label>
              <label className="checkbox-label span-2">
                <input
                  type="checkbox"
                  checked={draft.askDietary}
                  disabled={!draft.rsvpEnabled}
                  onChange={(e) => set({ askDietary: e.target.checked })}
                />
                Hỏi ăn chay, dị ứng
              </label>
            </div>
          </Group>
          <Group title="Hỏi đáp" icon={<HelpCircle size={15} />}>
            {visible("faq")}
            {draft.faqs.map((faq, i) => (
              <div className="studio-faq" key={faq.id}>
                <div className="between">
                  <input
                    className="input"
                    aria-label="Câu hỏi"
                    value={faq.question}
                    maxLength={160}
                    placeholder="Câu hỏi"
                    onChange={(e) =>
                      set({
                        faqs: draft.faqs.map((x, j) =>
                          j === i ? { ...x, question: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label="Xóa câu hỏi"
                    onClick={() =>
                      set({ faqs: draft.faqs.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="input"
                  aria-label="Trả lời"
                  rows={2}
                  value={faq.answer}
                  maxLength={1000}
                  placeholder="Trả lời"
                  onChange={(e) =>
                    set({
                      faqs: draft.faqs.map((x, j) =>
                        j === i ? { ...x, answer: e.target.value } : x,
                      ),
                    })
                  }
                />
              </div>
            ))}
            {draft.faqs.length < 20 && (
              <div className="chip-row">
                {faqTemplates
                  .filter((t) => !usedFaqs.has(t.question))
                  .map((t) => (
                    <button
                      key={t.question}
                      className="chip"
                      onClick={() =>
                        set({
                          faqs: [
                            ...draft.faqs,
                            { ...t, id: crypto.randomUUID() },
                          ],
                        })
                      }
                    >
                      <Plus size={12} />
                      {t.question}
                    </button>
                  ))}
                <button
                  className="chip"
                  onClick={() =>
                    set({
                      faqs: [
                        ...draft.faqs,
                        { id: crypto.randomUUID(), question: "", answer: "" },
                      ],
                    })
                  }
                >
                  <Plus size={12} />
                  Câu hỏi khác
                </button>
              </div>
            )}
          </Group>
          <Group title="Lời cảm ơn & liên hệ" icon={<Heart size={15} />}>
            {visible("thanks")}
            <div className="fields">
              <label className="field span-2">
                Lời cảm ơn / quà mừng
                <textarea
                  rows={2}
                  value={draft.giftNote}
                  maxLength={800}
                  onChange={(e) => set({ giftNote: e.target.value })}
                />
              </label>
              <label className="field span-2">
                Liên hệ
                <input
                  value={draft.contact}
                  maxLength={200}
                  placeholder="Ví dụ: Lan · Điều phối tiệc cưới"
                  onChange={(e) => set({ contact: e.target.value })}
                />
              </label>
            </div>
          </Group>
          <Group
            title="Google Sheets"
            icon={<FileSpreadsheet size={15} />}
            badge={draft.sheetUrl ? "Đã kết nối" : "Tùy chọn"}
          >
            <p className="field-note">
              Mỗi xác nhận mới được thêm vào Google Sheet của cô dâu chú rể.
              Danh sách Khách mời trong Wedly vẫn được giữ.
            </p>
            <ol className="sheet-steps">
              <li>Tạo Google Sheet → Tiện ích mở rộng → Apps Script.</li>
              <li>
                Dán mã bên dưới, lưu, rồi Triển khai → Ứng dụng web (Ai có quyền
                truy cập: Bất kỳ ai).
              </li>
              <li>Sao chép liên kết …/exec và dán vào đây, rồi Lưu.</li>
            </ol>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              <button
                className="btn small"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(appsScriptCode)
                    .then(() => notify("Đã sao chép mã Apps Script."))
                }
              >
                <Copy size={13} />
                Sao chép mã Apps Script
              </button>
            </div>
            <details className="sheet-code">
              <summary>Xem mã</summary>
              <pre>{appsScriptCode}</pre>
            </details>
            <label className="field" style={{ marginTop: 14 }}>
              Liên kết ứng dụng web
              <input
                value={draft.sheetUrl}
                maxLength={300}
                inputMode="url"
                placeholder="https://script.google.com/macros/s/…/exec"
                onChange={(e) => set({ sheetUrl: e.target.value.trim() })}
              />
              <small>
                {demo
                  ? "Bản trải nghiệm gửi từ trình duyệt này."
                  : "Chỉ đội ngũ thấy liên kết này; máy chủ Wedly gửi thay khách."}
              </small>
            </label>
            <button
              className="btn small"
              style={{ marginTop: 12 }}
              disabled={!draft.sheetUrl || testing}
              onClick={async () => {
                if (
                  !invitationSchema.shape.sheetUrl.safeParse(draft.sheetUrl)
                    .success
                )
                  return notify(
                    "Liên kết cần có dạng …/macros/s/…/exec.",
                    true,
                  );
                setTesting(true);
                const sent = await sendToSheet(draft.sheetUrl, {
                  id: `test-${Date.now()}`,
                  wedding: preview.names,
                  updatedAt: new Date().toLocaleString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  }),
                  name: "Dòng thử từ Wedly",
                  phone: "",
                  attending: "Có",
                  people: 1,
                  guestNames: "",
                  side: "",
                  dietary: "",
                  message: "Có thể xóa dòng này.",
                });
                setTesting(false);
                notify(
                  sent
                    ? "Đã gửi dòng thử. Mở Google Sheet để kiểm tra."
                    : "Không gửi được. Kiểm tra mạng và liên kết.",
                  !sent,
                );
              }}
            >
              <Send size={13} />
              Gửi dòng thử
            </button>
          </Group>
        </div>
        <div className="studio-preview" aria-label="Xem trước thiệp">
          <div className="phone">
            <div className="phone-screen">
              <InvitationView
                invite={preview}
                mode="preview"
                answerScope="preview"
              />
            </div>
          </div>
          <p className="studio-hint">Xem trước · cập nhật khi bạn nhập</p>
        </div>
      </div>
    </div>
  );
}

function PhotoThumb({
  photoRef,
  className = "",
}: {
  photoRef: string;
  className?: string;
}) {
  const src = usePhoto(photoRef);
  return (
    <span className={`photo-thumb ${className}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" referrerPolicy="no-referrer" />
      )}
    </span>
  );
}
function Group({
  title,
  icon,
  badge,
  open,
  children,
}: {
  title: string;
  icon: ReactNode;
  badge?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="panel studio-group" open={open}>
      <summary>
        <span className="studio-group-icon">{icon}</span>
        {title}
        {badge && <span className="badge neutral">{badge}</span>}
      </summary>
      <div className="studio-group-body">{children}</div>
    </details>
  );
}
