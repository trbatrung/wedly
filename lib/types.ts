import { z } from "zod";

export const viewSchema = z.enum([
  "overview",
  "weddings",
  "inbox",
  "tasks",
  "payments",
  "floorplan",
  "team",
]);
export type View = z.infer<typeof viewSchema>;
export const weddingTabSchema = z.enum([
  "tasks",
  "vendors",
  "guests",
  "invite",
  "floorplan",
  "inbox",
]);
export type WeddingTab = z.infer<typeof weddingTabSchema>;
export const weddingTabLabels: Record<WeddingTab, string> = {
  tasks: "Công việc",
  vendors: "Chi phí",
  guests: "Khách mời",
  invite: "Thiệp mời",
  floorplan: "Sơ đồ",
  inbox: "Ảnh",
};
export const dealLabels = {
  inquiry: "Đang trao đổi",
  quoted: "Đã nhận báo giá",
  negotiating: "Đang thương lượng",
  confirmed: "Đã chốt",
};
export const categoryLabels = [
  "Trang trí",
  "Nhà hàng",
  "Chụp ảnh",
  "Trang điểm",
  "Âm thanh",
  "Địa điểm",
  "Khác",
];
const id = z.string().min(1).max(100);
const money = z.number().int().min(0).max(100_000_000_000);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Ngày không hợp lệ");
export const weddingSchema = z.object({
  id,
  couple: z.string().min(1).max(120),
  date,
  venue: z.string().max(160),
  guestCount: z.number().int().min(0).max(10000),
  budget: money,
  lead: z.string().max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  archived: z.boolean(),
  shareToken: z.string().uuid().nullable(),
  note: z.string().max(2000),
});
export const taskSchema = z.object({
  id,
  weddingId: id,
  title: z.string().min(1).max(200),
  owner: z.string().max(80),
  dueDate: date.nullable(),
  done: z.boolean(),
  sourceId: id.nullable(),
});
export const vendorSchema = z.object({
  id,
  weddingId: id,
  name: z.string().min(1).max(160),
  category: z.string().max(60),
  status: z.enum(["inquiry", "quoted", "negotiating", "confirmed"]),
  quoted: money,
  agreed: money,
  nextAmount: money,
  dueDate: date.nullable(),
});
export const paymentSchema = z.object({
  id,
  vendorId: id,
  weddingId: id,
  amount: money.positive(),
  date,
  reference: z.string().max(150),
  sourceId: id.nullable(),
});
export const analysisSchema = z.object({
  kind: z.enum(["negotiation", "payment", "planning"]),
  summary: z.string().max(500),
  vendorName: z.string().max(160).nullable(),
  category: z.string().max(60),
  dealStatus: z
    .enum(["inquiry", "quoted", "negotiating", "confirmed"])
    .nullable(),
  quotedAmount: money.nullable(),
  agreedAmount: money.nullable(),
  paymentAmount: money.nullable(),
  paymentEvidence: z.enum(["none", "claim", "receipt", "acknowledgment"]),
  transactionReference: z.string().max(150).nullable(),
  nextPayment: money.nullable(),
  dueDate: date.nullable(),
  taskTitle: z.string().max(200).nullable(),
  ownerName: z.string().max(80).nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  excerpt: z.string().max(500),
  warnings: z.array(z.string().max(200)).max(8),
});
export const updateSchema = z.object({
  id,
  weddingId: id,
  filename: z.string().max(160),
  createdAt: z.string(),
  expiresAt: z.string(),
  retained: z.boolean(),
  imageDeleted: z.boolean(),
  status: z.enum(["pending", "ready", "reviewed", "dismissed"]),
  analysis: analysisSchema.nullable(),
  source: z.enum(["image", "text", "sample"]),
  hash: z.string().max(128),
  reviewedAt: z.string().nullable(),
});
export const floorItemSchema = z.object({
  id,
  kind: z.enum(["table", "stage", "entrance"]),
  label: z.string().max(60),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
  seats: z.number().int().min(0).max(30),
});
export const floorplanSchema = z.object({
  weddingId: id,
  width: z.number().min(3).max(100),
  height: z.number().min(3).max(100),
  items: z.array(floorItemSchema).max(300),
});
export type FloorItem = z.infer<typeof floorItemSchema>;
export type Floorplan = z.infer<typeof floorplanSchema>;
// A Google Apps Script web app deployed from the couple's own Sheet.
export const sheetUrlPattern =
  /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{10,}\/exec$/;
export const inviteThemes = ["sage", "blush", "navy", "sand"] as const;
export const inviteEventSchema = z.object({
  id,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ không hợp lệ"),
  title: z.string().trim().min(1, "Nhập tên mốc lịch trình").max(80),
  note: z.string().max(200),
});
export const inviteFaqSchema = z.object({
  id,
  question: z.string().trim().min(1, "Nhập câu hỏi").max(160),
  answer: z.string().max(1000),
});
export const invitationSchema = z.object({
  weddingId: id,
  // Public link token; generated when a live invitation is first published.
  token: z.string().uuid().nullable(),
  published: z.boolean(),
  theme: z.enum(inviteThemes),
  // Empty names/venue fall back to the wedding record so the two stay in sync.
  names: z.string().max(120),
  headline: z.string().max(80),
  message: z.string().max(800),
  showLunar: z.boolean(),
  coverUrl: z
    .string()
    .max(500)
    .regex(/^(https:\/\/\S+)?$/, "Ảnh bìa cần là liên kết https://"),
  events: z.array(inviteEventSchema).max(10),
  venueName: z.string().max(160),
  venueAddress: z.string().max(240),
  mapUrl: z
    .string()
    .max(500)
    .regex(/^(https:\/\/\S+)?$/, "Liên kết bản đồ cần bắt đầu bằng https://"),
  dressCode: z.string().max(160),
  rsvpEnabled: z.boolean(),
  rsvpDeadline: date.nullable(),
  maxGuests: z.number().int().min(0).max(10),
  askDietary: z.boolean(),
  askSide: z.boolean(),
  giftNote: z.string().max(800),
  contact: z.string().max(200),
  faqs: z.array(inviteFaqSchema).max(20),
  sheetUrl: z
    .string()
    .max(300)
    .refine(
      (value) => !value || sheetUrlPattern.test(value),
      "Dán đúng liên kết Web app của Apps Script (…/exec)",
    ),
  updatedAt: z.string(),
});
export type Invitation = z.infer<typeof invitationSchema>;
export type InviteEvent = z.infer<typeof inviteEventSchema>;
export type InviteFaq = z.infer<typeof inviteFaqSchema>;
export type InviteTheme = (typeof inviteThemes)[number];
// What a guest answers on the invitation. `id` is generated on the guest's
// device so a second submission from that device updates the same answer.
export const rsvpInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+().\s-]*$/, "Số điện thoại không hợp lệ"),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(10),
  guestNames: z.string().trim().max(500),
  side: z.enum(["", "bride", "groom"]),
  dietary: z.string().trim().max(300),
  message: z.string().trim().max(1000),
});
export const rsvpSchema = rsvpInputSchema.extend({
  weddingId: id,
  source: z.enum(["invite", "manual", "sample"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RsvpInput = z.infer<typeof rsvpInputSchema>;
export type Rsvp = z.infer<typeof rsvpSchema>;
export const sideLabels = { "": "", bride: "Nhà gái", groom: "Nhà trai" };
export const workspaceSchema = z.object({
  teamName: z.string().min(1).max(120),
  members: z.array(z.string().min(1).max(80)).min(1).max(100),
  weddings: z.array(weddingSchema).max(300),
  tasks: z.array(taskSchema).max(3000),
  vendors: z.array(vendorSchema).max(3000),
  payments: z.array(paymentSchema).max(10000),
  updates: z.array(updateSchema).max(3000),
  floorplans: z.array(floorplanSchema).max(300),
  // Older saved workspaces predate invitations.
  invitations: z.array(invitationSchema).max(300).default([]),
  activity: z
    .array(z.object({ id, text: z.string().max(300), at: z.string() }))
    .max(200),
});
export type Wedding = z.infer<typeof weddingSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type Update = z.infer<typeof updateSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export const assistantSchema = z.object({
  message: z.string().max(2000),
  view: viewSchema.nullable(),
  weddingId: id.nullable(),
  task: z
    .object({
      weddingId: id,
      title: z.string().min(1).max(200),
      owner: z.string().max(80),
      dueDate: date.nullable(),
    })
    .nullable(),
});
export type AssistantResult = z.infer<typeof assistantSchema>;
