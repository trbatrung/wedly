import type { Analysis, Update, Workspace } from "./types";

export const RETENTION_MS = 48 * 60 * 60 * 1000;
export const money = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
export const shortMoney = (amount: number) =>
  amount >= 1e9
    ? `${+(amount / 1e9).toFixed(1)} tỷ`
    : amount >= 1e6
      ? `${+(amount / 1e6).toFixed(1)} triệu`
      : money(amount);
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(`${date}T12:00:00+07:00`))
    : "Chưa có hạn";
export const daysUntil = (date: string, from = today()) =>
  Math.round(
    (new Date(`${date}T12:00:00Z`).getTime() -
      new Date(`${from}T12:00:00Z`).getTime()) /
      86400000,
  );
export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
export const imageExpired = (
  update: Pick<Update, "expiresAt" | "retained" | "imageDeleted">,
  now = Date.now(),
) =>
  update.imageDeleted ||
  (!update.retained && new Date(update.expiresAt).getTime() <= now);
export const paidFor = (state: Workspace, vendorId: string) =>
  state.payments
    .filter((p) => p.vendorId === vendorId)
    .reduce((sum, p) => sum + p.amount, 0);
export const weddingPaid = (state: Workspace, weddingId: string) =>
  state.payments
    .filter((p) => p.weddingId === weddingId)
    .reduce((sum, p) => sum + p.amount, 0);
export const progressFor = (state: Workspace, weddingId: string) => {
  const tasks = state.tasks.filter((t) => t.weddingId === weddingId);
  return tasks.length
    ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
    : 0;
};
export function addActivity(state: Workspace, text: string): Workspace {
  return {
    ...state,
    activity: [
      { id: crypto.randomUUID(), text, at: new Date().toISOString() },
      ...state.activity,
    ].slice(0, 100),
  };
}

// This deterministic preview is intentionally limited to explicit pasted text.
// It never pretends to read an image or infer a payment from a future promise.
export function analyzeText(text: string, weddingDate: string): Analysis {
  const plain = normalize(text);
  const amount = (fragment?: string) => {
    if (!fragment) return null;
    const match = fragment.match(
      /(\d+(?:[.,]\d+)?)\s*(trieu|tr|ty|nghin|k|dong|vnd|d)\b/,
    );
    if (!match) return null;
    const unit = match[2];
    const n = Number(match[1].replace(",", "."));
    return Math.round(
      n *
        (/^(trieu|tr)$/.test(unit)
          ? 1e6
          : unit === "ty"
            ? 1e9
            : /^(nghin|k)$/.test(unit)
              ? 1000
              : 1),
    );
  };
  const findAmount = (pattern: RegExp) => amount(plain.match(pattern)?.[1]);
  const explicitAgreed = /\b(chot|dong y|thong nhat)\b/.test(plain);
  const paid = findAmount(
    /(?:da (?:chuyen|nhan|thanh toan)|nhan duoc)\s*(.{0,35})/,
  );
  const next = findAmount(
    /(?:chuyen them|coc|thanh toan tiep|se chuyen)\s*(.{0,35})/,
  );
  const quoted =
    findAmount(/(?:bao gia|tong|chot|gia)\s*(.{0,40})/) ?? amount(plain);
  const dateMatch = plain.match(
    /\b(?:truoc|ngay|han)\s*(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{4}))?/,
  );
  let dueDate: string | null = null;
  const warnings: string[] = [];
  if (dateMatch) {
    const year = dateMatch[3] ?? weddingDate.slice(0, 4);
    const candidate = `${year}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
    const parsed = new Date(`${candidate}T12:00:00Z`);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === candidate
    )
      dueDate = candidate;
    else warnings.push("Ngày trong nội dung không hợp lệ; hãy kiểm tra lại.");
    if (!dateMatch[3])
      warnings.push(
        "Nội dung chưa có năm. Năm được lấy theo đám cưới; hãy kiểm tra lại.",
      );
  }
  if (/\b(mai|thu sau|thu bay|tuan sau)\b/.test(plain))
    warnings.push("Mốc thời gian tương đối cần đối chiếu ngày gửi tin nhắn.");
  if (paid)
    warnings.push(
      "Đây là thông báo thanh toán; cần kiểm tra chứng từ và khoản đã ghi nhận.",
    );
  const category = /decor|trang tri/.test(plain)
    ? "Trang trí"
    : /makeup|trang diem/.test(plain)
      ? "Trang điểm"
      : /nha hang|catering/.test(plain)
        ? "Nhà hàng"
        : "Khác";
  return {
    kind: paid ? "payment" : quoted ? "negotiation" : "planning",
    summary: text.slice(0, 250),
    vendorName: null,
    category,
    dealStatus: explicitAgreed
      ? "confirmed"
      : /thuong luong|giam gia|bot/.test(plain)
        ? "negotiating"
        : quoted
          ? "quoted"
          : null,
    quotedAmount: quoted,
    agreedAmount: explicitAgreed ? quoted : null,
    paymentAmount: paid,
    paymentEvidence: paid ? "claim" : "none",
    transactionReference: null,
    nextPayment: next,
    dueDate,
    taskTitle: next ? "Kiểm tra và thanh toán khoản đến hạn" : null,
    ownerName: null,
    confidence: "low",
    excerpt: text.slice(0, 400),
    warnings: [
      "Đề xuất từ nội dung bạn nhập; chưa có phân tích ảnh bằng AI.",
      ...warnings,
    ],
  };
}

export function applyAnalysis(
  state: Workspace,
  updateId: string,
  analysis: Analysis,
  confirmPayment: boolean,
): Workspace {
  const update = state.updates.find((u) => u.id === updateId);
  if (!update || update.status === "reviewed" || update.status === "dismissed")
    throw new Error("Cập nhật này đã được xử lý.");
  if (!state.weddings.some((w) => w.id === update.weddingId))
    throw new Error("Không tìm thấy đám cưới.");
  const next = structuredClone(state);
  let vendor = analysis.vendorName
    ? next.vendors.find(
        (v) =>
          v.weddingId === update.weddingId &&
          normalize(v.name.trim()) === normalize(analysis.vendorName!.trim()),
      )
    : undefined;
  const hasCost =
    analysis.agreedAmount !== null ||
    analysis.quotedAmount !== null ||
    !!analysis.paymentAmount ||
    analysis.nextPayment !== null;
  if (hasCost && !analysis.vendorName?.trim())
    throw new Error("Chọn nhà cung cấp trước khi cập nhật chi phí.");
  if (!vendor && analysis.vendorName?.trim()) {
    vendor = {
      id: crypto.randomUUID(),
      weddingId: update.weddingId,
      name: analysis.vendorName.trim(),
      category: analysis.category,
      status: analysis.dealStatus ?? "inquiry",
      quoted: 0,
      agreed: 0,
      nextAmount: 0,
      dueDate: null,
    };
    next.vendors.push(vendor);
  }
  if (vendor) {
    if (analysis.dealStatus) vendor.status = analysis.dealStatus;
    if (analysis.quotedAmount !== null) vendor.quoted = analysis.quotedAmount;
    if (analysis.agreedAmount !== null) {
      if (analysis.agreedAmount < paidFor(next, vendor.id))
        throw new Error(
          "Giá trị thỏa thuận không thể nhỏ hơn khoản đã thanh toán.",
        );
      vendor.agreed = analysis.agreedAmount;
    }
    if (analysis.nextPayment !== null) vendor.nextAmount = analysis.nextPayment;
    if (analysis.dueDate) vendor.dueDate = analysis.dueDate;
    if (
      confirmPayment &&
      analysis.paymentAmount &&
      analysis.paymentAmount > 0
    ) {
      if (
        analysis.transactionReference &&
        next.payments.some((p) => p.reference === analysis.transactionReference)
      )
        throw new Error(
          "Mã giao dịch này đã được ghi nhận. Hãy kiểm tra để tránh tính hai lần.",
        );
      if (
        vendor.agreed > 0 &&
        paidFor(next, vendor.id) + analysis.paymentAmount > vendor.agreed
      )
        throw new Error(
          "Khoản thanh toán vượt giá trị thỏa thuận. Hãy kiểm tra lại số tiền.",
        );
      next.payments.push({
        id: crypto.randomUUID(),
        weddingId: update.weddingId,
        vendorId: vendor.id,
        amount: analysis.paymentAmount,
        date: today(),
        reference: analysis.transactionReference ?? "",
        sourceId: updateId,
      });
    }
  }
  if (analysis.taskTitle?.trim())
    next.tasks.push({
      id: crypto.randomUUID(),
      weddingId: update.weddingId,
      title: analysis.taskTitle.trim(),
      owner: analysis.ownerName ?? "",
      dueDate: analysis.dueDate,
      done: false,
      sourceId: updateId,
    });
  const target = next.updates.find((u) => u.id === updateId)!;
  target.status = "reviewed";
  target.reviewedAt = new Date().toISOString();
  target.analysis = analysis;
  return addActivity(
    next,
    `Đã xác nhận cập nhật cho ${next.weddings.find((w) => w.id === update.weddingId)!.couple}`,
  );
}
