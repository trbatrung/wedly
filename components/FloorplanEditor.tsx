"use client";
import { useState, useRef, type CSSProperties } from "react";
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
} from "lucide-react";
import type { Floorplan, FloorItem, Wedding } from "@/lib/types";
import {
  constrainItem,
  generateFloorplan,
  layoutWarnings,
} from "@/lib/floorplan";

export default function FloorplanEditor({
  wedding,
  saved,
  onSave,
  busy,
  confirmedGuests = 0,
}: {
  wedding: Wedding;
  saved?: Floorplan;
  onSave: (plan: Floorplan) => Promise<void>;
  busy: boolean;
  confirmedGuests?: number;
}) {
  const [plan, setPlan] = useState<Floorplan>(
    () => saved ?? { weddingId: wedding.id, width: 20, height: 25, items: [] },
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
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false);
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
  }
  function generate() {
    try {
      setPlan(
        generateFloorplan(
          wedding.id,
          width,
          height,
          count,
          diameter,
          stageWidth,
          stageDepth,
          seats,
        ),
      );
      setSelected(null);
      setDirty(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
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
  return (
    <div className="floor-layout">
      <div className="panel floor-tools">
        <div>
          <div className="section-head">
            <h2>Kích thước & bố trí</h2>
            <Grid2X2 size={17} className="muted" />
          </div>
          <div className="fields">
            <label className="field">
              Rộng phòng (m)
              <input
                type="number"
                min="3"
                max="100"
                step="0.5"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Dài phòng (m)
              <input
                type="number"
                min="3"
                max="100"
                step="0.5"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="divider" />
          <div className="fields">
            <label className="field">
              Số bàn
              <input
                type="number"
                min="0"
                max="200"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Khách mỗi bàn
              <input
                type="number"
                min="1"
                max="30"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
              />
            </label>
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
            <label className="field" style={{ gridColumn: "1/-1" }}>
              Đường kính bàn (m)
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.1"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
        <div>
          <div className="divider" />
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            Sân khấu
          </p>
          <div className="fields">
            <label className="field">
              Rộng (m)
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={stageWidth}
                onChange={(e) => setStageWidth(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Sâu (m)
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={stageDepth}
                onChange={(e) => setStageDepth(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            className="btn primary"
            style={{ width: "100%", marginTop: 18 }}
            onClick={generate}
          >
            <Grid2X2 size={15} />
            {plan.items.length ? "Tạo lại bố trí" : "Tạo sơ đồ"}
          </button>
          <p className="muted" style={{ fontSize: 10, marginTop: 9 }}>
            Bố trí tự động có khoảng cách 0,8 m giữa các bàn. Tạo lại sẽ thay
            thế vị trí đang có.
          </p>
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
            <strong>{selectedItem.label}</strong>
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
                  Sâu (m)
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
            {plan.items.map((item) => (
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
                Nhập kích thước và chọn “Tạo sơ đồ”
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
              const item = constrainItem(
                {
                  id: crypto.randomUUID(),
                  kind: "entrance",
                  label: "Lối vào",
                  x: plan.width / 2 - 1,
                  y: plan.height - 1,
                  width: 2,
                  height: 1,
                  seats: 0,
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
