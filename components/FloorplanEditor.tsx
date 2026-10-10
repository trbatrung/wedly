"use client";
import { useMemo, useState, useRef, type CSSProperties } from "react";
import {
  Grid2X2,
  Printer,
  Save,
  Plus,
  Trash2,
  Move,
  Circle,
  Square,
  AlertTriangle,
  Download,
  Minus,
  Check,
} from "lucide-react";
import type { Floorplan, FloorItem, Wedding } from "@/lib/types";
import {
  constrainItem,
  generateLayout,
  layoutCapacity,
  layoutTemplates,
  layoutWarnings,
  sideTotals,
  type LayoutInput,
  type LayoutOptions,
} from "@/lib/floorplan";

const sideNames = {
  none: null,
  "groom-left": ["Nhà trai", "Nhà gái"],
  "bride-left": ["Nhà gái", "Nhà trai"],
} as const;
// Templates are drawn by the real generator in a sample room.
const thumbnails = layoutTemplates.map((t) => {
  try {
    return generateLayout({
      ...t.options,
      weddingId: "preview",
      width: 30,
      height: 24,
      tables: t.options.groupSize === 6 ? 24 : 20,
      diameter: 1.8,
      seats: 10,
      stageWidth: 7,
      stageDepth: 2.5,
    });
  } catch {
    return null;
  }
});
function Thumbnail({ plan }: { plan: Floorplan | null }) {
  if (!plan) return null;
  return (
    <svg viewBox={`0 0 ${plan.width} ${plan.height}`} aria-hidden>
      <rect width={plan.width} height={plan.height} rx="1" fill="#fff" />
      {plan.items.map((i) =>
        i.kind === "table" ? (
          <circle
            key={i.id}
            cx={i.x + i.width / 2}
            cy={i.y + i.height / 2}
            r={i.width / 2}
            fill="#c9d9bb"
          />
        ) : i.kind === "entrance" ? null : (
          <rect
            key={i.id}
            x={i.x}
            y={i.y}
            width={i.width}
            height={i.height}
            fill={i.kind === "aisle" ? "#f1e4cf" : "#d9cfbd"}
          />
        ),
      )}
    </svg>
  );
}

export default function FloorplanEditor({
  wedding,
  saved,
  onSave,
  busy,
  confirmedGuests = 0,
  confirmedBySide = { groom: 0, bride: 0 },
}: {
  wedding: Wedding;
  saved?: Floorplan;
  onSave: (plan: Floorplan) => Promise<void>;
  busy: boolean;
  confirmedGuests?: number;
  confirmedBySide?: { groom: number; bride: number };
}) {
  const [plan, setPlan] = useState<Floorplan>(
    () =>
      saved ?? {
        weddingId: wedding.id,
        width: 20,
        height: 25,
        items: [],
        sides: "none",
      },
  );
  const [width, setWidth] = useState(saved?.width ?? 20),
    [height, setHeight] = useState(saved?.height ?? 25);
  const [count, setCount] = useState(
    saved?.items.filter((i) => i.kind === "table").length ||
      Math.ceil(wedding.guestCount / 10),
  );
  const [diameter, setDiameter] = useState(1.8),
    [stageWidth, setStageWidth] = useState(6),
    [stageDepth, setStageDepth] = useState(3),
    [seats, setSeats] = useState(10);
  const [options, setOptions] = useState<LayoutOptions>(() => {
    const savedAisle = saved?.items.find((i) => i.kind === "aisle");
    return savedAisle
      ? { ...layoutTemplates[0].options, aisle: savedAisle.width }
      : layoutTemplates[0].options;
  });
  const [template, setTemplate] = useState<string | null>(
    saved ? null : layoutTemplates[0].id,
  );
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    // Saved plans and dragged tables are manual work worth confirming over.
    [manual, setManual] = useState(Boolean(saved));
  const svgRef = useRef<SVGSVGElement>(null),
    drag = useRef<{ id: string; offsetX: number; offsetY: number } | null>(
      null,
    );
  const selectedItem = plan.items.find((i) => i.id === selected),
    warnings = layoutWarnings(plan);
  const totalSeats = plan.items.reduce(
    (s, item) => s + (item.kind === "table" ? item.seats : 0),
    0,
  );
  const input = (layout: LayoutOptions): LayoutInput => ({
    ...layout,
    weddingId: wedding.id,
    width,
    height,
    tables: count,
    diameter,
    seats,
    stageWidth,
    stageDepth,
  });
  const capacity = layoutCapacity(input(options));
  const pendingSize =
    plan.items.length > 0 && (plan.width !== width || plan.height !== height);
  const sides = sideTotals(plan),
    names = sideNames[plan.sides];
  const groupBoxes = useMemo(() => {
    const boxes = new Map<
      string,
      { x0: number; y0: number; x1: number; y1: number }
    >();
    for (const t of plan.items)
      if (t.kind === "table" && t.group) {
        const box = boxes.get(t.group);
        boxes.set(t.group, {
          x0: Math.min(box?.x0 ?? t.x, t.x),
          y0: Math.min(box?.y0 ?? t.y, t.y),
          x1: Math.max(box?.x1 ?? t.x + t.width, t.x + t.width),
          y1: Math.max(box?.y1 ?? t.y + t.height, t.y + t.height),
        });
      }
    return Array.from(boxes);
  }, [plan.items]);
  function updateItem(id: string, change: Partial<FloorItem>) {
    setPlan((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? constrainItem({ ...item, ...change }, prev.width, prev.height)
          : item,
      ),
    }));
    setDirty(true);
    setManual(true);
  }
  function generate(layout = options) {
    try {
      setPlan(generateLayout(input(layout)));
      setSelected(null);
      setDirty(true);
      setManual(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function setOption(change: Partial<LayoutOptions>) {
    setOptions((o) => ({ ...o, ...change }));
    setTemplate(null);
  }
  function chooseTemplate(id: string) {
    const chosen = layoutTemplates.find((t) => t.id === id)!;
    if (
      manual &&
      plan.items.length &&
      !window.confirm(
        "Áp dụng bố cục mẫu sẽ thay vị trí bàn hiện tại. Tiếp tục?",
      )
    )
      return;
    setOptions(chosen.options);
    setTemplate(id);
    generate(chosen.options);
  }
  function point(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const p = new DOMPoint(clientX, clientY);
    return p.matrixTransform(svg.getScreenCTM()!.inverse());
  }
  function exportSvg() {
    if (!svgRef.current) return;
    const copy = svgRef.current.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", "1000");
    copy.setAttribute(
      "height",
      String((1000 * (plan.height + 2)) / (plan.width + 2)),
    );
    const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `so-do-${wedding.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const number = (
    label: string,
    value: number,
    set: (n: number) => void,
    attrs: { min: number; max: number; step?: number },
  ) => (
    <label className="field">
      {label}
      <input
        type="number"
        min={attrs.min}
        max={attrs.max}
        step={attrs.step ?? 1}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </label>
  );
  return (
    <div className="floor-layout">
      <div className="panel floor-tools">
        <div>
          <div className="section-head">
            <h2>Bố cục mẫu</h2>
            <Grid2X2 size={17} className="muted" />
          </div>
          <div className="layout-templates">
            {layoutTemplates.map((t, i) => {
              const fits = layoutCapacity(input(t.options));
              return (
                <button
                  key={t.id}
                  className={`layout-template ${template === t.id ? "active" : ""}`}
                  aria-pressed={template === t.id}
                  onClick={() => chooseTemplate(t.id)}
                >
                  <Thumbnail plan={thumbnails[i]} />
                  <strong>{t.name}</strong>
                  <small className={fits >= count ? "" : "short"}>
                    {fits ? `Tối đa ${fits} bàn` : "Không vừa phòng"}
                  </small>
                </button>
              );
            })}
          </div>
          <p className="field-hint">
            Chọn mẫu để tạo ngay; sau đó kéo từng bàn để chỉnh.
          </p>
        </div>
        <div>
          <div className="divider" />
          <p className="floor-group-title">Phòng & bàn</p>
          <div className="fields">
            {number("Rộng phòng (m)", width, setWidth, {
              min: 3,
              max: 100,
              step: 0.5,
            })}
            {number("Dài phòng (m)", height, setHeight, {
              min: 3,
              max: 100,
              step: 0.5,
            })}
            {number("Số bàn", count, setCount, { min: 0, max: 200 })}
            {number("Khách mỗi bàn", seats, setSeats, { min: 1, max: 30 })}
            {confirmedGuests > 0 && (
              <button
                type="button"
                className="guest-hint"
                style={{ gridColumn: "1/-1" }}
                onClick={() =>
                  setCount(Math.ceil(confirmedGuests / Math.max(1, seats)))
                }
              >
                {confirmedGuests} khách xác nhận → dùng{" "}
                {Math.ceil(confirmedGuests / Math.max(1, seats))} bàn
              </button>
            )}
            <div style={{ gridColumn: "1/-1" }}>
              {number("Đường kính bàn (m)", diameter, setDiameter, {
                min: 0.5,
                max: 5,
                step: 0.1,
              })}
            </div>
          </div>
        </div>
        <div>
          <div className="divider" />
          <p className="floor-group-title">Lối đi & nhóm bàn</p>
          <div className="fields">
            {number(
              "Lối đi giữa (m)",
              options.aisle,
              (aisle) => setOption({ aisle: Math.max(0, aisle) }),
              { min: 0, max: 10, step: 0.5 },
            )}
            <label className="field">
              Hai bên lối đi
              <select
                value={options.sides}
                disabled={!options.aisle}
                onChange={(e) => {
                  const value = e.target.value as Floorplan["sides"];
                  setOption({ sides: value });
                  if (plan.items.some((i) => i.kind === "aisle")) {
                    setPlan((p) => ({ ...p, sides: value }));
                    setDirty(true);
                  }
                }}
              >
                <option value="groom-left">Trai trái · Gái phải</option>
                <option value="bride-left">Gái trái · Trai phải</option>
                <option value="none">Không ghi</option>
              </select>
            </label>
            <div className="field" style={{ gridColumn: "1/-1" }}>
              Bàn mỗi nhóm
              <div className="segmented floor-segmented">
                {[4, 5, 6, 0].map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={options.groupSize === size}
                    className={options.groupSize === size ? "active" : ""}
                    onClick={() => setOption({ groupSize: size })}
                  >
                    {size || "Không chia"}
                  </button>
                ))}
              </div>
            </div>
            {options.groupSize > 2 && (
              <div className="field" style={{ gridColumn: "1/-1" }}>
                Xếp trong nhóm
                <div className="segmented floor-segmented">
                  {(
                    [
                      ["block", "Khối 2 hàng"],
                      ["row", "Một hàng"],
                    ] as const
                  ).map(([style, label]) => (
                    <button
                      key={style}
                      type="button"
                      aria-pressed={options.groupStyle === style}
                      className={options.groupStyle === style ? "active" : ""}
                      onClick={() => setOption({ groupStyle: style })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <details className="input-details floor-spacing">
            <summary>Khoảng cách</summary>
            <div className="fields">
              {number(
                "Giữa các bàn (m)",
                options.gap,
                (gap) => setOption({ gap }),
                { min: 0.3, max: 5, step: 0.1 },
              )}
              {number(
                "Giữa các nhóm (m)",
                options.walkway,
                (walkway) => setOption({ walkway }),
                { min: 0, max: 10, step: 0.1 },
              )}
              {number(
                "Trước sân khấu (m)",
                options.front,
                (front) => setOption({ front }),
                { min: 0, max: 20, step: 0.5 },
              )}
            </div>
          </details>
        </div>
        <div>
          <div className="divider" />
          <p className="floor-group-title">Sân khấu</p>
          <div className="fields">
            {number("Rộng (m)", stageWidth, setStageWidth, {
              min: 1,
              max: 100,
              step: 0.5,
            })}
            {number("Sâu (m)", stageDepth, setStageDepth, {
              min: 1,
              max: 100,
              step: 0.5,
            })}
          </div>
          <button
            className="btn primary"
            style={{ width: "100%", marginTop: 18 }}
            onClick={() => generate()}
          >
            <Grid2X2 size={15} />
            {plan.items.length ? "Tạo lại bố trí" : "Tạo sơ đồ"}
          </button>
          <p
            className={`floor-capacity ${capacity >= count ? "" : "short"}`}
            role="status"
          >
            {capacity >= count ? (
              <Check size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            {capacity
              ? `Cài đặt này chứa tối đa ${capacity} bàn`
              : "Cài đặt này không vừa phòng"}
          </p>
          {pendingSize && (
            <p className="field-hint">
              Kích thước mới sẽ áp dụng khi tạo lại bố trí.
            </p>
          )}
          {error && (
            <div
              className="notice error"
              role="alert"
              style={{ marginTop: 12 }}
            >
              {error}
            </div>
          )}
        </div>
        {selectedItem && (
          <div className="floor-selected">
            <strong>
              {selectedItem.label}
              {selectedItem.group && ` · Nhóm ${selectedItem.group}`}
            </strong>
            <div className="fields">
              <label className="field">
                Vị trí X (m)
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={+selectedItem.x.toFixed(2)}
                  onChange={(e) =>
                    updateItem(selectedItem.id, { x: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field">
                Vị trí Y (m)
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={+selectedItem.y.toFixed(2)}
                  onChange={(e) =>
                    updateItem(selectedItem.id, { y: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field" style={{ gridColumn: "1/-1" }}>
                Tên
                <input
                  maxLength={60}
                  value={selectedItem.label}
                  onChange={(e) =>
                    updateItem(selectedItem.id, { label: e.target.value })
                  }
                />
              </label>
              {selectedItem.kind === "table" && (
                <label className="field">
                  Số chỗ
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={selectedItem.seats}
                    onChange={(e) =>
                      updateItem(selectedItem.id, {
                        seats: Number(e.target.value),
                      })
                    }
                  />
                </label>
              )}
              <label className="field">
                {selectedItem.kind === "table" ? "Đường kính (m)" : "Rộng (m)"}
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={selectedItem.width}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value > 0)
                      updateItem(
                        selectedItem.id,
                        selectedItem.kind === "table"
                          ? { width: value, height: value }
                          : { width: value },
                      );
                  }}
                />
              </label>
              {selectedItem.kind !== "table" && (
                <label className="field">
                  {selectedItem.kind === "aisle" ? "Dài (m)" : "Sâu (m)"}
                  <input
                    type="number"
                    min="0.5"
                    step="0.1"
                    value={selectedItem.height}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value > 0)
                        updateItem(selectedItem.id, { height: value });
                    }}
                  />
                </label>
              )}
            </div>
            <button
              className="btn small danger"
              style={{ marginTop: 12 }}
              onClick={() => {
                setPlan({
                  ...plan,
                  items: plan.items.filter((i) => i.id !== selectedItem.id),
                });
                setSelected(null);
                setDirty(true);
                setManual(true);
              }}
            >
              <Trash2 size={13} />
              Xóa vật thể
            </button>
          </div>
        )}
      </div>
      <div className="panel">
        <div className="section-head floor-toolbar">
          <div>
            <h2>{wedding.couple} · Sơ đồ bàn tiệc</h2>
            <p className="muted" style={{ fontSize: 11, marginTop: 5 }}>
              {plan.width} × {plan.height} m ·{" "}
              {plan.items.filter((i) => i.kind === "table").length} bàn ·{" "}
              {totalSeats} chỗ{dirty ? " · Chưa lưu" : saved ? " · Đã lưu" : ""}
            </p>
          </div>
          <div className="row">
            <button
              className="icon-button"
              title="Tải sơ đồ SVG"
              aria-label="Tải sơ đồ SVG"
              onClick={exportSvg}
            >
              <Download size={16} />
            </button>
            <button
              className="icon-button"
              title="In hoặc lưu PDF"
              aria-label="In hoặc lưu PDF"
              onClick={() => window.print()}
            >
              <Printer size={16} />
            </button>
            <button
              className="btn small primary"
              disabled={busy || !dirty}
              onClick={async () => {
                try {
                  await onSave(plan);
                  setDirty(false);
                } catch {
                  /* Parent displays a save error. */
                }
              }}
            >
              <Save size={14} />
              Lưu
            </button>
          </div>
        </div>
        <div
          className="between floor-toolbar"
          style={{ marginBottom: 12, fontSize: 11 }}
        >
          <span className="muted">
            Xem toàn phòng hoặc phóng to để bố trí chi tiết
          </span>
          <div className="row">
            <button
              className="icon-button"
              aria-label="Thu nhỏ sơ đồ"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            >
              <Minus size={14} />
            </button>
            <button
              className="text-link"
              onClick={() => setZoom(1)}
              aria-label="Về kích thước toàn phòng"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="icon-button"
              aria-label="Phóng to sơ đồ"
              disabled={zoom >= 3}
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div
          className="floor-canvas"
          style={{ "--floor-zoom": zoom } as CSSProperties}
        >
          <svg
            ref={svgRef}
            className="floor-svg"
            viewBox={`-1.5 -1.5 ${plan.width + 3} ${plan.height + 3}`}
            role="img"
            aria-label={`Sơ đồ phòng ${plan.width} mét nhân ${plan.height} mét với ${plan.items.filter((i) => i.kind === "table").length} bàn`}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const p = point(e.clientX, e.clientY);
              updateItem(drag.current.id, {
                x: Math.round((p.x - drag.current.offsetX) * 4) / 4,
                y: Math.round((p.y - drag.current.offsetY) * 4) / 4,
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <pattern
                id="floor-grid"
                width="1"
                height="1"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 1 0 L 0 0 0 1"
                  fill="none"
                  stroke="#dbe3d5"
                  strokeWidth="0.02"
                />
              </pattern>
            </defs>
            <rect
              width={plan.width}
              height={plan.height}
              fill="#fff"
              stroke="#75896b"
              strokeWidth=".06"
            />
            <rect
              width={plan.width}
              height={plan.height}
              fill="url(#floor-grid)"
            />
            <text
              x={plan.width / 2}
              y={-0.6}
              textAnchor="middle"
              fontSize=".42"
              fontFamily="Arial"
              fill="#65755e"
            >
              {plan.width} m
            </text>
            <text
              x={-0.8}
              y={plan.height / 2}
              textAnchor="middle"
              fontSize=".42"
              fontFamily="Arial"
              fill="#65755e"
              transform={`rotate(-90 -.8 ${plan.height / 2})`}
            >
              {plan.height} m
            </text>
            {groupBoxes.map(([letter, b]) => (
              <g key={letter} className="floor-group" aria-hidden>
                <rect
                  x={b.x0 - 0.3}
                  y={b.y0 - 0.3}
                  width={b.x1 - b.x0 + 0.6}
                  height={b.y1 - b.y0 + 0.6}
                  rx=".45"
                  fill="#f5f8f1"
                  stroke="#cddbc2"
                  strokeWidth=".04"
                  strokeDasharray=".22 .16"
                />
                <text
                  x={b.x0 - 0.2}
                  y={b.y0 - 0.45}
                  fontSize=".3"
                  fontFamily="Arial"
                  fill="#7d8f74"
                >
                  Nhóm {letter}
                </text>
              </g>
            ))}
            {sides && names && (
              <g aria-hidden>
                {(
                  [
                    [sides.middle / 2, names[0], sides.left, "left"],
                    [
                      (sides.middle + plan.width) / 2,
                      names[1],
                      sides.right,
                      "right",
                    ],
                  ] as const
                ).map(([x, name, total, key]) => {
                  const guests =
                    name === "Nhà trai"
                      ? confirmedBySide.groom
                      : confirmedBySide.bride;
                  const stage = plan.items.find((i) => i.kind === "stage");
                  const y = (stage ? stage.y + stage.height : 0) + 0.7;
                  return (
                    <text
                      key={key}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fontFamily="Arial"
                      fontSize=".36"
                      fill="#4f6247"
                      fontWeight="700"
                    >
                      {name.toUpperCase()} · {total.tables} bàn · {total.seats}{" "}
                      chỗ
                      {guests > 0 && (
                        <tspan fontWeight="400" fill="#7d8f74">
                          {" "}
                          · {guests} khách xác nhận
                        </tspan>
                      )}
                    </text>
                  );
                })}
              </g>
            )}
            {[
              ...plan.items.filter((i) => i.kind === "aisle"),
              ...plan.items.filter((i) => i.kind !== "aisle"),
            ].map((item) => (
              <g
                key={item.id}
                className={`floor-object ${selected === item.id ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${item.label}, vị trí ${item.x.toFixed(1)}, ${item.y.toFixed(1)} mét`}
                onFocus={() => setSelected(item.id)}
                onKeyDown={(e) => {
                  const delta = e.shiftKey ? 1 : 0.25;
                  const dirs: Record<string, [number, number]> = {
                    ArrowLeft: [-delta, 0],
                    ArrowRight: [delta, 0],
                    ArrowUp: [0, -delta],
                    ArrowDown: [0, delta],
                  };
                  if (dirs[e.key]) {
                    e.preventDefault();
                    updateItem(item.id, {
                      x: item.x + dirs[e.key][0],
                      y: item.y + dirs[e.key][1],
                    });
                  }
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setSelected(item.id);
                  const p = point(e.clientX, e.clientY);
                  drag.current = {
                    id: item.id,
                    offsetX: p.x - item.x,
                    offsetY: p.y - item.y,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
              >
                {item.kind === "table" ? (
                  <>
                    <ellipse
                      cx={item.x + item.width / 2}
                      cy={item.y + item.height / 2}
                      rx={item.width / 2 + 0.16}
                      ry={item.height / 2 + 0.16}
                      fill="none"
                      stroke="#bcccae"
                      strokeWidth=".06"
                      strokeDasharray=".14 .15"
                    />
                    <ellipse
                      cx={item.x + item.width / 2}
                      cy={item.y + item.height / 2}
                      rx={item.width / 2}
                      ry={item.height / 2}
                      fill={selected === item.id ? "#c8dfb3" : "#e8f0df"}
                      stroke={selected === item.id ? "#436c50" : "#8ba278"}
                      strokeWidth={selected === item.id ? ".08" : ".035"}
                    />
                    <text
                      x={item.x + item.width / 2}
                      y={item.y + item.height / 2 - 0.04}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize=".3"
                      fill="#344e31"
                      fontFamily="Arial"
                    >
                      {item.label}
                    </text>
                    <text
                      x={item.x + item.width / 2}
                      y={item.y + item.height / 2 + 0.33}
                      textAnchor="middle"
                      fontSize=".22"
                      fill="#718369"
                      fontFamily="Arial"
                    >
                      {item.seats} chỗ
                    </text>
                  </>
                ) : item.kind === "aisle" ? (
                  <>
                    <rect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      fill={selected === item.id ? "#efe2cb" : "#f8f1e6"}
                    />
                    {[item.x, item.x + item.width].map((x) => (
                      <line
                        key={x}
                        x1={x}
                        x2={x}
                        y1={item.y}
                        y2={item.y + item.height}
                        stroke={selected === item.id ? "#a8875a" : "#d8c3a2"}
                        strokeWidth=".05"
                        strokeDasharray=".3 .2"
                      />
                    ))}
                    <text
                      x={item.x + item.width / 2}
                      y={item.y + item.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize=".34"
                      letterSpacing=".08"
                      fill="#a8946f"
                      fontFamily="Arial"
                      transform={`rotate(-90 ${item.x + item.width / 2} ${item.y + item.height / 2})`}
                    >
                      {item.label.toUpperCase()} · {item.width} m
                    </text>
                  </>
                ) : (
                  <>
                    <rect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      rx=".1"
                      fill={item.kind === "stage" ? "#e6e1d4" : "#dae8ed"}
                      stroke={selected === item.id ? "#436c50" : "#ad9e7d"}
                      strokeWidth=".055"
                    />
                    <text
                      x={item.x + item.width / 2}
                      y={item.y + item.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize=".4"
                      fill="#726446"
                      fontFamily="Arial"
                    >
                      {item.label}
                    </text>
                    {item.kind === "stage" && (
                      <text
                        x={item.x + item.width / 2}
                        y={item.y + item.height / 2 + 0.5}
                        textAnchor="middle"
                        fontSize=".25"
                        fill="#8b816b"
                        fontFamily="Arial"
                      >
                        {item.width} × {item.height} m
                      </text>
                    )}
                  </>
                )}
              </g>
            ))}
            {!plan.items.length && (
              <text
                x={plan.width / 2}
                y={plan.height / 2}
                textAnchor="middle"
                fontFamily="Arial"
                fontSize=".5"
                fill="#8b9781"
              >
                Chọn một bố cục mẫu để bắt đầu
              </text>
            )}
          </svg>
        </div>
        <div className="floor-legend">
          <span className="row">
            <Circle size={12} />
            Bàn tròn
          </span>
          <span className="row">
            <Square size={12} />
            Sân khấu
          </span>
          <span className="row">
            <span className="legend-aisle" />
            Lối đi chính
          </span>
          <span className="row">
            <span className="legend-group" />
            Nhóm bàn
          </span>
          <span className="row">
            <Move size={12} />
            Kéo hoặc dùng phím mũi tên · Lưới 1 m
          </span>
        </div>
        <div className="between floor-toolbar" style={{ marginTop: 16 }}>
          <span
            className={`badge ${totalSeats < wedding.guestCount ? "orange" : ""}`}
          >
            {totalSeats} / {wedding.guestCount} chỗ dự kiến
          </span>
          <button
            className="btn small"
            onClick={() => {
              const item = constrainItem<FloorItem>(
                {
                  id: crypto.randomUUID(),
                  kind: "entrance",
                  label: "Lối vào",
                  x: plan.width / 2 - 1,
                  y: plan.height - 1,
                  width: 2,
                  height: 1,
                  seats: 0,
                  group: "",
                },
                plan.width,
                plan.height,
              );
              setPlan({ ...plan, items: [...plan.items, item] });
              setSelected(item.id);
              setDirty(true);
            }}
          >
            <Plus size={13} />
            Thêm lối vào
          </button>
        </div>
        {warnings.map((w) => (
          <div key={w} className="notice" style={{ marginTop: 12 }}>
            <span className="row">
              <AlertTriangle size={14} />
              {w}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
