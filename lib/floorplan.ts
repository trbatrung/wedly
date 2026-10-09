import type { FloorItem, Floorplan } from "./types";

export function constrainItem(
  item: FloorItem,
  width: number,
  height: number,
): FloorItem {
  return {
    ...item,
    width: Math.min(item.width, width),
    height: Math.min(item.height, height),
    x: Math.max(0, Math.min(item.x, Math.max(0, width - item.width))),
    y: Math.max(0, Math.min(item.y, Math.max(0, height - item.height))),
  };
}
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
  const hasOverlap = plan.items.some((a, index) =>
    plan.items
      .slice(index + 1)
      .some(
        (b) =>
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y,
      ),
  );
  if (hasOverlap)
    warnings.push("Có vật thể chồng lên nhau. Kéo để bố trí lại.");
  return warnings;
}
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
  if (
    ![width, height, diameter, stageWidth, stageDepth].every(
      (v) => Number.isFinite(v) && v > 0,
    ) ||
    width < 3 ||
    height < 3 ||
    width > 100 ||
    height > 100 ||
    count < 0 ||
    count > 200 ||
    !Number.isInteger(count) ||
    seats < 1 ||
    seats > 30 ||
    !Number.isInteger(seats) ||
    diameter > Math.min(width, height) ||
    stageWidth > width ||
    stageDepth > height
  )
    throw new Error("Kiểm tra kích thước phòng, bàn và sân khấu.");
  const margin = 0.8,
    gap = 0.8;
  const columns = Math.max(
    1,
    Math.floor((width - 2 * margin + gap) / (diameter + gap)),
  );
  const firstRow = stageDepth + 1.2;
  const rows = Math.max(
    0,
    Math.floor((height - firstRow - margin + gap) / (diameter + gap)),
  );
  if (count > rows * columns)
    throw new Error(
      `Phòng này bố trí được khoảng ${rows * columns} bàn với khoảng cách hiện tại. Hãy giảm số bàn hoặc tăng kích thước phòng.`,
    );
  const items: FloorItem[] = [
    {
      id: crypto.randomUUID(),
      kind: "stage",
      label: "Sân khấu",
      x: (width - stageWidth) / 2,
      y: 0,
      width: stageWidth,
      height: stageDepth,
      seats: 0,
    },
  ];
  for (let index = 0; index < count; index++) {
    const row = Math.floor(index / columns),
      col = index % columns;
    const rowCount = Math.min(columns, count - row * columns);
    const occupied = rowCount * diameter + (rowCount - 1) * gap;
    items.push({
      id: crypto.randomUUID(),
      kind: "table",
      label: `Bàn ${index + 1}`,
      x: (width - occupied) / 2 + col * (diameter + gap),
      y: firstRow + row * (diameter + gap),
      width: diameter,
      height: diameter,
      seats,
    });
  }
  return { weddingId, width, height, items };
}
