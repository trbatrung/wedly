"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { CheckCheck, X, Inbox } from "lucide-react";
export function Logo() {
  return (
    <Link className="logo" href="/">
      <span className="logo-mark">
        <CheckCheck size={21} />
      </span>
      wedly<span style={{ color: "#8ba16f", marginLeft: -8 }}>.</span>
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (
      ref.current?.querySelector<HTMLElement>("input,select,textarea") ??
      ref.current?.querySelector<HTMLElement>("button")
    )?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, textarea, a[href]",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handler);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
