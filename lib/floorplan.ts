import type { FloorItem, Floorplan } from "./types";

export function constrainItem<
  T extends Pick<FloorItem, "x" | "y" | "width" | "height">,
>(item: T, width: number, height: number): T {
  return {
    ...item,
    width: Math.min(item.width, width),
    height: Math.min(item.height, height),
    x: Math.max(0, Math.min(item.x, Math.max(0, width - item.width))),
    y: Math.max(0, Math.min(item.y, Math.max(0, height - item.height))),
  };
}
const overlaps = (a: FloorItem, b: FloorItem) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
export function layoutWarnings(plan: Floorplan): string[] {
  const warnings: string[] = [];
  if (
    plan.items.some(
      (i) =>
        i.x + i.width > plan.width + 0.001 ||
        i.y + i.height > plan.height + 0.001,
    )
  )
    warnings.push("Có vật thể nằm ngoài kích thước phòng.");
  // The aisle is floor space, so the entrance may sit at its end.
  const solid = plan.items.filter((i) => i.kind !== "aisle");
  if (
    solid.some((a, index) => solid.slice(index + 1).some((b) => overlaps(a, b)))
  )
    warnings.push("Có vật thể chồng lên nhau. Kéo để bố trí lại.");
  const aisles = plan.items.filter((i) => i.kind === "aisle");
  if (
    plan.items.some(
      (t) => t.kind === "table" && aisles.some((a) => overlaps(t, a)),
    )
  )
    warnings.push("Có bàn nằm trên lối đi chính.");
  return warnings;
}

export type GroupStyle = "block" | "row";
export type LayoutOptions = {
  // Center aisle width in meters (0 = no aisle).
  aisle: number;
  // Tables per group (0 = fill whole rows, an even grid).
  groupSize: number;
  groupStyle: GroupStyle;
  // Edge-to-edge spacing between tables in a group and between groups.
  gap: number;
  walkway: number;
  // Free floor in front of the stage for the ceremony and photos.
  front: number;
  sides: Floorplan["sides"];
};
export type LayoutInput = LayoutOptions & {
  weddingId: string;
  width: number;
  height: number;
  tables: number;
  diameter: number;
  seats: number;
  stageWidth: number;
  stageDepth: number;
};
const GRID: LayoutOptions = {
  aisle: 0,
  groupSize: 0,
  groupStyle: "row",
  gap: 0.8,
  walkway: 0.8,
  front: 1.2,
  sides: "none",
};
export const layoutTemplates: {
  id: string;
  name: string;
  hint: string;
  options: LayoutOptions;
}[] = [
  {
    id: "aisle-4",
    name: "Lối giữa · nhóm 4",
    hint: "Khối 2×2 hai bên lối đi",
    options: {
      aisle: 2,
      groupSize: 4,
      groupStyle: "block",
      gap: 1,
      walkway: 1.5,
      front: 1.5,
      sides: "groom-left",
    },
  },
  {
    id: "aisle-6",
    name: "Lối giữa · nhóm 6",
    hint: "Khối 3×2 cho sảnh rộng",
    options: {
      aisle: 2,
      groupSize: 6,
      groupStyle: "block",
      gap: 1,
      walkway: 1.5,
      front: 1.5,
      sides: "groom-left",
    },
  },
  {
    id: "aisle-row-5",
    name: "Lối giữa · hàng 5",
    hint: "Mỗi bên hàng 5 bàn",
    options: {
      aisle: 2,
      groupSize: 5,
      groupStyle: "row",
      gap: 0.8,
      walkway: 1,
      front: 1.5,
      sides: "groom-left",
    },
  },
  {
    id: "grid",
    name: "Lưới đều",
    hint: "Không lối giữa, tiệc nhỏ",
    options: GRID,
  },
];
// Tables per row inside a group: "block" groups use two rows (5 → 3 + 2).
export function groupShape(size: number, style: GroupStyle): number[] {
  if (style === "row" || size < 3) return [size];
  const first = Math.ceil(size / 2);
  return [first, size - first];
}
export const groupLetter = (index: number) => {
  let label = "",
    n = index;
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
};

const MARGIN = 0.8,
  ENTRANCE = 1;
function measure(input: LayoutInput) {
  const {
    width,
    height,
    tables,
    diameter,
    seats,
    stageWidth,
    stageDepth,
    aisle,
    groupSize,
    gap,
    walkway,
    front,
  } = input;
  if (
    ![width, height, diameter, stageWidth, stageDepth].every(
      (v) => Number.isFinite(v) && v > 0,
    ) ||
    ![aisle, gap, walkway, front].every((v) => Number.isFinite(v) && v >= 0) ||
    width < 3 ||
    height < 3 ||
    width > 100 ||
    height > 100 ||
    !Number.isInteger(tables) ||
    tables < 0 ||
    tables > 200 ||
    !Number.isInteger(seats) ||
    seats < 1 ||
    seats > 30 ||
    !Number.isInteger(groupSize) ||
    groupSize < 0 ||
    groupSize > 12 ||
    diameter > Math.min(width, height) ||
    stageWidth > width ||
    stageDepth > height ||
    aisle >= width - 2 * MARGIN ||
    gap > 5 ||
    walkway > 10 ||
    front > height
  )
    throw new Error("Kiểm tra kích thước phòng, bàn, sân khấu và lối đi.");
  const pitch = diameter + gap;
  // Chairs need half a gap of clearance so they stay out of the aisle.
  const half = aisle > 0 ? aisle / 2 + gap / 2 : 0;
  const zones: [number, number][] =
    aisle > 0
      ? [
          [MARGIN, width / 2 - half],
          [width / 2 + half, width - MARGIN],
        ]
      : [[MARGIN, width - MARGIN]];
  const zoneWidth = zones[0][1] - zones[0][0];
  const fit = Math.floor((zoneWidth + gap) / pitch);
  const shape = groupSize > 0 ? groupShape(groupSize, input.groupStyle) : [fit];
  const cols = Math.max(...shape);
  if (fit < 1 || cols > fit)
    throw new Error(
      aisle > 0
        ? `Mỗi bên lối đi chỉ đủ ${Math.max(0, fit)} bàn một hàng. Chọn nhóm nhỏ hơn, thu hẹp lối đi hoặc tăng chiều rộng phòng.`
        : `Phòng chỉ đủ ${Math.max(0, fit)} bàn một hàng. Chọn nhóm nhỏ hơn hoặc tăng chiều rộng phòng.`,
    );
  const groupWidth = cols * pitch - gap,
    groupHeight = shape.length * pitch - gap;
  const across = Math.floor((zoneWidth + walkway) / (groupWidth + walkway));
  const top = stageDepth + front,
    bottom = height - MARGIN - (aisle > 0 ? ENTRANCE : 0);
  const bands = Math.max(
    0,
    Math.floor((bottom - top + walkway) / (groupHeight + walkway)),
  );
  const perGroup = shape.reduce((sum, n) => sum + n, 0);
  return {
    pitch,
    zones,
    zoneWidth,
    shape,
    groupWidth,
    groupHeight,
    across,
    bands,
    top,
    capacity: across * bands * perGroup * zones.length,
  };
}
// How many tables a layout can hold in this room (0 when it cannot fit).
export function layoutCapacity(input: LayoutInput) {
  try {
    return measure(input).capacity;
  } catch {
    return 0;
  }
}
const round = (value: number) => Math.round(value * 100) / 100;
export function generateLayout(input: LayoutInput): Floorplan {
  const m = measure(input);
  const { width, height, tables, diameter, seats, aisle, walkway } = input;
  if (tables > m.capacity)
    throw new Error(
      `Bố cục này đặt được tối đa ${m.capacity} bàn trong phòng ${width} × ${height} m. Giảm số bàn, đổi kiểu nhóm hoặc tăng kích thước phòng.`,
    );
  // Both sides of the aisle get the same number of tables (left takes the odd one).
  const counts =
    m.zones.length === 2
      ? [Math.ceil(tables / 2), Math.floor(tables / 2)]
      : [tables];
  const groups: {
    band: number;
    zone: number;
    col: number;
    spots: { x: number; y: number }[];
  }[] = [];
  m.zones.forEach(([left], zone) => {
    const used = m.across * m.groupWidth + (m.across - 1) * walkway;
    const start = left + (m.zoneWidth - used) / 2;
    let remaining = counts[zone];
    for (let band = 0; band < m.bands && remaining > 0; band++)
      for (let col = 0; col < m.across && remaining > 0; col++) {
        const gx = start + col * (m.groupWidth + walkway),
          gy = m.top + band * (m.groupHeight + walkway);
        const spots: { x: number; y: number }[] = [];
        for (let row = 0; row < m.shape.length && remaining > 0; row++) {
          const n = Math.min(m.shape[row], remaining);
          const rowX = gx + (m.groupWidth - (n * m.pitch - input.gap)) / 2;
          for (let i = 0; i < n; i++)
            spots.push({ x: rowX + i * m.pitch, y: gy + row * m.pitch });
          remaining -= n;
        }
        groups.push({ band, zone, col, spots });
      }
  });
  const items: FloorItem[] = [
    {
      id: crypto.randomUUID(),
      kind: "stage",
      label: "Sân khấu",
      x: round((width - input.stageWidth) / 2),
      y: 0,
      width: input.stageWidth,
      height: input.stageDepth,
      seats: 0,
      group: "",
    },
  ];
  if (aisle > 0)
    items.push(
      {
        id: crypto.randomUUID(),
        kind: "aisle",
        label: "Lối đi chính",
        x: round(width / 2 - aisle / 2),
        y: input.stageDepth,
        width: aisle,
        height: round(height - input.stageDepth),
        seats: 0,
        group: "",
      },
      {
        id: crypto.randomUUID(),
        kind: "entrance",
        label: "Lối vào",
        x: round(width / 2 - aisle / 2),
        y: height - 1,
        width: aisle,
        height: 1,
        seats: 0,
        group: "",
      },
    );
  // Numbering reads like the room: front to back, left side before right.
  groups.sort((a, b) => a.band - b.band || a.zone - b.zone || a.col - b.col);
  let number = 0;
  groups.forEach((group, index) =>
    group.spots.forEach(({ x, y }) =>
      items.push({
        id: crypto.randomUUID(),
        kind: "table",
        label: `Bàn ${++number}`,
        x: round(x),
        y: round(y),
        width: diameter,
        height: diameter,
        seats,
        group: input.groupSize > 0 ? groupLetter(index) : "",
      }),
    ),
  );
  return {
    weddingId: input.weddingId,
    width,
    height,
    items,
    sides: aisle > 0 ? input.sides : "none",
  };
}
// Even grid without an aisle (the original generator, kept for older callers).
export function generateFloorplan(
  weddingId: string,
  width: number,
  height: number,
  count: number,
  diameter: number,
  stageWidth: number,
  stageDepth: number,
  seats = 10,
): Floorplan {
  return generateLayout({
    ...GRID,
    weddingId,
    width,
    height,
    tables: count,
    diameter,
    seats,
    stageWidth,
    stageDepth,
  });
}
// Tables and seats on each side of the aisle, for "Nhà trai / Nhà gái" labels.
export function sideTotals(plan: Floorplan) {
  const aisle = plan.items.find((i) => i.kind === "aisle");
  if (!aisle) return null;
  const middle = aisle.x + aisle.width / 2;
  const tables = plan.items.filter((i) => i.kind === "table");
  const side = (left: boolean) => {
    const list = tables.filter((t) => t.x + t.width / 2 < middle === left);
    return {
      tables: list.length,
      seats: list.reduce((sum, t) => sum + t.seats, 0),
    };
  };
  return { left: side(true), right: side(false), middle };
}
