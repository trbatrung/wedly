import test from "node:test";
import assert from "node:assert/strict";
import {
  generateLayout,
  groupLetter,
  groupShape,
  layoutCapacity,
  layoutTemplates,
  layoutWarnings,
  sideTotals,
  type LayoutInput,
} from "../lib/floorplan";
import { floorplanSchema } from "../lib/types";

const room = (id: string, extra: Partial<LayoutInput> = {}): LayoutInput => ({
  ...layoutTemplates.find((t) => t.id === id)!.options,
  weddingId: "w",
  width: 30,
  height: 25,
  tables: 35,
  diameter: 1.8,
  seats: 10,
  stageWidth: 6,
  stageDepth: 3,
  ...extra,
});
const tablesOf = (plan: ReturnType<typeof generateLayout>) =>
  plan.items.filter((i) => i.kind === "table");

test("center aisle stays clear and both sides get the same number of tables", () => {
  const plan = generateLayout(room("aisle-4"));
  const aisle = plan.items.find((i) => i.kind === "aisle")!;
  assert.ok(aisle, "an aisle is drawn from the stage to the entrance");
  assert.equal(aisle.y, 3);
  assert.equal(aisle.y + aisle.height, 25);
  for (const t of tablesOf(plan))
    assert.ok(
      t.x + t.width <= aisle.x - 0.5 || t.x >= aisle.x + aisle.width + 0.5,
      `${t.label} keeps half a gap of chair space from the aisle`,
    );
  const sides = sideTotals(plan)!;
  assert.deepEqual(
    [sides.left.tables, sides.right.tables],
    [18, 17],
    "odd table goes to the left side",
  );
  assert.equal(sides.left.seats + sides.right.seats, 350);
  assert.deepEqual(layoutWarnings(plan), []);
  assert.equal(plan.sides, "groom-left");
  assert.ok(floorplanSchema.safeParse(plan).success);
});

test("tables are grouped in the chosen size with numbering by group", () => {
  const plan = generateLayout(room("aisle-6"));
  const byGroup = new Map<string, string[]>();
  for (const t of tablesOf(plan))
    byGroup.set(t.group, [...(byGroup.get(t.group) ?? []), t.label]);
  assert.ok(Array.from(byGroup.values()).every((labels) => labels.length <= 6));
  assert.deepEqual(byGroup.get("A"), [
    "Bàn 1",
    "Bàn 2",
    "Bàn 3",
    "Bàn 4",
    "Bàn 5",
    "Bàn 6",
  ]);
  // Group A (front left) and B (front right) mirror each other across the aisle.
  const a = tablesOf(plan).filter((t) => t.group === "A");
  const b = tablesOf(plan).filter((t) => t.group === "B");
  const minX = (list: typeof a) => Math.min(...list.map((t) => t.x));
  const maxX = (list: typeof a) => Math.max(...list.map((t) => t.x + t.width));
  assert.ok(Math.abs(minX(a) - (30 - maxX(b))) < 0.02);
  assert.deepEqual(groupShape(5, "block"), [3, 2]);
  assert.deepEqual(groupShape(4, "block"), [2, 2]);
  assert.deepEqual(groupShape(5, "row"), [5]);
  assert.deepEqual(
    [groupLetter(0), groupLetter(25), groupLetter(26)],
    ["A", "Z", "AA"],
  );
});

test("each template reports what fits instead of overlapping tables", () => {
  assert.equal(layoutCapacity(room("aisle-4")), 48);
  // Rows of five do not fit beside a 2 m aisle in a 20 m wide room.
  assert.equal(layoutCapacity(room("aisle-row-5", { width: 20 })), 0);
  assert.throws(
    () => generateLayout(room("aisle-row-5", { width: 20 })),
    /chỉ đủ 3 bàn một hàng/,
  );
  assert.throws(
    () => generateLayout(room("aisle-4", { width: 20 })),
    /tối đa 24 bàn/,
  );
  assert.throws(() => generateLayout(room("aisle-4", { aisle: 29 })));
});

test("a table dragged onto the aisle is flagged", () => {
  const plan = generateLayout(room("aisle-4"));
  const aisle = plan.items.find((i) => i.kind === "aisle")!;
  const moved = {
    ...plan,
    items: plan.items.map((i) =>
      i.label === "Bàn 1" ? { ...i, x: aisle.x + 0.1 } : i,
    ),
  };
  assert.ok(layoutWarnings(moved).includes("Có bàn nằm trên lối đi chính."));
});

test("plans saved before groups and aisles still load", () => {
  const legacy = {
    weddingId: "w",
    width: 20,
    height: 25,
    items: [
      {
        id: "t",
        kind: "table",
        label: "Bàn 1",
        x: 1,
        y: 5,
        width: 1.8,
        height: 1.8,
        seats: 10,
      },
    ],
  };
  const parsed = floorplanSchema.parse(legacy);
  assert.equal(parsed.sides, "none");
  assert.equal(parsed.items[0].group, "");
});
