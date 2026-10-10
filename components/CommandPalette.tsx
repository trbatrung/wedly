"use client";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CornerDownLeft, Search, type LucideIcon } from "lucide-react";
import { filterCommands, type Command } from "@/lib/search";

export type PaletteCommand = Command & { icon?: LucideIcon };
const BROWSE = ["Tạo mới", "Trang", "Đám cưới"];
const SEARCH = [
  "Đám cưới",
  "Công việc",
  "Nhà cung cấp",
  "Khách mời",
  "Trang",
  "Tạo mới",
];

export default function CommandPalette({
  commands,
  onClose,
}: {
  commands: PaletteCommand[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    list = useRef<HTMLDivElement>(null);
  const results = useMemo(
    () =>
      filterCommands(
        commands,
        query,
        query.trim() ? SEARCH : BROWSE,
      ) as PaletteCommand[],
    [commands, query],
  );
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  function run(command: PaletteCommand) {
    onClose();
    command.run();
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) run(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }
  let group = "";
  return (
    <div
      className="palette-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Tìm nhanh"
      >
        <div className="palette-input">
          <Search size={17} />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={
              results[active] ? `palette-${results[active].id}` : undefined
            }
            placeholder="Tìm đám cưới, khách, công việc hoặc thao tác…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <button className="palette-close" onClick={onClose}>
            Esc
          </button>
        </div>
        <div
          className="palette-list"
          id="palette-list"
          role="listbox"
          ref={list}
        >
          {!results.length && (
            <p className="palette-empty">Không tìm thấy “{query.trim()}”.</p>
          )}
          {results.map((command, index) => {
            const header = command.group !== group ? command.group : null;
            group = command.group;
            const Icon = command.icon;
            return (
              <Fragment key={command.id}>
                {header && <div className="palette-group">{header}</div>}
                <button
                  id={`palette-${command.id}`}
                  role="option"
                  aria-selected={index === active}
                  data-index={index}
                  className={`palette-item ${index === active ? "active" : ""}`}
                  onMouseMove={() => setActive(index)}
                  onClick={() => run(command)}
                >
                  {command.color ? (
                    <span
                      className="palette-dot"
                      style={{ background: command.color }}
                    />
                  ) : Icon ? (
                    <Icon size={16} strokeWidth={1.8} />
                  ) : (
                    <span className="palette-dot" />
                  )}
                  <span className="palette-label">{command.label}</span>
                  {command.hint && <small>{command.hint}</small>}
                  {index === active && (
                    <CornerDownLeft size={13} className="palette-enter" />
                  )}
                </button>
              </Fragment>
            );
          })}
        </div>
        <div className="palette-foot" aria-hidden>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> chọn
          </span>
          <span>
            <kbd>Enter</kbd> mở
          </span>
          <span>
            <kbd>Esc</kbd> đóng
          </span>
        </div>
      </div>
    </div>
  );
}

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
};
// "Tạo mới": a dropdown under the top bar on desktop, a bottom sheet on phones.
export function QuickAddMenu({
  actions,
  onClose,
}: {
  actions: QuickAction[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    ref.current?.querySelector("button")?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button
        className="quick-backdrop"
        aria-label="Đóng menu tạo mới"
        onClick={onClose}
      />
      <div className="quick-menu" role="menu" aria-label="Tạo mới" ref={ref}>
        <p className="quick-title">Tạo mới</p>
        {actions.map(({ id, label, icon: Icon, run }) => (
          <button
            key={id}
            role="menuitem"
            onClick={() => {
              onClose();
              run();
            }}
          >
            <span className="quick-icon">
              <Icon size={16} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
