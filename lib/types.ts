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
export const workspaceSchema = z.object({
  teamName: z.string().min(1).max(120),
  members: z.array(z.string().min(1).max(80)).min(1).max(100),
  weddings: z.array(weddingSchema).max(300),
  tasks: z.array(taskSchema).max(3000),
  vendors: z.array(vendorSchema).max(3000),
  payments: z.array(paymentSchema).max(10000),
  updates: z.array(updateSchema).max(3000),
  floorplans: z.array(floorplanSchema).max(300),
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
