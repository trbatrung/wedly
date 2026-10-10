import type {
  Invitation,
  InviteEvent,
  InviteFaq,
  InviteTheme,
  Rsvp,
  RsvpInput,
  Wedding,
} from "./types";
import { sideLabels } from "./types";
import { lunarLabel } from "./lunar";
import { today } from "./domain";

export const themeLabels: Record<InviteTheme, string> = {
  sage: "Xanh lá",
  blush: "Hồng phấn",
  navy: "Xanh đậm",
  sand: "Vàng cát",
};
export const eventPresets = [
  "Lễ gia tiên",
  "Lễ vu quy",
  "Đón khách",
  "Lễ thành hôn",
  "Khai tiệc",
];
export const faqTemplates: Omit<InviteFaq, "id">[] = [
  {
    question: "Trang phục nên mặc thế nào?",
    answer:
      "Trang phục lịch sự. Mời bạn tránh màu trắng để nhường cô dâu tỏa sáng.",
  },
  {
    question: "Tôi nên đến lúc mấy giờ?",
    answer:
      "Mời bạn đến sớm khoảng 30 phút trước giờ khai tiệc để đón khách và chụp ảnh lưu niệm.",
  },
  {
    question: "Có chỗ gửi xe không?",
    answer: "Địa điểm có bãi gửi xe máy và ô tô cho khách dự tiệc.",
  },
  {
    question: "Có thể đưa trẻ nhỏ đi cùng không?",
    answer:
      "Rất hoan nghênh. Vui lòng ghi số người đi cùng khi xác nhận để chúng tôi chuẩn bị chỗ ngồi.",
  },
  {
    question: "Khách ở xa có gợi ý chỗ nghỉ không?",
    answer:
      "Vui lòng liên hệ cô dâu chú rể để được gợi ý khách sạn gần địa điểm.",
  },
];
const withId = <T extends object>(item: T) => ({
  ...item,
  id: crypto.randomUUID(),
});
const shiftDate = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function defaultInvitation(wedding: Wedding): Invitation {
  const deadline = shiftDate(wedding.date, -14);
  return {
    weddingId: wedding.id,
    token: null,
    published: false,
    theme: "sage",
    names: "",
    headline: "Trân trọng kính mời",
    message:
      "Chúng tôi rất mong được đón bạn đến chung vui trong ngày cưới. Sự hiện diện của bạn là niềm vinh hạnh của gia đình chúng tôi.",
    showLunar: true,
    coverUrl: "",
    events: [
      withId({ time: "17:30", title: "Đón khách", note: "" }),
      withId({ time: "18:30", title: "Lễ thành hôn", note: "" }),
      withId({ time: "19:00", title: "Khai tiệc", note: "" }),
    ],
    venueName: "",
    venueAddress: "",
    mapUrl: "",
    dressCode: "",
    rsvpEnabled: true,
    rsvpDeadline: deadline >= today() ? deadline : null,
    maxGuests: 2,
    askDietary: true,
    askSide: true,
    giftNote: "Sự hiện diện của bạn là món quà quý giá nhất với chúng tôi.",
    contact: "",
    faqs: faqTemplates.slice(0, 3).map(withId),
    sheetUrl: "",
    updatedAt: new Date().toISOString(),
  };
}

// The only invitation data a guest's browser receives. Budget, notes, team
// members, tokens and the private Google Sheets endpoint never leave the server.
export type PublicInvitation = {
  weddingId: string;
  names: string;
  date: string;
  headline: string;
  message: string;
  lunar: string | null;
  coverUrl: string;
  theme: InviteTheme;
  events: InviteEvent[];
  venueName: string;
  venueAddress: string;
  mapUrl: string;
  dressCode: string;
  rsvpEnabled: boolean;
  rsvpDeadline: string | null;
  maxGuests: number;
  askDietary: boolean;
  askSide: boolean;
  giftNote: string;
  contact: string;
  faqs: InviteFaq[];
  teamName: string;
};
export function publicInvitation(
  wedding: Wedding,
  invitation: Invitation,
  teamName: string,
): PublicInvitation {
  const place = {
    venueName:
      invitation.venueName.trim() || wedding.venue.split("·")[0].trim(),
    venueAddress: invitation.venueAddress.trim(),
    mapUrl: invitation.mapUrl.trim(),
  };
  return {
    weddingId: wedding.id,
    names: invitation.names.trim() || wedding.couple,
    date: wedding.date,
    headline: invitation.headline.trim(),
    message: invitation.message.trim(),
    lunar: invitation.showLunar ? lunarLabel(wedding.date) : null,
    coverUrl: invitation.coverUrl.trim(),
    theme: invitation.theme,
    events: invitation.events
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time)),
    ...place,
    mapUrl: mapsUrl(place),
    dressCode: invitation.dressCode.trim(),
    rsvpEnabled: invitation.rsvpEnabled,
    rsvpDeadline: invitation.rsvpDeadline,
    maxGuests: invitation.maxGuests,
    askDietary: invitation.askDietary,
    askSide: invitation.askSide,
    giftNote: invitation.giftNote.trim(),
    contact: invitation.contact.trim(),
    faqs: invitation.faqs.filter((f) => f.question.trim()),
    teamName,
  };
}
export function mapsUrl(place: {
  venueName: string;
  venueAddress: string;
  mapUrl: string;
}) {
  if (place.mapUrl) return place.mapUrl;
  const query = [place.venueName, place.venueAddress]
    .filter(Boolean)
    .join(", ");
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : "";
}
export function splitNames(names: string): [string, string | null] {
  const parts = names.split(/\s+(?:&|và|x)\s+/i);
  return parts.length === 2
    ? [parts[0].trim(), parts[1].trim()]
    : [names.trim(), null];
}

export type RsvpStatus = "open" | "closed" | "off";
// Guests may still answer after the soft deadline until the wedding day ends.
export function rsvpStatus(
  invite: Pick<PublicInvitation, "rsvpEnabled" | "date">,
  day = today(),
): RsvpStatus {
  if (!invite.rsvpEnabled) return "off";
  return invite.date < day ? "closed" : "open";
}
export function normalizeRsvp(
  input: RsvpInput,
  invite: Pick<PublicInvitation, "maxGuests" | "askDietary" | "askSide">,
): RsvpInput {
  const guests = input.attending
    ? Math.min(Math.max(0, input.guests), invite.maxGuests)
    : 0;
  return {
    ...input,
    name: input.name.trim(),
    phone: input.phone.trim(),
    guests,
    guestNames: guests ? input.guestNames.trim() : "",
    side: invite.askSide ? input.side : "",
    dietary: input.attending && invite.askDietary ? input.dietary.trim() : "",
    message: input.message.trim(),
  };
}
// A second answer from the same device replaces the first one.
export function upsertRsvp(list: Rsvp[], next: Rsvp): Rsvp[] {
  const existing = list.find((r) => r.id === next.id);
  if (existing && existing.weddingId !== next.weddingId)
    throw new Error("Câu trả lời không thuộc đám cưới này.");
  return existing
    ? list.map((r) =>
        r.id === next.id ? { ...next, createdAt: existing.createdAt } : r,
      )
    : [next, ...list];
}
export function rsvpSummary(
  rsvps: Pick<Rsvp, "attending" | "guests" | "dietary" | "side">[],
  seatsPerTable = 10,
) {
  const attending = rsvps.filter((r) => r.attending);
  const people = attending.reduce((sum, r) => sum + 1 + r.guests, 0);
  return {
    responses: rsvps.length,
    attendingParties: attending.length,
    attendingPeople: people,
    declined: rsvps.length - attending.length,
    dietary: attending.filter((r) => r.dietary).length,
    bride: attending
      .filter((r) => r.side === "bride")
      .reduce((s, r) => s + 1 + r.guests, 0),
    groom: attending
      .filter((r) => r.side === "groom")
      .reduce((s, r) => s + 1 + r.guests, 0),
    tables: Math.ceil(people / Math.max(1, seatsPerTable)),
  };
}

const timestamp = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
// Guest text is untrusted: a leading = + - @ would run as a spreadsheet formula.
export function csvCell(value: string | number) {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
export function rsvpCsv(rsvps: Rsvp[]) {
  const header = [
    "Họ tên",
    "Điện thoại",
    "Tham dự",
    "Tổng số người",
    "Người đi cùng",
    "Khách của",
    "Ăn uống",
    "Lời nhắn",
    "Nguồn",
    "Cập nhật",
  ];
  const rows = rsvps.map((r) => [
    r.name,
    r.phone,
    r.attending ? "Có" : "Không",
    r.attending ? 1 + r.guests : 0,
    r.guestNames,
    sideLabels[r.side],
    r.dietary,
    r.message,
    r.source === "manual" ? "Nhập tay" : "Thiệp mời",
    timestamp(r.updatedAt),
  ]);
  // BOM so Excel opens Vietnamese text as UTF-8; Google Sheets ignores it.
  return (
    "﻿" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  );
}

// Row sent to the couple's Google Sheet through their Apps Script web app.
export function sheetRow(rsvp: Rsvp, names: string) {
  return {
    id: rsvp.id,
    wedding: names,
    updatedAt: timestamp(rsvp.updatedAt),
    name: rsvp.name,
    phone: rsvp.phone,
    attending: rsvp.attending ? "Có" : "Không",
    people: rsvp.attending ? 1 + rsvp.guests : 0,
    guestNames: rsvp.guestNames,
    side: sideLabels[rsvp.side],
    dietary: rsvp.dietary,
    message: rsvp.message,
  };
}
export const appsScriptCode = `// Wedly → Google Sheets. Dán vào Tiện ích mở rộng → Apps Script.
// Triển khai → Tùy chọn triển khai mới → Ứng dụng web
// (Thực thi với tư cách: Tôi · Ai có quyền truy cập: Bất kỳ ai).
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName('Khách mời') || book.insertSheet('Khách mời');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Mã', 'Cập nhật', 'Đám cưới', 'Họ tên', 'Điện thoại',
      'Tham dự', 'Tổng số người', 'Người đi cùng', 'Khách của', 'Ăn uống', 'Lời nhắn']);
  }
  var row = [data.id, data.updatedAt, data.wedding, data.name, data.phone,
    data.attending, data.people, data.guestNames, data.side, data.dietary, data.message]
    .map(function (v) { return /^[=+\\-@]/.test(String(v)) ? "'" + v : v; });
  var ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues()
    .map(function (r) { return r[0]; });
  var index = ids.indexOf(data.id);
  if (index > 0) sheet.getRange(index + 1, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return ContentService.createTextOutput('{"ok":true}')
    .setMimeType(ContentService.MimeType.JSON);
}`;

// Calendar links use the first scheduled moment (Vietnam time, UTC+7).
export function calendarEvent(invite: PublicInvitation) {
  const time = invite.events[0]?.time ?? "18:00";
  const start = new Date(`${invite.date}T${time}:00+07:00`);
  const end = new Date(start.getTime() + 4 * 3600000);
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const title = `Đám cưới ${invite.names}`;
  const location = [invite.venueName, invite.venueAddress]
    .filter(Boolean)
    .join(", ");
  const details = invite.events.map((e) => `${e.time} ${e.title}`).join("\n");
  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${stamp(start)}/${stamp(end)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}`;
  const escape = (text: string) =>
    text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedly//Thiep moi//VI",
    "BEGIN:VEVENT",
    `UID:${invite.weddingId}-${stamp(start)}@wedly`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return { google, ics };
}
