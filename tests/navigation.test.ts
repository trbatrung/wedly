import test from "node:test";
import assert from "node:assert/strict";
import { filterCommands, type Command } from "../lib/search";

const noop = () => {};
const commands: Command[] = [
  { id: "new-task", group: "Tạo mới", label: "Thêm công việc", run: noop },
  { id: "page-tasks", group: "Trang", label: "Công việc", run: noop },
  {
    id: "w1",
    group: "Đám cưới",
    label: "Minh & Anh",
    hint: "15/11/2026",
    run: noop,
  },
  {
    id: "w1-guests",
    group: "Đám cưới",
    label: "Minh & Anh › Khách mời",
    deep: true,
    run: noop,
  },
  { id: "w2", group: "Đám cưới", label: "Nam & Linh", run: noop },
  {
    id: "t1",
    group: "Công việc",
    label: "Xác nhận thực đơn với nhà hàng",
    hint: "Minh & Anh",
    run: noop,
  },
];
const order = ["Đám cưới", "Công việc", "Trang", "Tạo mới"];

test("palette search ignores Vietnamese diacritics and word order", () => {
  assert.deepEqual(
    filterCommands(commands, "khach moi minh", order).map((c) => c.id),
    ["w1-guests"],
  );
  assert.deepEqual(
    filterCommands(commands, "thuc don", order).map((c) => c.id),
    ["t1"],
  );
});

test("palette ranks the wedding itself before its deep links", () => {
  const ids = filterCommands(commands, "minh", order).map((c) => c.id);
  assert.deepEqual(ids.slice(0, 2), ["w1", "w1-guests"]);
  assert.ok(ids.includes("t1"), "tasks of the wedding match by hint");
});

test("an empty palette hides deep links and follows group order", () => {
  const ids = filterCommands(commands, "", [
    "Tạo mới",
    "Trang",
    "Đám cưới",
  ]).map((c) => c.id);
  assert.equal(ids.includes("w1-guests"), false);
  assert.deepEqual(ids.slice(0, 2), ["new-task", "page-tasks"]);
});
