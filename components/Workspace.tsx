"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  CalendarDays,
  ImagePlus,
  ListTodo,
  Wallet,
  Grid2X2,
  Users,
  ChevronRight,
  Search,
  Plus,
  Check,
  X,
  LoaderCircle,
  Menu,
  MapPin,
  ArrowLeft,
  Pencil,
  Share2,
  Archive,
  Download,
  LogOut,
  Link2,
  RefreshCw,
  Store,
  MailOpen,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import {
  viewSchema,
  weddingTabSchema,
  weddingTabLabels,
  workspaceSchema,
  weddingSchema,
  taskSchema,
  vendorSchema,
  rsvpSchema,
  dealLabels,
  categoryLabels,
  type Workspace as WorkspaceData,
  type View,
  type WeddingTab,
  type Task,
  type Wedding,
  type Vendor,
  type Update,
  type Analysis,
  type Floorplan,
  type Invitation,
  type Rsvp,
} from "@/lib/types";
import {
  addActivity,
  applyAnalysis,
  analyzeText,
  dateLabel,
  daysUntil,
  money,
  normalize,
  paidFor,
  progressFor,
  RETENTION_MS,
  shortMoney,
  today,
  weddingPaid,
} from "@/lib/domain";
import { rsvpSummary } from "@/lib/invitation";
import { demoRsvps, demoWorkspace, sampleInvitations } from "@/lib/demo";
import {
  DEMO_RSVP_KEY,
  deleteDemoRsvp,
  loadDemoRsvps,
  saveDemoRsvps,
  upsertDemoRsvp,
} from "@/lib/rsvp-store";
import {
  cleanImages,
  retainImage,
  saveImage,
  prepareImage,
} from "@/lib/browser-storage";
import { Logo, Modal, Empty } from "./ui";
import { Overview, WeddingCard, TaskRows, VendorTable } from "./WorkspaceViews";
import CommandPalette, {
  QuickAddMenu,
  type PaletteCommand,
  type QuickAction,
} from "./CommandPalette";
import GuestList from "./invitation/GuestList";
import Assistant from "./Assistant";
import { supabaseBrowser } from "@/lib/supabase/browser";

// Heavier editors load only when their tab is opened.
const loadingPanel = () => (
  <div className="panel tab-loading">
    <LoaderCircle size={18} className="spin" />
  </div>
);
const InboxView = dynamic(() => import("./InboxView"), {
  loading: loadingPanel,
});
const FloorplanEditor = dynamic(() => import("./FloorplanEditor"), {
  loading: loadingPanel,
});
const InvitationStudio = dynamic(
  () => import("./invitation/InvitationStudio"),
  { loading: loadingPanel },
);

const STORAGE_KEY = "wedly-workspace-v2";
const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "overview", label: "Hôm nay", icon: LayoutDashboard },
    { id: "weddings", label: "Đám cưới", icon: CalendarDays },
    { id: "inbox", label: "Cập nhật", icon: ImagePlus },
    { id: "tasks", label: "Công việc", icon: ListTodo },
    { id: "payments", label: "Chi phí", icon: Wallet },
    { id: "floorplan", label: "Sơ đồ tiệc", icon: Grid2X2 },
    { id: "team", label: "Đội ngũ", icon: Users },
  ];
const countdown = (date: string) => {
  const days = daysUntil(date);
  return days < 0 ? "Đã qua" : days === 0 ? "Hôm nay" : `${days} ngày`;
};
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers:
      options?.body instanceof FormData
        ? options.headers
        : { "content-type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Không thể hoàn tất thao tác.");
  return data;
}

export default function Workspace({ demo = false }: { demo?: boolean }) {
  const [state, setState] = useState<WorkspaceData | null>(null),
    [view, setView] = useState<View>("overview"),
    [weddingId, setWeddingId] = useState<string | null>(null),
    [loadingError, setLoadingError] = useState(""),
    [needsTeam, setNeedsTeam] = useState(false),
    [role, setRole] = useState("owner"),
    [memberName, setMemberName] = useState(""),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [tab, setTab] = useState<WeddingTab>("tasks"),
    [rsvps, setRsvps] = useState<Rsvp[]>([]),
    [rsvpError, setRsvpError] = useState(""),
    [paletteOpen, setPaletteOpen] = useState(false),
    [quickOpen, setQuickOpen] = useState(false),
    [modal, setModal] = useState<
      "wedding" | "task" | "vendor" | "payment" | null
    >(null),
    [editingWedding, setEditingWedding] = useState<Wedding | null>(null),
    [editingVendor, setEditingVendor] = useState<Vendor | null>(null),
    [toast, setToast] = useState<{ text: string; error?: boolean } | null>(
      null,
    ),
    [formError, setFormError] = useState(""),
    [invite, setInvite] = useState("");
  const revision = useRef(0),
    locked = useRef(false),
    stateRef = useRef<WorkspaceData | null>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(text: string, error = false) {
    setToast({ text, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }
  function query() {
    const params = new URLSearchParams(window.location.search);
    const parsed = viewSchema.safeParse(params.get("v"));
    const parsedTab = weddingTabSchema.safeParse(params.get("t"));
    setView(parsed.success ? parsed.data : "overview");
    setWeddingId(params.get("w"));
    setTab(parsedTab.success ? parsedTab.data : "tasks");
  }
  async function loadRsvps() {
    if (demo) {
      setRsvps(loadDemoRsvps() ?? []);
      return;
    }
    try {
      const result = await request("/api/rsvps");
      setRsvps(rsvpSchema.array().parse(result.rsvps));
      setRsvpError("");
    } catch (e) {
      setRsvpError((e as Error).message);
    }
  }
  async function load() {
    setLoadingError("");
    try {
      let data: WorkspaceData;
      if (demo) {
        const cached = localStorage.getItem(STORAGE_KEY);
        const raw = cached ? JSON.parse(cached) : null;
        const parsed = raw ? workspaceSchema.safeParse(raw) : null;
        data = parsed?.success ? parsed.data : demoWorkspace();
        // Demo data saved before invitations existed gets the sample invitation once.
        if (parsed?.success && !("invitations" in raw))
          data = { ...data, invitations: sampleInvitations(data) };
        await cleanImages(data.updates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        let answers = loadDemoRsvps();
        if (answers === null) {
          answers = demoRsvps(data);
          saveDemoRsvps(answers);
        }
        setRsvps(answers);
      } else {
        const result = await request("/api/workspace");
        data = workspaceSchema.parse(result.payload);
        revision.current = result.revision;
        setRole(result.role);
        setMemberName(result.memberName);
        const images = await request("/api/screenshots");
        for (const row of images.screenshots) {
          const existing = data.updates.find((u) => u.id === row.id);
          if (existing) {
            existing.retained = row.retained;
            existing.imageDeleted = Boolean(row.deleted_at);
            if (!existing.analysis && row.analysis) {
              existing.analysis = row.analysis;
              existing.status = "ready";
            }
          } else
            data.updates.push({
              id: row.id,
              weddingId: row.wedding_id,
              filename: row.filename,
              createdAt: row.created_at,
              expiresAt: row.expires_at,
              retained: row.retained,
              imageDeleted: Boolean(row.deleted_at),
              status: row.analysis ? "ready" : "pending",
              analysis: row.analysis,
              source: "image",
              hash: row.hash,
              reviewedAt: null,
            });
        }
      }
      stateRef.current = data;
      setState(data);
      if (!demo) void loadRsvps();
    } catch (e) {
      const message = (e as Error).message;
      if (message === "Bạn chưa tham gia đội ngũ.") setNeedsTeam(true);
      else setLoadingError(message);
    }
  }
  useEffect(() => {
    query();
    void load();
    window.addEventListener("popstate", query);
    return () => {
      window.removeEventListener("popstate", query);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [demo]);
  // New guest answers appear when the planner returns to this tab (demo
  // answers submitted in another tab arrive through the storage event).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (demo && e.key === DEMO_RSVP_KEY) setRsvps(loadDemoRsvps() ?? []);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && stateRef.current)
        void loadRsvps();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demo]);
  // Keep the active wedding tab visible in the horizontally scrolling strip.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".wedding-tabs");
    const active = bar?.querySelector<HTMLElement>(".tab.active");
    if (bar && active)
      bar.scrollLeft =
        active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
  }, [tab, weddingId, view, Boolean(state)]);
  // ⌘K / Ctrl+K or "/" opens quick search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector(".modal-backdrop")) return;
      const typing = (e.target as HTMLElement | null)?.closest?.(
        "input, textarea, select, [contenteditable='true']",
      );
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickOpen(false);
        setPaletteOpen((open) => !open);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!demo || !state) return;
    const timer = setInterval(() => {
      void cleanImages(stateRef.current?.updates ?? []).catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, [demo, Boolean(state)]);
  async function commit(next: WorkspaceData, message?: string) {
    if (locked.current)
      throw new Error("Đang lưu thao tác trước. Vui lòng chờ một chút.");
    locked.current = true;
    setBusy(true);
    try {
      const checked = workspaceSchema.parse(next);
      if (demo) localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
      else {
        const result = await request("/api/workspace", {
          method: "PUT",
          body: JSON.stringify({
            payload: checked,
            revision: revision.current,
          }),
        });
        revision.current = result.revision;
      }
      stateRef.current = checked;
      setState(checked);
      if (message) notify(message);
    } catch (e) {
      notify((e as Error).message, true);
      throw e;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function url(next: View, id: string | null, nextTab: WeddingTab) {
    const params = new URLSearchParams();
    if (next !== "overview") params.set("v", next);
    if (id) params.set("w", id);
    if (next === "weddings" && id && nextTab !== "tasks")
      params.set("t", nextTab);
    const query = params.toString();
    return `${demo ? "/demo" : "/dashboard"}${query ? "?" + query : ""}`;
  }
  function go(
    next: View,
    id: string | null = null,
    nextTab: WeddingTab = "tasks",
  ) {
    setView(next);
    setWeddingId(id);
    setFilter("all");
    setSearch("");
    setMobile(false);
    setQuickOpen(false);
    setTab(nextTab);
    history.pushState(null, "", url(next, id, nextTab));
    window.scrollTo({ top: 0 });
  }
  // Tabs are part of the address so refresh, back and shared links keep them.
  function selectTab(next: WeddingTab) {
    setTab(next);
    history.replaceState(null, "", url(view, weddingId, next));
  }
  // Narrowing a list to one wedding keeps the status filter and search.
  function scopeTo(id: string | null) {
    setWeddingId(id);
    history.replaceState(null, "", url(view, id, tab));
  }
  function openModal(
    type: typeof modal,
    wedding: Wedding | null = null,
    vendor: Vendor | null = null,
  ) {
    setEditingWedding(wedding);
    setEditingVendor(vendor);
    setFormError("");
    setModal(type);
  }
  async function toggleTask(task: Task) {
    if (!stateRef.current) return;
    const next = {
      ...stateRef.current,
      tasks: stateRef.current.tasks.map((t) =>
        t.id === task.id ? { ...t, done: !t.done } : t,
      ),
    };
    try {
      await commit(
        addActivity(
          next,
          `${task.done ? "Đã mở lại" : "Đã hoàn thành"}: ${task.title}`,
        ),
      );
    } catch {}
  }
  async function upload(file: File, id: string) {
    if (file.size > 5 * 1024 * 1024 || !file.size)
      throw new Error("Chọn ảnh tối đa 5 MB.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      throw new Error("Chọn ảnh PNG, JPG hoặc WebP.");
    let update: Update;
    if (demo) {
      const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error("Không thể đọc ảnh. Hãy chọn ảnh khác.");
      });
      bitmap.close();
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
      );
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const existing = stateRef.current!.updates.find((u) => u.hash === hash);
      if (existing) {
        notify("Ảnh này đã được thêm trước đó.");
        return existing.id;
      }
      const now = Date.now();
      update = {
        id: crypto.randomUUID(),
        weddingId: id,
        filename: file.name.slice(0, 160),
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + RETENTION_MS).toISOString(),
        retained: false,
        imageDeleted: false,
        status: "pending",
        analysis: null,
        source: "image",
        hash,
        reviewedAt: null,
      };
      await saveImage(update.id, file, update.expiresAt);
    } else {
      const form = new FormData();
      form.set("file", await prepareImage(file));
      form.set("weddingId", id);
      const result = await request("/api/screenshots", {
        method: "POST",
        body: form,
      });
      const row = result.screenshot;
      if (
        result.duplicate &&
        stateRef.current!.updates.some((u) => u.id === row.id)
      ) {
        notify("Ảnh này đã được thêm trước đó.");
        return row.id;
      }
      update = {
        id: row.id,
        weddingId: id,
        filename: row.filename,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        retained: row.retained,
        imageDeleted: Boolean(row.deleted_at),
        status: row.analysis ? "ready" : "pending",
        analysis: row.analysis,
        source: "image",
        hash: row.hash,
        reviewedAt: null,
      };
    }
    await commit(
      addActivity(
        {
          ...stateRef.current!,
          updates: [update, ...stateRef.current!.updates],
        },
        `Đã thêm ảnh cho ${stateRef.current!.weddings.find((w) => w.id === id)?.couple}`,
      ),
      "Đã lưu ảnh. Bạn có thể xem và xử lý cập nhật.",
    );
    return update.id;
  }
  async function textUpdate(text: string, id: string, updateId?: string) {
    const current = stateRef.current!,
      wedding = current.weddings.find((w) => w.id === id);
    if (!wedding) throw new Error("Chọn đám cưới hợp lệ.");
    const analysis = analyzeText(text, wedding.date);
    const update: Update = {
      id: crypto.randomUUID(),
      weddingId: id,
      filename: "Nội dung trao đổi",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + RETENTION_MS).toISOString(),
      retained: false,
      imageDeleted: false,
      status: "ready",
      analysis,
      source: "text",
      hash: "",
      reviewedAt: null,
    };
    const next = updateId
      ? {
          ...current,
          updates: current.updates.map((u) =>
            u.id === updateId
              ? { ...u, analysis, status: "ready" as const }
              : u,
          ),
        }
      : { ...current, updates: [update, ...current.updates] };
    await commit(next, "Đã tạo đề xuất. Hãy kiểm tra trước khi xác nhận.");
    return updateId ?? update.id;
  }
  async function analyze(update: Update) {
    const { analysis } = await request("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        screenshotId: update.id,
        weddingId: update.weddingId,
      }),
    });
    await commit(
      {
        ...stateRef.current!,
        updates: stateRef.current!.updates.map((u) =>
          u.id === update.id ? { ...u, analysis, status: "ready" as const } : u,
        ),
      },
      "Đã đọc ảnh. Kiểm tra đề xuất trước khi lưu.",
    );
  }
  async function review(update: Update, analysis: Analysis, confirm: boolean) {
    await commit(
      applyAnalysis(stateRef.current!, update.id, analysis, confirm),
      "Đã cập nhật hồ sơ và công việc.",
    );
  }
  async function retain(update: Update, retained: boolean) {
    if (demo) await retainImage(update.id, retained);
    else
      await request(`/api/screenshots/${update.id}`, {
        method: "PATCH",
        body: JSON.stringify({ retained }),
      });
    await commit(
      {
        ...stateRef.current!,
        updates: stateRef.current!.updates.map((u) =>
          u.id === update.id ? { ...u, retained } : u,
        ),
      },
      retained
        ? "Đã giữ ảnh làm chứng từ."
        : "Ảnh sẽ theo thời hạn 48 giờ từ lúc tải lên.",
    );
  }
  async function dismiss(update: Update) {
    await commit(
      {
        ...stateRef.current!,
        updates: stateRef.current!.updates.map((u) =>
          u.id === update.id ? { ...u, status: "dismissed" as const } : u,
        ),
      },
      "Đã bỏ qua cập nhật.",
    );
  }
  async function share(wedding: Wedding) {
    try {
      if (demo) {
        window.open(
          `/demo/share/${wedding.id}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
      const token = wedding.shareToken ?? crypto.randomUUID();
      if (!wedding.shareToken)
        await commit({
          ...stateRef.current!,
          weddings: stateRef.current!.weddings.map((w) =>
            w.id === wedding.id ? { ...w, shareToken: token } : w,
          ),
        });
      await navigator.clipboard.writeText(
        `${window.location.origin}/share/${token}`,
      );
      notify(
        "Đã sao chép liên kết khách hàng. Chỉ chia sẻ với người được phép.",
      );
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function saveInvitation(next: Invitation, message: string) {
    const current = stateRef.current!;
    const invitation: Invitation = {
      ...next,
      // Live links get an unguessable token the first time they are published.
      token:
        !demo && next.published && !next.token
          ? crypto.randomUUID()
          : next.token,
      updatedAt: new Date().toISOString(),
    };
    const exists = current.invitations.some(
      (i) => i.weddingId === invitation.weddingId,
    );
    await commit(
      addActivity(
        {
          ...current,
          invitations: exists
            ? current.invitations.map((i) =>
                i.weddingId === invitation.weddingId ? invitation : i,
              )
            : [...current.invitations, invitation],
        },
        `Đã cập nhật thiệp mời ${current.weddings.find((w) => w.id === invitation.weddingId)?.couple ?? ""}`,
      ),
      message,
    );
    return invitation;
  }
  function inviteUrl(invitation: Invitation) {
    if (demo) return `${location.origin}/demo/thiep/${invitation.weddingId}`;
    return invitation.published && invitation.token
      ? `${location.origin}/thiep/${invitation.token}`
      : null;
  }
  async function saveRsvp(rsvp: Rsvp) {
    if (demo) setRsvps(upsertDemoRsvp(rsvp));
    else {
      await request("/api/rsvps", {
        method: "POST",
        body: JSON.stringify({ rsvp }),
      });
      await loadRsvps();
    }
    notify(`Đã lưu ${rsvp.name}.`);
  }
  async function deleteRsvp(rsvp: Rsvp) {
    if (demo) setRsvps(deleteDemoRsvp(rsvp.id));
    else {
      await request(`/api/rsvps?id=${encodeURIComponent(rsvp.id)}`, {
        method: "DELETE",
      });
      await loadRsvps();
    }
    notify(`Đã xóa câu trả lời của ${rsvp.name}.`);
  }
  async function saveForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!stateRef.current) return;
    const form = new FormData(event.currentTarget),
      str = (key: string) => String(form.get(key) ?? "").trim(),
      num = (key: string) => Number(form.get(key) || 0),
      current = stateRef.current;
    try {
      let next = current;
      if (modal === "wedding") {
        const wedding = weddingSchema.parse({
          id: editingWedding?.id ?? crypto.randomUUID(),
          couple: str("couple"),
          date: str("date"),
          venue: str("venue"),
          guestCount: num("guestCount"),
          budget: num("budget"),
          lead: str("lead"),
          color: editingWedding?.color ?? "#79917d",
          archived: editingWedding?.archived ?? false,
          shareToken: editingWedding?.shareToken ?? null,
          note: str("note"),
        });
        next = {
          ...current,
          weddings: editingWedding
            ? current.weddings.map((w) => (w.id === wedding.id ? wedding : w))
            : [...current.weddings, wedding],
        };
        next = addActivity(
          next,
          `${editingWedding ? "Đã sửa" : "Đã tạo"} hồ sơ ${wedding.couple}`,
        );
      }
      if (modal === "task") {
        const task = taskSchema.parse({
          id: crypto.randomUUID(),
          weddingId: str("weddingId"),
          title: str("title"),
          owner: str("owner"),
          dueDate: str("dueDate") || null,
          done: false,
          sourceId: null,
        });
        if (!current.weddings.some((w) => w.id === task.weddingId))
          throw new Error("Chọn đám cưới hợp lệ.");
        next = addActivity(
          { ...current, tasks: [...current.tasks, task] },
          `Đã tạo công việc: ${task.title}`,
        );
      }
      if (modal === "vendor") {
        const vendor = vendorSchema.parse({
          id: editingVendor?.id ?? crypto.randomUUID(),
          weddingId: str("weddingId"),
          name: str("name"),
          category: str("category"),
          status: str("status"),
          quoted: num("quoted"),
          agreed: num("agreed"),
          nextAmount: num("nextAmount"),
          dueDate: str("dueDate") || null,
        });
        if (!current.weddings.some((w) => w.id === vendor.weddingId))
          throw new Error("Chọn đám cưới hợp lệ.");
        if (vendor.agreed < paidFor(current, vendor.id))
          throw new Error(
            "Giá trị đã chốt không thể nhỏ hơn khoản đã thanh toán.",
          );
        next = {
          ...current,
          vendors: editingVendor
            ? current.vendors.map((v) => (v.id === vendor.id ? vendor : v))
            : [...current.vendors, vendor],
        };
      }
      if (modal === "payment") {
        const vendor = current.vendors.find((v) => v.id === str("vendorId"));
        const amount = num("amount"),
          reference = str("reference");
        if (!vendor || amount <= 0 || !Number.isInteger(amount))
          throw new Error("Chọn nhà cung cấp và nhập số tiền hợp lệ.");
        if (!form.get("confirmed"))
          throw new Error("Xác nhận đã kiểm tra khoản thanh toán.");
        if (
          reference &&
          current.payments.some((p) => p.reference === reference)
        )
          throw new Error("Mã giao dịch này đã được ghi nhận.");
        if (
          vendor.agreed > 0 &&
          paidFor(current, vendor.id) + amount > vendor.agreed
        )
          throw new Error("Số tiền vượt giá trị đã chốt.");
        next = addActivity(
          {
            ...current,
            payments: [
              ...current.payments,
              {
                id: crypto.randomUUID(),
                vendorId: vendor.id,
                weddingId: vendor.weddingId,
                amount,
                date: str("date"),
                reference,
                sourceId: null,
              },
            ],
            vendors: current.vendors.map((v) =>
              v.id === vendor.id
                ? { ...v, nextAmount: Math.max(0, v.nextAmount - amount) }
                : v,
            ),
          },
          `Đã ghi nhận ${money(amount)} thanh toán cho ${vendor.name}`,
        );
      }
      await commit(next, "Đã lưu thành công.");
      setModal(null);
    } catch (e) {
      setFormError(
        e && typeof e === "object" && "issues" in e
          ? "Thông tin chưa hợp lệ. Kiểm tra ngày, số lượng và số tiền."
          : (e as Error).message,
      );
    }
  }
  if (needsTeam)
    return (
      <div className="auth-form-wrap" style={{ minHeight: "100vh" }}>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoadingError("");
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              await request("/api/team", {
                method: "POST",
                body: JSON.stringify({
                  name: f.get("name"),
                  member: f.get("member"),
                }),
              });
              setNeedsTeam(false);
              await load();
            } catch (e) {
              setLoadingError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Logo />
          <h1 style={{ marginTop: 35 }}>Chào mừng đội ngũ của bạn</h1>
          <p>Tạo không gian làm việc riêng, rồi thêm đám cưới đầu tiên.</p>
          <div className="stack">
            <label className="field">
              Tên đội ngũ
              <input
                name="name"
                required
                maxLength={120}
                placeholder="Ví dụ: Nhà Mình Weddings"
              />
            </label>
            <label className="field">
              Tên của bạn
              <input
                name="member"
                required
                maxLength={80}
                placeholder="Tên dùng khi phân công công việc"
              />
            </label>
            {loadingError && <div className="notice error">{loadingError}</div>}
            <button className="btn primary" disabled={busy}>
              Tạo không gian làm việc <ArrowRightIcon />
            </button>
          </div>
        </form>
      </div>
    );
  if (!state)
    return (
      <div className="loading">
        <Logo />
        {loadingError ? (
          <>
            <p role="alert">{loadingError}</p>
            <button className="btn" onClick={() => void load()}>
              Thử lại
            </button>
            <Link href="/demo" className="text-link">
              Mở bản trải nghiệm
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle size={22} className="spin" />
            <p>Đang mở không gian làm việc…</p>
          </>
        )}
      </div>
    );
  const active = state.weddings.filter((w) => !w.archived),
    selected = state.weddings.find((w) => w.id === weddingId),
    pending = state.updates.filter(
      (u) => u.status === "ready" || u.status === "pending",
    ).length,
    label = navigation.find((n) => n.id === view)!.label;
  const byDate = (a: Wedding, b: Wedding) => a.date.localeCompare(b.date);
  const upcoming = active.slice().sort(byDate),
    coupleOf = (id: string) =>
      state.weddings.find((w) => w.id === id)?.couple ?? "",
    initials = state.teamName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K";
  const weddingRsvps = selected
      ? rsvps.filter((r) => r.weddingId === selected.id)
      : [],
    selectedInvitation = selected
      ? state.invitations.find((i) => i.weddingId === selected.id)
      : undefined;
  const createActions: QuickAction[] = [
    {
      id: "wedding",
      label: "Đám cưới",
      icon: CalendarDays,
      run: () => openModal("wedding"),
    },
    {
      id: "task",
      label: "Công việc",
      icon: ListTodo,
      run: () => openModal("task"),
    },
    {
      id: "photo",
      label: "Ảnh trao đổi",
      icon: ImagePlus,
      run: () => go("inbox", weddingId),
    },
    {
      id: "vendor",
      label: "Nhà cung cấp",
      icon: Store,
      run: () => openModal("vendor"),
    },
    {
      id: "payment",
      label: "Thanh toán đã trả",
      icon: Wallet,
      run: () => openModal("payment"),
    },
  ];
  const paletteCommands = (): PaletteCommand[] => [
    ...createActions.map((a) => ({
      id: `new-${a.id}`,
      group: "Tạo mới",
      label: `Thêm ${a.label.toLowerCase()}`,
      icon: a.icon,
      keywords: "tao moi them",
      run: a.run,
    })),
    ...navigation.map((n) => ({
      id: `page-${n.id}`,
      group: "Trang",
      label: n.label,
      icon: n.icon,
      keywords: "trang",
      run: () => go(n.id),
    })),
    ...state.weddings
      .slice()
      .sort((a, b) => Number(a.archived) - Number(b.archived) || byDate(a, b))
      .flatMap((w) => [
        {
          id: `w-${w.id}`,
          group: "Đám cưới",
          label: w.couple,
          hint: `${dateLabel(w.date)} · ${w.archived ? "Lưu trữ" : countdown(w.date)}`,
          keywords: w.venue,
          color: w.color,
          run: () => go("weddings", w.id),
        },
        ...weddingTabSchema.options.map((t) => ({
          id: `w-${w.id}-${t}`,
          group: "Đám cưới",
          label: `${w.couple} › ${weddingTabLabels[t]}`,
          color: w.color,
          deep: true,
          run: () => go("weddings", w.id, t),
        })),
      ]),
    ...state.tasks
      .filter((t) => !t.done)
      .map((t) => ({
        id: `t-${t.id}`,
        group: "Công việc",
        label: t.title,
        hint: `${coupleOf(t.weddingId)} · ${t.dueDate ? dateLabel(t.dueDate).slice(0, 5) : "Chưa có hạn"}`,
        icon: ListTodo,
        run: () => go("weddings", t.weddingId, "tasks"),
      })),
    ...state.vendors.map((v) => ({
      id: `v-${v.id}`,
      group: "Nhà cung cấp",
      label: v.name,
      hint: `${v.category} · ${coupleOf(v.weddingId)}`,
      icon: Store,
      run: () => go("weddings", v.weddingId, "vendors"),
    })),
    ...rsvps.map((r) => ({
      id: `g-${r.id}`,
      group: "Khách mời",
      label: r.name,
      hint: `${coupleOf(r.weddingId)} · ${r.attending ? `${1 + r.guests} người` : "Không đến"}`,
      icon: UserCheck,
      run: () => go("weddings", r.weddingId, "guests"),
    })),
  ];
  const weddingScope = (
    <label className="scope-select">
      <span
        className="dot"
        style={{ background: selected?.color ?? "#c3cbc1" }}
      />
      <select
        aria-label="Lọc theo đám cưới"
        value={weddingId ?? ""}
        onChange={(e) => scopeTo(e.target.value || null)}
      >
        <option value="">Tất cả đám cưới</option>
        {upcoming.map((w) => (
          <option key={w.id} value={w.id}>
            {w.couple}
          </option>
        ))}
      </select>
    </label>
  );
  const scopeVendors = state.vendors.filter(
      (v) =>
        (!weddingId || v.weddingId === weddingId) &&
        (!search || normalize(v.name).includes(normalize(search))),
    ),
    scopeTasks = state.tasks
      .filter(
        (t) =>
          (!weddingId || t.weddingId === weddingId) &&
          (!search || normalize(t.title).includes(normalize(search))) &&
          (filter === "done"
            ? t.done
            : filter === "mine"
              ? !t.done && t.owner === (memberName || state.members[0])
              : filter === "overdue"
                ? !t.done && Boolean(t.dueDate && t.dueDate < today())
                : filter === "today"
                  ? !t.done && t.dueDate === today()
                  : filter === "pending"
                    ? !t.done
                    : true),
      )
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
      );
  const title =
    view === "overview"
      ? `Chào ${memberName || state.members[0]}`
      : selected && view === "weddings"
        ? selected.couple
        : label;
  const inboxProps = {
    state,
    demo,
    weddingId,
    busy,
    onUpload: upload,
    onText: textUpdate,
    onAnalyze: analyze,
    onReview: review,
    onRetain: retain,
    onDismiss: dismiss,
  };
  const floor = (wedding: Wedding) => (
    <FloorplanEditor
      key={wedding.id}
      wedding={wedding}
      saved={state.floorplans.find((p) => p.weddingId === wedding.id)}
      confirmedGuests={
        rsvpSummary(rsvps.filter((r) => r.weddingId === wedding.id))
          .attendingPeople
      }
      busy={busy}
      onSave={async (plan: Floorplan) => {
        await commit(
          {
            ...stateRef.current!,
            floorplans: [
              ...stateRef.current!.floorplans.filter(
                (p) => p.weddingId !== plan.weddingId,
              ),
              plan,
            ],
          },
          "Đã lưu sơ đồ bàn tiệc.",
        );
      }}
    />
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Logo />
        <button
          className="team-switch"
          onClick={() => go("team")}
          aria-label="Mở đội ngũ"
        >
          <span className="avatar" style={{ borderRadius: 7 }}>
            {initials || "W"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{state.teamName}</strong>
            <span className="muted">{state.members.length} thành viên</span>
          </div>
          <ChevronRight size={13} />
        </button>

        <nav className="side-nav">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-item ${view === id ? "active" : ""}`}
              key={id}
              onClick={() => go(id)}
            >
              <Icon size={17} strokeWidth={1.7} />
              {label}
              {id === "inbox" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-weddings">
          <div className="between sidebar-label">
            <span>Đám cưới</span>
            <button
              className="text-link"
              aria-label="Thêm đám cưới"
              onClick={() => openModal("wedding")}
            >
              <Plus size={13} />
            </button>
          </div>
          {upcoming.slice(0, 6).map((w) => (
            <button
              key={w.id}
              className={`side-wedding ${weddingId === w.id ? "active" : ""}`}
              onClick={() =>
                go("weddings", w.id, view === "weddings" ? tab : "tasks")
              }
            >
              <span className="dot" style={{ background: w.color }} />
              <span className="side-wedding-name">{w.couple}</span>
              <small>{countdown(w.date)}</small>
            </button>
          ))}
          {upcoming.length > 6 && (
            <button className="side-more" onClick={() => go("weddings")}>
              Xem tất cả {upcoming.length}
            </button>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">
              {(memberName || state.members[0])?.slice(0, 1)}
            </span>
            <div style={{ flex: 1 }}>
              <strong>{memberName || state.members[0]}</strong>
              <small>
                {demo
                  ? "Trải nghiệm"
                  : role === "owner"
                    ? "Chủ đội ngũ"
                    : "Thành viên đội ngũ"}
              </small>
            </div>
            {!demo && (
              <button
                className="icon-button"
                aria-label="Đăng xuất"
                onClick={async () => {
                  await supabaseBrowser().auth.signOut();
                  window.location.href = "/login";
                }}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Đóng menu"
          onClick={() => setMobile(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 25,
            background: "#14231b50",
            border: 0,
          }}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              aria-label="Mở menu"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={18} />
            </button>
            <nav className="breadcrumbs" aria-label="Vị trí hiện tại">
              <button
                className="crumb crumb-root"
                aria-current={selected ? undefined : "page"}
                onClick={() => go(view)}
              >
                {label}
              </button>
              {selected && (
                <>
                  <ChevronRight size={12} />
                  <button
                    className="crumb"
                    aria-current={
                      view === "weddings" && tab === "tasks"
                        ? "page"
                        : undefined
                    }
                    onClick={() => go("weddings", selected.id)}
                  >
                    {selected.couple}
                  </button>
                </>
              )}
              {selected && view === "weddings" && tab !== "tasks" && (
                <>
                  <ChevronRight size={12} />
                  <span aria-current="page">{weddingTabLabels[tab]}</span>
                </>
              )}
            </nav>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              aria-label={`Tìm nhanh (${shortcut})`}
              onClick={() => setPaletteOpen(true)}
            >
              <Search size={15} />
              <span>Tìm nhanh…</span>
              <kbd>{shortcut}</kbd>
            </button>
            {demo ? (
              <span
                className="demo-pill"
                title="Dữ liệu trải nghiệm lưu trên thiết bị này"
              >
                Trải nghiệm
              </span>
            ) : (
              <button
                className="icon-button"
                aria-label="Tải dữ liệu mới nhất"
                disabled={busy}
                onClick={() => void load()}
              >
                <RefreshCw size={14} />
              </button>
            )}
            <div className="quick-add">
              <button
                className="btn primary small quick-add-trigger"
                aria-haspopup="menu"
                aria-expanded={quickOpen}
                onClick={() => setQuickOpen(!quickOpen)}
              >
                <Plus size={14} />
                Tạo mới
              </button>
              {quickOpen && (
                <QuickAddMenu
                  actions={createActions}
                  onClose={() => setQuickOpen(false)}
                />
              )}
            </div>
            <span className="avatar">
              {(memberName || state.members[0])?.slice(0, 1)}
            </span>
          </div>
        </header>
        <main className="page-content">
          <div
            className="page-head"
            hidden={view === "weddings" && Boolean(selected)}
          >
            <div>
              {view === "overview" && (
                <div className="home-date">
                  {new Intl.DateTimeFormat("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "Asia/Ho_Chi_Minh",
                  }).format(new Date())}
                </div>
              )}
              <h1>{title}</h1>
              {demo && view === "overview" && (
                <span className="demo-caption">
                  Dữ liệu mẫu · Lưu trên thiết bị
                </span>
              )}
            </div>
            {view === "overview" ? (
              <div className="row home-actions">
                <button className="btn" onClick={() => go("inbox")}>
                  <ImagePlus size={15} />
                  Thêm ảnh
                </button>
                <button
                  className="btn primary"
                  onClick={() => openModal("task")}
                >
                  <Plus size={15} />
                  Thêm việc
                </button>
              </div>
            ) : view === "tasks" ? (
              <button className="btn primary" onClick={() => openModal("task")}>
                <Plus size={15} />
                Thêm công việc
              </button>
            ) : view === "payments" ? (
              <button
                className="btn primary"
                onClick={() => openModal("vendor")}
              >
                <Plus size={15} />
                Nhà cung cấp
              </button>
            ) : view === "weddings" && !selected ? (
              <button
                className="btn primary"
                onClick={() => openModal("wedding")}
              >
                <Plus size={15} />
                Thêm đám cưới
              </button>
            ) : null}
          </div>
          {weddingId && !selected ? (
            <Empty
              title="Không tìm thấy đám cưới"
              description="Hồ sơ này không có trong đội ngũ hiện tại."
            >
              <button className="btn" onClick={() => go("weddings")}>
                Về danh sách đám cưới
              </button>
            </Empty>
          ) : (
            <>
              {view === "overview" && (
                <Overview
                  state={state}
                  go={go}
                  onTask={toggleTask}
                  busy={busy}
                  onNewTask={() => openModal("task")}
                  rsvps={rsvps}
                />
              )}
              {view === "weddings" && !selected && (
                <>
                  <div className="filters">
                    {[
                      ["all", "Đang chuẩn bị"],
                      ["archived", "Đã lưu trữ"],
                    ].map(([id, name]) => (
                      <button
                        className={`filter ${filter === id ? "active" : ""}`}
                        key={id}
                        onClick={() => setFilter(id)}
                      >
                        {name}
                      </button>
                    ))}
                    <label className="filter-search">
                      <Search size={14} />
                      <input
                        placeholder="Lọc theo tên, địa điểm…"
                        aria-label="Lọc đám cưới"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <span className="muted filter-count">
                      {
                        state.weddings.filter(
                          (w) => w.archived === (filter === "archived"),
                        ).length
                      }{" "}
                      hồ sơ
                    </span>
                  </div>
                  <div
                    className="wedding-grid"
                    style={{ gridTemplateColumns: undefined }}
                  >
                    {state.weddings
                      .filter(
                        (w) =>
                          w.archived === (filter === "archived") &&
                          (!search ||
                            normalize(`${w.couple} ${w.venue}`).includes(
                              normalize(search),
                            )),
                      )
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((w) => (
                        <WeddingCard
                          key={w.id}
                          wedding={w}
                          state={state}
                          onClick={() => go("weddings", w.id)}
                        />
                      ))}
                  </div>
                  {!state.weddings.length && (
                    <Empty
                      title="Chưa có đám cưới"
                      description="Tạo hồ sơ đầu tiên để bắt đầu điều phối."
                    >
                      <button
                        className="btn primary"
                        onClick={() => openModal("wedding")}
                      >
                        <Plus size={15} />
                        Thêm đám cưới
                      </button>
                    </Empty>
                  )}
                </>
              )}
              {view === "weddings" && selected && (
                <>
                  <button
                    className="text-link no-print"
                    style={{ marginBottom: 18 }}
                    onClick={() => go("weddings")}
                  >
                    <ArrowLeft size={13} />
                    Tất cả đám cưới
                  </button>
                  <section className="wedding-detail-head">
                    <div className="between">
                      <div>
                        <div className="row">
                          <span
                            className="dot"
                            style={{
                              background: selected.color,
                              width: 10,
                              height: 10,
                            }}
                          />
                          <h1 className="detail-title">{selected.couple}</h1>
                          {selected.archived && (
                            <span className="badge neutral">Đã lưu trữ</span>
                          )}
                        </div>
                        <div className="detail-meta">
                          <span className="row">
                            <CalendarDays size={14} />
                            {dateLabel(selected.date)}
                          </span>
                          <span className="row">
                            <MapPin size={14} />
                            {selected.venue || "Chưa có địa điểm"}
                          </span>
                          <span className="row">
                            <Users size={14} />
                            {selected.guestCount} khách
                          </span>
                        </div>
                      </div>
                      <div className="row no-print">
                        <button
                          className="btn small"
                          onClick={() => openModal("wedding", selected)}
                        >
                          <Pencil size={13} />
                          Sửa hồ sơ
                        </button>
                        <button
                          className="btn small"
                          onClick={() => void share(selected)}
                        >
                          <Share2 size={13} />
                          Cổng khách hàng
                        </button>
                      </div>
                    </div>
                    {selected.note && (
                      <p
                        className="muted"
                        style={{ fontSize: 12, marginTop: 17 }}
                      >
                        {selected.note}
                      </p>
                    )}
                  </section>
                  <div className="stats detail-stats">
                    <div className="stat">
                      <div className="stat-label">Ngân sách dự kiến</div>
                      <div className="stat-value">
                        {shortMoney(selected.budget)}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Giá trị đã chốt</div>
                      <div className="stat-value">
                        {shortMoney(
                          state.vendors
                            .filter((v) => v.weddingId === selected.id)
                            .reduce((s, v) => s + v.agreed, 0),
                        )}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Đã thanh toán</div>
                      <div className="stat-value">
                        {shortMoney(weddingPaid(state, selected.id))}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Tiến độ công việc</div>
                      <div className="stat-value">
                        {progressFor(state, selected.id)}%
                      </div>
                    </div>
                  </div>
                  <div className="tabs wedding-tabs" role="tablist">
                    {weddingTabSchema.options.map((key) => {
                      const count =
                        key === "tasks"
                          ? state.tasks.filter(
                              (t) => t.weddingId === selected.id && !t.done,
                            ).length
                          : key === "guests"
                            ? rsvpSummary(weddingRsvps).attendingPeople
                            : key === "inbox"
                              ? state.updates.filter(
                                  (u) =>
                                    u.weddingId === selected.id &&
                                    (u.status === "ready" ||
                                      u.status === "pending"),
                                ).length
                              : 0;
                      return (
                        <button
                          role="tab"
                          aria-selected={tab === key}
                          className={`tab ${tab === key ? "active" : ""}`}
                          key={key}
                          onClick={() => selectTab(key)}
                        >
                          {weddingTabLabels[key]}
                          {count > 0 && (
                            <span className="tab-count">{count}</span>
                          )}
                          {key === "invite" &&
                            selectedInvitation?.published && (
                              <span
                                className="tab-live"
                                title="Thiệp đang mở"
                              />
                            )}
                        </button>
                      );
                    })}
                  </div>
                  {tab === "tasks" && (
                    <div className="panel">
                      <div className="section-head">
                        <h2>Công việc của đám cưới</h2>
                        <button
                          className="btn small"
                          onClick={() => openModal("task")}
                        >
                          <Plus size={13} />
                          Thêm công việc
                        </button>
                      </div>
                      <TaskRows
                        full
                        state={state}
                        tasks={scopeTasks}
                        onTask={toggleTask}
                        busy={busy}
                      />
                    </div>
                  )}
                  {tab === "vendors" && (
                    <div className="panel">
                      <div className="section-head">
                        <h2>Nhà cung cấp & chi phí</h2>
                        <div className="row">
                          <button
                            className="btn small"
                            onClick={() => openModal("payment")}
                          >
                            Ghi thanh toán
                          </button>
                          <button
                            className="btn small primary"
                            onClick={() => openModal("vendor")}
                          >
                            <Plus size={13} />
                            Nhà cung cấp
                          </button>
                        </div>
                      </div>
                      <VendorTable
                        state={state}
                        vendors={scopeVendors}
                        onEdit={(v) => openModal("vendor", null, v)}
                      />
                    </div>
                  )}
                  {tab === "guests" && (
                    <GuestList
                      key={selected.id}
                      wedding={selected}
                      invitation={selectedInvitation}
                      rsvps={weddingRsvps}
                      inviteUrl={
                        selectedInvitation
                          ? inviteUrl(selectedInvitation)
                          : null
                      }
                      loadError={rsvpError}
                      onOpenInvite={() => selectTab("invite")}
                      onOpenFloorplan={() => selectTab("floorplan")}
                      onSave={saveRsvp}
                      onDelete={deleteRsvp}
                      notify={notify}
                    />
                  )}
                  {tab === "invite" && (
                    <InvitationStudio
                      key={selected.id}
                      wedding={selected}
                      invitation={selectedInvitation}
                      teamName={state.teamName}
                      demo={demo}
                      busy={busy}
                      inviteUrl={inviteUrl}
                      onSave={saveInvitation}
                      notify={notify}
                    />
                  )}
                  {tab === "floorplan" && floor(selected)}
                  {tab === "inbox" && <InboxView {...inboxProps} />}
                  <button
                    className="text-link no-print"
                    style={{ marginTop: 25, color: "var(--muted)" }}
                    disabled={busy}
                    onClick={() =>
                      void commit(
                        {
                          ...state,
                          weddings: state.weddings.map((w) =>
                            w.id === selected.id
                              ? { ...w, archived: !w.archived }
                              : w,
                          ),
                        },
                        selected.archived
                          ? "Đã đưa hồ sơ về danh sách chuẩn bị."
                          : "Đã lưu trữ hồ sơ.",
                      ).catch(() => {})
                    }
                  >
                    <Archive size={13} />
                    {selected.archived
                      ? "Đưa về đang chuẩn bị"
                      : "Lưu trữ hồ sơ đám cưới"}
                  </button>
                </>
              )}
              {view === "inbox" && (
                <>
                  <div className="filters">{weddingScope}</div>
                  <InboxView key={weddingId ?? "all"} {...inboxProps} />
                </>
              )}
              {view === "tasks" && (
                <>
                  <div className="filters">
                    {weddingScope}
                    {[
                      ["all", "Tất cả"],
                      ["mine", "Của tôi"],
                      ["pending", "Chưa xong"],
                      ["today", "Hôm nay"],
                      ["overdue", "Quá hạn"],
                      ["done", "Đã xong"],
                    ].map(([id, text]) => (
                      <button
                        className={`filter ${filter === id ? "active" : ""}`}
                        key={id}
                        onClick={() => setFilter(id)}
                      >
                        {text}
                      </button>
                    ))}
                    <label className="filter-search">
                      <Search size={14} />
                      <input
                        placeholder="Tìm công việc…"
                        aria-label="Tìm công việc"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="panel">
                    <TaskRows
                      full
                      state={state}
                      tasks={scopeTasks}
                      onTask={toggleTask}
                      busy={busy}
                      onWedding={(id) => go("weddings", id)}
                    />
                  </div>
                </>
              )}
              {view === "payments" && (
                <>
                  <div className="filters">{weddingScope}</div>
                  <div className="stats">
                    <div className="stat">
                      <div className="stat-label">Tổng báo giá</div>
                      <div className="stat-value">
                        {shortMoney(
                          scopeVendors.reduce((s, v) => s + v.quoted, 0),
                        )}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Giá trị đã chốt</div>
                      <div className="stat-value">
                        {shortMoney(
                          scopeVendors.reduce((s, v) => s + v.agreed, 0),
                        )}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Đã thanh toán</div>
                      <div className="stat-value">
                        {shortMoney(
                          scopeVendors.reduce(
                            (s, v) => s + paidFor(state, v.id),
                            0,
                          ),
                        )}
                      </div>
                    </div>
                    <div className="stat accent">
                      <div className="stat-label">Còn phải thanh toán</div>
                      <div className="stat-value">
                        {shortMoney(
                          scopeVendors.reduce(
                            (s, v) =>
                              s + Math.max(0, v.agreed - paidFor(state, v.id)),
                            0,
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="section-head">
                      <h2>Theo dõi nhà cung cấp</h2>
                      <button
                        className="btn small"
                        onClick={() => openModal("payment")}
                      >
                        <Plus size={13} />
                        Ghi nhận thanh toán
                      </button>
                    </div>
                    <VendorTable
                      state={state}
                      vendors={scopeVendors}
                      onEdit={(v) => openModal("vendor", null, v)}
                    />
                  </div>
                  {state.payments.length > 0 && (
                    <div className="panel" style={{ marginTop: 22 }}>
                      <div className="section-head">
                        <h2>Lịch sử thanh toán đã xác nhận</h2>
                      </div>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>NGÀY</th>
                              <th>NHÀ CUNG CẤP</th>
                              <th>SỐ TIỀN</th>
                              <th>MÃ GIAO DỊCH</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state.payments
                              .filter(
                                (p) => !weddingId || p.weddingId === weddingId,
                              )
                              .slice()
                              .reverse()
                              .map((p) => (
                                <tr key={p.id}>
                                  <td>{dateLabel(p.date)}</td>
                                  <td>
                                    {
                                      state.vendors.find(
                                        (v) => v.id === p.vendorId,
                                      )?.name
                                    }
                                  </td>
                                  <td>{money(p.amount)}</td>
                                  <td>{p.reference || "—"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
              {view === "floorplan" && (
                <>
                  {
                    <label
                      className="field"
                      style={{ maxWidth: 320, marginBottom: 22 }}
                    >
                      Chọn đám cưới
                      <select
                        value={weddingId ?? ""}
                        onChange={(e) => go("floorplan", e.target.value)}
                      >
                        <option value="">Chọn hồ sơ để bố trí bàn tiệc</option>
                        {active.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.couple}
                          </option>
                        ))}
                      </select>
                    </label>
                  }
                  {selected ? (
                    floor(selected)
                  ) : (
                    <div className="panel">
                      <Empty
                        title="Một sơ đồ cho mỗi đám cưới"
                        description="Chọn đám cưới để nhập kích thước phòng và tạo bố trí bàn tiệc."
                      />
                    </div>
                  )}
                </>
              )}
              {view === "team" && (
                <div className="dashboard-grid">
                  <div className="panel">
                    <div className="section-head">
                      <h2>{state.teamName}</h2>
                      <Users size={18} className="muted" />
                    </div>
                    {state.members.map((m, i) => (
                      <div className="payment-row" key={m}>
                        <div className="row">
                          <span className="avatar">{m.slice(0, 1)}</span>
                          <div>
                            <strong>{m}</strong>
                            <small>
                              {
                                state.tasks.filter(
                                  (t) => t.owner === m && !t.done,
                                ).length
                              }{" "}
                              công việc đang phụ trách
                            </small>
                          </div>
                        </div>
                        <span className="badge neutral">
                          {i === 0 ? "Chủ đội ngũ" : "Thành viên"}
                        </span>
                      </div>
                    ))}
                    {demo && (
                      <form
                        className="row"
                        style={{ marginTop: 18 }}
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const name = String(
                            new FormData(form).get("name") ?? "",
                          ).trim();
                          if (!name || state.members.includes(name)) return;
                          try {
                            await commit(
                              { ...state, members: [...state.members, name] },
                              "Đã thêm thành viên minh họa.",
                            );
                            form.reset();
                          } catch {}
                        }}
                      >
                        <input
                          className="input"
                          name="name"
                          required
                          maxLength={80}
                          placeholder="Tên thành viên minh họa"
                          aria-label="Tên thành viên mới"
                        />
                        <button className="btn" disabled={busy}>
                          Thêm
                        </button>
                      </form>
                    )}
                    {!demo && role === "owner" && (
                      <div style={{ marginTop: 22 }}>
                        <button
                          className="btn"
                          onClick={async () => {
                            try {
                              const { token } = await request("/api/team", {
                                method: "POST",
                                body: JSON.stringify({ action: "invite" }),
                              });
                              setInvite(`${location.origin}/join/${token}`);
                            } catch (e) {
                              notify((e as Error).message, true);
                            }
                          }}
                        >
                          <Link2 size={15} />
                          Tạo liên kết mời đội ngũ
                        </button>
                        {invite && (
                          <div
                            className="stack"
                            style={{ marginTop: 15, gap: 8 }}
                          >
                            <input
                              className="input"
                              readOnly
                              value={invite}
                              aria-label="Liên kết mời"
                            />
                            <button
                              className="btn small"
                              onClick={() =>
                                void navigator.clipboard
                                  .writeText(invite)
                                  .then(() =>
                                    notify("Đã sao chép liên kết mời."),
                                  )
                              }
                            >
                              Sao chép liên kết
                            </button>
                            <small className="muted">
                              Liên kết có hiệu lực 7 ngày. Gửi trực tiếp cho
                              thành viên bạn muốn mời.
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="stack">
                    <section className="panel">
                      <h2>Dữ liệu của đội ngũ</h2>
                      <p
                        className="muted"
                        style={{ fontSize: 12, margin: "12px 0 20px" }}
                      >
                        {demo
                          ? "Dữ liệu trải nghiệm được lưu trên trình duyệt. Bạn có thể tải bản sao trước khi xóa dữ liệu trình duyệt."
                          : "Hồ sơ được lưu riêng cho đội ngũ. Tải bản sao để lưu trữ nội bộ."}
                      </p>
                      <button
                        className="btn"
                        onClick={() => {
                          const url = URL.createObjectURL(
                            new Blob([JSON.stringify(state, null, 2)], {
                              type: "application/json",
                            }),
                          );
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `wedly-${today()}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download size={14} />
                        Tải bản sao dữ liệu
                      </button>
                      {demo && (
                        <button
                          className="btn"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Xóa dữ liệu trải nghiệm trên trình duyệt này và nạp lại dữ liệu mẫu?",
                              )
                            )
                              return;
                            localStorage.removeItem(STORAGE_KEY);
                            localStorage.removeItem(DEMO_RSVP_KEY);
                            window.location.href = "/demo";
                          }}
                        >
                          <RotateCcw size={14} />
                          Đặt lại dữ liệu mẫu
                        </button>
                      )}
                    </section>
                    <section className="panel">
                      <h2>Thời hạn ảnh trao đổi</h2>
                      <p
                        className="muted"
                        style={{ fontSize: 12, marginTop: 12 }}
                      >
                        Ảnh mặc định hết hạn sau 48 giờ từ lúc tải lên. Thông
                        tin đã xác nhận vẫn được giữ. Bật “Giữ làm chứng từ” cho
                        nguồn bạn cần lưu lâu hơn.
                      </p>
                      {demo && (
                        <p
                          className="muted"
                          style={{ fontSize: 11, marginTop: 10 }}
                        >
                          Trong bản trải nghiệm, ảnh hết hạn được dọn khi mở
                          hoặc sử dụng ứng dụng.
                        </p>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <Assistant
        state={state}
        demo={demo}
        weddingId={weddingId}
        go={go}
        onTask={async (task) => {
          const next = {
            ...stateRef.current!,
            tasks: [
              ...stateRef.current!.tasks,
              { ...task, id: crypto.randomUUID(), done: false, sourceId: null },
            ],
          };
          await commit(
            addActivity(next, `Đã tạo công việc: ${task.title}`),
            "Đã tạo công việc từ trợ lý.",
          );
        }}
      />
      <nav className="mobile-tabbar" aria-label="Điều hướng nhanh">
        {(
          [
            ["overview", "Hôm nay", LayoutDashboard],
            ["weddings", "Đám cưới", CalendarDays],
          ] as const
        ).map(([id, text, Icon]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            aria-current={view === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            <Icon size={20} strokeWidth={1.8} />
            {text}
          </button>
        ))}
        <button
          className="tabbar-create"
          aria-label="Tạo mới"
          aria-haspopup="menu"
          onClick={() => setQuickOpen(true)}
        >
          <Plus size={22} />
        </button>
        {(
          [
            ["inbox", "Cập nhật", ImagePlus],
            ["tasks", "Công việc", ListTodo],
          ] as const
        ).map(([id, text, Icon]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            aria-current={view === id ? "page" : undefined}
            onClick={() => go(id)}
          >
            <Icon size={20} strokeWidth={1.8} />
            {text}
            {id === "inbox" && pending > 0 && (
              <span className="tabbar-count">{pending}</span>
            )}
          </button>
        ))}
      </nav>
      {paletteOpen && (
        <CommandPalette
          commands={paletteCommands()}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {modal && (
        <Modal
          title={
            modal === "wedding"
              ? editingWedding
                ? "Sửa hồ sơ đám cưới"
                : "Thêm đám cưới"
              : modal === "task"
                ? "Thêm công việc"
                : modal === "vendor"
                  ? editingVendor
                    ? "Sửa nhà cung cấp"
                    : "Thêm nhà cung cấp"
                  : "Ghi nhận thanh toán"
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <form onSubmit={saveForm}>
            <div className="fields">
              {modal === "wedding" && (
                <>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Tên cặp đôi
                    <input
                      name="couple"
                      required
                      maxLength={120}
                      placeholder="Ví dụ: Minh & Anh"
                      defaultValue={editingWedding?.couple}
                    />
                  </label>
                  <label className="field">
                    Ngày cưới
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={editingWedding?.date}
                    />
                  </label>
                  <label className="field">
                    Người phụ trách
                    <select
                      name="lead"
                      defaultValue={editingWedding?.lead ?? state.members[0]}
                    >
                      {state.members.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Địa điểm
                    <input
                      name="venue"
                      maxLength={160}
                      placeholder="Tên địa điểm, thành phố"
                      defaultValue={editingWedding?.venue}
                    />
                  </label>
                  <label className="field">
                    Số khách dự kiến
                    <input
                      name="guestCount"
                      type="number"
                      min="0"
                      max="10000"
                      required
                      defaultValue={editingWedding?.guestCount ?? 200}
                    />
                  </label>
                  <label className="field">
                    Ngân sách dự kiến (₫)
                    <input
                      name="budget"
                      type="number"
                      min="0"
                      max="100000000000"
                      step="1000"
                      required
                      defaultValue={editingWedding?.budget ?? 300000000}
                    />
                  </label>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Ghi chú
                    <textarea
                      name="note"
                      rows={3}
                      maxLength={2000}
                      defaultValue={editingWedding?.note}
                      placeholder="Lễ gia tiên, yêu cầu đặc biệt…"
                    />
                  </label>
                </>
              )}
              {(modal === "task" || modal === "vendor") && (
                <label className="field" style={{ gridColumn: "1/-1" }}>
                  Đám cưới
                  <select
                    name="weddingId"
                    required
                    defaultValue={
                      editingVendor?.weddingId ??
                      weddingId ??
                      active[0]?.id ??
                      ""
                    }
                  >
                    {active.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.couple}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {modal === "task" && (
                <>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Công việc cần làm
                    <input
                      name="title"
                      required
                      maxLength={200}
                      placeholder="Ví dụ: Xác nhận thực đơn với nhà hàng"
                    />
                  </label>
                  <label className="field">
                    Người phụ trách
                    <select name="owner">
                      <option value="">Chưa phân công</option>
                      {state.members.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Hạn xử lý
                    <input name="dueDate" type="date" defaultValue={today()} />
                  </label>
                </>
              )}
              {modal === "vendor" && (
                <>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Tên nhà cung cấp
                    <input
                      name="name"
                      required
                      maxLength={160}
                      defaultValue={editingVendor?.name}
                    />
                  </label>
                  <label className="field">
                    Hạng mục
                    <select
                      name="category"
                      defaultValue={editingVendor?.category ?? "Trang trí"}
                    >
                      {categoryLabels.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Trạng thái
                    <select
                      name="status"
                      defaultValue={editingVendor?.status ?? "inquiry"}
                    >
                      {Object.entries(dealLabels).map(([key, text]) => (
                        <option key={key} value={key}>
                          {text}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Báo giá (₫)
                    <input
                      name="quoted"
                      type="number"
                      min="0"
                      step="1000"
                      defaultValue={editingVendor?.quoted ?? 0}
                    />
                  </label>
                  <label className="field">
                    Giá trị đã chốt (₫)
                    <input
                      name="agreed"
                      type="number"
                      min="0"
                      step="1000"
                      defaultValue={editingVendor?.agreed ?? 0}
                    />
                  </label>
                  <label className="field">
                    Thanh toán tiếp theo (₫)
                    <input
                      name="nextAmount"
                      type="number"
                      min="0"
                      step="1000"
                      defaultValue={editingVendor?.nextAmount ?? 0}
                    />
                  </label>
                  <label className="field">
                    Hạn thanh toán
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={editingVendor?.dueDate ?? ""}
                    />
                  </label>
                </>
              )}
              {modal === "payment" && (
                <>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Nhà cung cấp
                    <select name="vendorId" required>
                      <option value="">Chọn nhà cung cấp</option>
                      {scopeVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ·{" "}
                          {
                            state.weddings.find((w) => w.id === v.weddingId)
                              ?.couple
                          }
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Số tiền đã trả (₫)
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      max="100000000000"
                      required
                      step="1"
                    />
                  </label>
                  <label className="field">
                    Ngày thanh toán
                    <input
                      name="date"
                      type="date"
                      required
                      defaultValue={today()}
                    />
                  </label>
                  <label className="field" style={{ gridColumn: "1/-1" }}>
                    Mã giao dịch (nếu có)
                    <input name="reference" maxLength={150} />
                  </label>
                  <label
                    className="checkbox-label"
                    style={{ gridColumn: "1/-1" }}
                  >
                    <input type="checkbox" name="confirmed" required />
                    Tôi đã kiểm tra chứng từ và khoản này chưa được ghi nhận
                    trước đó.
                  </label>
                </>
              )}
            </div>
            {formError && (
              <div
                className="notice error"
                role="alert"
                style={{ marginTop: 18 }}
              >
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Hủy
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}
                Lưu{" "}
                {modal === "wedding"
                  ? "hồ sơ"
                  : modal === "task"
                    ? "công việc"
                    : modal === "vendor"
                      ? "nhà cung cấp"
                      : "thanh toán"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          {toast.error ? <X size={15} /> : <Check size={15} />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
function ArrowRightIcon() {
  return <ChevronRight size={15} />;
}
