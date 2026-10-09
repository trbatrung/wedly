import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeText,
  applyAnalysis,
  imageExpired,
  RETENTION_MS,
  paidFor,
} from "../lib/domain";
import { demoWorkspace } from "../lib/demo";
import {
  generateFloorplan,
  constrainItem,
  layoutWarnings,
} from "../lib/floorplan";
import { workspaceSchema, weddingSchema } from "../lib/types";

test("a future deposit promise never becomes a paid payment", () => {
  const a = analyzeText(
    "Chốt decor 35 triệu. Sẽ chuyển 10 triệu trước 20/11.",
    "2026-11-15",
  );
  assert.equal(a.agreedAmount, 35000000);
  assert.equal(a.paymentAmount, null);
  assert.equal(a.nextPayment, 10000000);
  assert.equal(a.dueDate, "2026-11-20");
});
test("a price quote is not an agreement", () => {
  const a = analyzeText("Báo giá decor 38 triệu.", "2026-11-15");
  assert.equal(a.dealStatus, "quoted");
  assert.equal(a.agreedAmount, null);
  assert.equal(a.quotedAmount, 38000000);
});
test("relative and impossible dates are left unresolved", () => {
  assert.equal(
    analyzeText("Cọc 10 triệu trước thứ Sáu", "2026-11-15").dueDate,
    null,
  );
  assert.equal(
    analyzeText("Cọc 10 triệu trước 31/02/2026", "2026-11-15").dueDate,
    null,
  );
});
test("reading a source cannot extend its immutable 48h expiry", () => {
  const start = 1000;
  const update = {
    expiresAt: new Date(start + RETENTION_MS).toISOString(),
    retained: false,
    imageDeleted: false,
  };
  assert.equal(imageExpired(update, start + RETENTION_MS - 1), false);
  assert.equal(imageExpired(update, start + RETENTION_MS), true);
  assert.equal(
    imageExpired({ ...update, retained: true }, start + RETENTION_MS),
    false,
  );
  assert.equal(
    imageExpired({ ...update, retained: true, imageDeleted: true }, start),
    true,
  );
});
test("payment claims require explicit reviewer confirmation", () => {
  const state = demoWorkspace();
  state.updates[0].analysis!.paymentAmount = 3000000;
  const next = applyAnalysis(state, "u1", state.updates[0].analysis!, false);
  assert.equal(paidFor(next, "v1"), 5000000);
  assert.equal(next.updates[0].status, "reviewed");
});
test("one review cannot be applied twice", () => {
  const state = demoWorkspace();
  const next = applyAnalysis(state, "u1", state.updates[0].analysis!, false);
  assert.throws(
    () => applyAnalysis(next, "u1", state.updates[0].analysis!, false),
    /đã được xử lý/,
  );
});
test("duplicate transaction references cannot add payments twice", () => {
  const state = demoWorkspace();
  const a = {
    ...state.updates[0].analysis!,
    paymentAmount: 5000000,
    transactionReference: "DEMO-001",
  };
  assert.throws(() => applyAnalysis(state, "u1", a, true), /đã được ghi nhận/);
  assert.equal(state.payments.length, 2);
});
test("confirmed payments exceeding agreed amount are rejected", () => {
  const state = demoWorkspace();
  const a = { ...state.updates[0].analysis!, paymentAmount: 40000000 };
  assert.throws(() => applyAnalysis(state, "u1", a, true), /vượt giá trị/);
});
test("floorplan is generated in real meters without overlaps", () => {
  const plan = generateFloorplan("w", 20, 25, 28, 1.8, 6, 3);
  assert.equal(plan.items.filter((i) => i.kind === "table").length, 28);
  assert.equal(
    plan.items
      .filter((i) => i.kind === "table")
      .reduce((s, i) => s + i.seats, 0),
    280,
  );
  assert.deepEqual(layoutWarnings(plan), []);
  assert.ok(
    plan.items.every(
      (i) =>
        i.x >= 0 && i.y >= 0 && i.x + i.width <= 20 && i.y + i.height <= 25,
    ),
  );
});
test("impossible table counts and dimensions are rejected", () => {
  assert.throws(() => generateFloorplan("w", 5, 5, 100, 2, 4, 3));
  assert.throws(() => generateFloorplan("w", 20, 25, 10, 2, 21, 3));
  assert.throws(() => generateFloorplan("w", 0, 25, 10, 2, 6, 3));
});
test("dragged objects are constrained to room bounds", () => {
  const item = constrainItem(
    {
      id: "t",
      kind: "table",
      label: "Bàn 1",
      x: 99,
      y: -4,
      width: 2,
      height: 2,
      seats: 10,
    },
    20,
    25,
  );
  assert.equal(item.x, 18);
  assert.equal(item.y, 0);
});
test("fixture and calendar schema validate real dates", () => {
  assert.ok(workspaceSchema.safeParse(demoWorkspace()).success);
  const wedding = demoWorkspace().weddings[0];
  assert.equal(
    weddingSchema.safeParse({ ...wedding, date: "2026-02-31" }).success,
    false,
  );
});
