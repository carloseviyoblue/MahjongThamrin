"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { TILE_LABEL } from "@/lib/tiles";

// ---------------- Icons (stroke-based, consistent 1.8 weight)
const paths: Record<string, ReactNode> = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  tv: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M8 20h8M9.5 17h5" /></>,
  book: <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z" />,
  logout: <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l-5-5 5-5M5 12h11" />,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></>,
  download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" /><circle cx="12" cy="13" r="3.5" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  calc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" /></>,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  refresh: <path d="M20 11a8 8 0 00-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0014.5 4.5L20 16M20 20v-4h-4" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
};

export function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8 }: { name: keyof typeof paths | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name] ?? null}
    </svg>
  );
}

// ---------------- Venue badge
export function VenueBadge({ logoText, logoSubText, logoUrl, color = "#0f5132", size = 40, className = "" }: { logoText: string; logoSubText?: string; logoUrl?: string | null; color?: string; size?: number; className?: string }) {
  if (logoUrl)
    return (
      <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[26%] ring-1 ring-black/10 ${className}`} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  // Stamp-style badge like the reference: cream tile, han character + small red sub-stamp
  return (
    <span
      className={`relative inline-flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-[22%] bg-gradient-to-b from-cream-50 to-cream-200 shadow-[0_2px_0_rgba(0,0,0,0.12)] ring-1 ring-felt-900/15 ${className}`}
      style={{ width: size, height: size }}
      title={logoText}
    >
      <span className="font-han font-black leading-none" style={{ fontSize: size * 0.44, color }}>{logoText}</span>
      {logoSubText ? (
        <span className="mt-[2px] flex items-center justify-center rounded-[3px] bg-red-700 font-han font-bold leading-none text-white" style={{ width: size * 0.3, height: size * 0.3, fontSize: size * 0.2 }}>
          {logoSubText}
        </span>
      ) : null}
    </span>
  );
}

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-9 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-cream-50 to-cream-200 font-han text-lg font-black text-red-700 shadow-[0_3px_0_#156341,0_6px_12px_rgba(0,0,0,.25)]">
        中
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${dark ? "text-cream-50" : "text-felt-900"}`}>
        Win<span className="gold-text">Mahjong</span>
      </span>
    </span>
  );
}

// ---------------- Tile (authentic Hong Kong tile artwork, public domain — samoheen/mahjong-tiles)
export function Tile({ code, size = "md", selected, onClick, dim, title, badge, kong }: { code: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; selected?: boolean; onClick?: () => void; dim?: boolean; title?: string; badge?: number; kong?: boolean }) {
  const t = TILE_LABEL[code];
  if (!t) return null;
  const dims = { xs: "w-[22px]", sm: "w-[30px]", md: "w-[40px]", lg: "w-[52px]", xl: "w-[68px]" }[size];
  const cls = `mj-tile mj-${size} ${dims} ${selected ? "is-selected" : ""} ${dim ? "is-dim" : ""}`;
  const face = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/tiles/${code}.svg`} alt={t.name} draggable={false} className="mj-face" loading="lazy" />
      {kong ? (
        <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-1 py-px text-[7px] font-black tracking-[0.1em] text-felt-950 shadow-sm ring-1 ring-gold-600/50">KONG</span>
      ) : null}
      {badge ? <span className="absolute -right-1.5 -top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-felt-700 px-1 text-[9px] font-bold text-gold-200 ring-2 ring-white">{badge}</span> : null}
    </>
  );
  if (onClick)
    return (
      <button type="button" onClick={onClick} disabled={dim} className={`${cls} cursor-pointer`} title={title ?? t.name} aria-label={t.name}>
        {face}
      </button>
    );
  return (
    <span className={cls} title={title ?? t.name}>
      {face}
    </span>
  );
}

// ---------------- Modal / Sheet
export function Modal({ open, onClose, title, subtitle, children, wide, footer }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-felt-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative flex max-h-[94dvh] w-full animate-pop flex-col overflow-hidden rounded-t-3xl bg-cream-50 shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 border-b border-felt-900/8 px-5 pb-3 pt-4 sm:px-6">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold text-felt-950">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-felt-900/60">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="-mr-1 rounded-full p-2 text-felt-900/50 hover:bg-felt-900/5 hover:text-felt-900" aria-label="Tutup">
              <Icon name="x" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && <div className="border-t border-felt-900/8 bg-white/60 px-5 py-3 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------- Toasts
type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
const ToastCtx = createContext<(msg: string, kind?: Toast["kind"]) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
        {list.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md animate-pop items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-xl ${
              t.kind === "err" ? "bg-red-600 text-white" : t.kind === "info" ? "bg-felt-950 text-cream-50" : "bg-felt-700 text-cream-50"
            }`}
          >
            <Icon name={t.kind === "err" ? "x" : "check"} className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

// ---------------- Segmented
export function Segmented<T extends string>({ value, onChange, options, dark, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; dark?: boolean; size?: "sm" | "md" }) {
  return (
    <div className={`inline-flex rounded-full p-1 ${dark ? "bg-white/8 ring-1 ring-white/10" : "bg-felt-900/6"}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`whitespace-nowrap rounded-full font-semibold transition ${size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"} ${
              active ? (dark ? "bg-gold-400 text-felt-950 shadow" : "bg-felt-700 text-cream-50 shadow") : dark ? "text-cream-50/70 hover:text-cream-50" : "text-felt-900/60 hover:text-felt-900"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

export function NoGambling({ dark }: { dark?: boolean }) {
  return (
    <p className={`flex items-center justify-center gap-1.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] ${dark ? "text-red-300/80" : "text-red-700/70"}`}>
      <Icon name="ban" className="h-3.5 w-3.5" strokeWidth={2.2} /> Dilarang berjudi · Untuk hiburan & olahraga otak
    </p>
  );
}

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error ?? "Terjadi kesalahan, coba lagi."), { data, status: res.status });
  return data as T;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
