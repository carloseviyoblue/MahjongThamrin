"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Modal, Segmented, Spinner, useToast } from "@/components/ui";
import { fmtPts } from "@/lib/rules";
import type { PublicVenue, SeatPlayer } from "@/lib/types";
import { tableStats } from "./GameRecap";
import type { TableView } from "@/lib/types";

type Layout = "board" | "photoBottom" | "photoTop";

function loadImg(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

export default function StoryModal({ open, onClose, venue, table, startingPoints, roomName }: {
  open: boolean; onClose: () => void; venue: PublicVenue; table: TableView; startingPoints: number; roomName: string;
}) {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout, setLayout] = useState<Layout>("board");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [shadeAmt, setShadeAmt] = useState(55);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [tileImgs, setTileImgs] = useState<(HTMLImageElement | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const stats = tableStats(table, startingPoints);
  const players: SeatPlayer[] = table.players;

  useEffect(() => {
    if (!open) return;
    (venue.logoUrl ? loadImg(venue.logoUrl) : Promise.resolve(null)).then(setLogo);
    Promise.all(["dR", "wE", "p8", "dG"].map((c) => loadImg(`/tiles/${c}.svg`))).then(setTileImgs);
  }, [open, venue.logoUrl]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const W = 1080, H = 1920;
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    const brand = venue.primaryColor || "#0f5132";
    const accent = venue.accentColor || "#d4a73d";
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, shade(brand, 0.12)); g.addColorStop(1, shade(brand, -0.6));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const usePhoto = layout !== "board" && !!photo;
    if (usePhoto && photo) {
      cover(ctx, photo, 0, 0, W, H);
      ctx.fillStyle = `rgba(3,20,12,${(shadeAmt / 100) * 0.55})`;
      ctx.fillRect(0, 0, W, H);
      const fade = ctx.createLinearGradient(0, layout === "photoTop" ? 0 : H * 0.35, 0, layout === "photoTop" ? H * 0.62 : H);
      if (layout === "photoTop") { fade.addColorStop(0, "rgba(3,20,12,0.88)"); fade.addColorStop(1, "rgba(3,20,12,0)"); }
      else { fade.addColorStop(0, "rgba(3,20,12,0)"); fade.addColorStop(1, "rgba(3,20,12,0.92)"); }
      ctx.fillStyle = fade; ctx.fillRect(0, 0, W, H);
    } else {
      tileImgs.forEach((img, i) => {
        const pos: [number, number, number][] = [[60, 110, -14], [900, 80, 12], [50, 1580, 10], [920, 1540, -10]];
        if (pos[i]) drawTile(ctx, img, pos[i][0], pos[i][1], 110, pos[i][2], 0.45);
      });
    }

    let y = layout === "photoTop" ? 90 : layout === "photoBottom" ? 1010 : 170;
    // header logo + venue
    if (layout === "photoTop") {
      ctx.textAlign = "left";
      drawLogo(ctx, logo, venue, 70, y, 84, brand);
      ctx.fillStyle = "#fff"; ctx.font = `700 44px "Plus Jakarta Sans", sans-serif`; ctx.textBaseline = "middle";
      ctx.fillText(venue.shortName, 175, y + 32);
      ctx.fillStyle = hexA(accent, 0.95); ctx.font = `700 22px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(venue.name.toUpperCase().split("").join(" "), 175, y + 68);
      ctx.textBaseline = "alphabetic";
      y += 170;
    } else {
      const ls = layout === "board" ? 150 : 110;
      drawLogo(ctx, logo, venue, W / 2 - ls / 2, y, ls, brand);
      y += ls + 55;
      ctx.textAlign = "center";
      ctx.fillStyle = hexA(accent, 0.9); ctx.font = `700 28px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(venue.name.toUpperCase().split("").join(" "), W / 2, y);
      y += 92;
      ctx.fillStyle = "#fdfbf6"; ctx.font = `600 ${layout === "board" ? 84 : 66}px Fraunces, Georgia, serif`;
      ctx.fillText("Hasil Main Hari Ini", W / 2, y);
      y += 60;
    }

    const champ = stats[0];
    if (layout !== "photoTop" && champ) {
      const cardH = layout === "board" ? 290 : 225;
      ctx.fillStyle = "rgba(212,167,61,0.16)"; rr(ctx, 120, y, W - 240, cardH, 42); ctx.fill();
      ctx.strokeStyle = hexA(accent, 0.5); ctx.lineWidth = 2; rr(ctx, 120, y, W - 240, cardH, 42); ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = accent; ctx.font = `700 26px "Plus Jakarta Sans", sans-serif`; ctx.fillText("👑  JUARA", W / 2, y + 62);
      ctx.fillStyle = "#fff"; ctx.font = `600 ${fit(ctx, champ.name, layout === "board" ? 104 : 82, W - 340)}px Fraunces, Georgia, serif`;
      ctx.fillText(champ.name, W / 2, y + (layout === "board" ? 180 : 140));
      ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.font = `700 33px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(`${fmtPts(champ.diff)} poin · saldo ${champ.total.toLocaleString("id-ID")} · ${champ.wins}× menang`, W / 2, y + cardH - 42);
      y += cardH + 46;
    }

    const rowH = layout === "board" ? 122 : 96;
    const rows = layout === "photoTop" ? stats : stats;
    rows.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? hexA(accent, layout === "photoTop" ? 0.92 : 0.25) : "rgba(10,30,20,0.55)";
      if (layout === "board") ctx.fillStyle = i === 0 ? "rgba(212,167,61,0.22)" : "rgba(255,255,255,0.08)";
      rr(ctx, 120, y, W - 240, rowH - 16, 28); ctx.fill();
      const cy = y + (rowH - 16) / 2;
      const dark = layout === "photoTop" && i === 0;
      ctx.fillStyle = i === 0 ? accent : "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.arc(192, cy, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i === 0 ? "#082e1e" : "#fff"; ctx.font = `800 32px "Plus Jakarta Sans", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), 192, cy + 1);
      ctx.textAlign = "left"; ctx.fillStyle = dark ? "#082e1e" : "#fff"; ctx.font = `700 ${fit(ctx, s.name, 44, 400)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(s.name, 250, cy - 12);
      ctx.font = `600 24px "Plus Jakarta Sans", sans-serif`; ctx.fillStyle = dark ? "rgba(8,46,30,0.7)" : "rgba(255,255,255,0.55)";
      ctx.fillText(`${s.wins}× menang · saldo ${s.total.toLocaleString("id-ID")}`, 250, cy + 26);
      ctx.textAlign = "right"; ctx.font = `800 44px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = s.diff > 0 ? (dark ? "#0f5132" : "#8ee0b0") : s.diff < 0 ? "#ff9b9b" : "rgba(255,255,255,0.6)";
      ctx.fillText(fmtPts(s.diff), W - 165, cy);
      ctx.textBaseline = "alphabetic";
      y += rowH;
    });

    ctx.textAlign = "center";
    const fy = H - 120;
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `600 29px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(`${roomName} · ${table.label} · ${table.rounds.length} hand · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, W / 2, fy);
    ctx.fillStyle = hexA(accent, 0.9); ctx.font = `700 24px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText("DICATAT DENGAN WINMAHJONG", W / 2, fy + 48);
    void players;
  }, [layout, photo, shadeAmt, logo, tileImgs, stats, venue, roomName, table, players]);

  useEffect(() => {
    if (!open) return;
    const run = () => requestAnimationFrame(draw);
    run();
    document.fonts?.ready.then(run).catch(() => {});
  }, [open, draw]);

  const blob = () => new Promise<Blob | null>((res) => canvasRef.current?.toBlob((b) => res(b), "image/png"));
  async function download() {
    const b = await blob();
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `story-${venue.slug}-${table.label.replace(/\s+/g,"-").toLowerCase()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function share() {
    setBusy(true);
    try {
      const b = await blob();
      if (!b) return;
      const file = new File([b], `story-${venue.slug}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: "Hasil Main Hari Ini", text: `Main mahjong di ${venue.name} ${venue.social}` });
      else { await download(); toast("Perangkat tidak mendukung share langsung — gambar diunduh.", "info"); }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Gagal membagikan", "err");
    } finally { setBusy(false); }
  }
  function onPhoto(e: React.ChangeEvent<HTMLInputElement>, camera = false) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast("File harus gambar", "err");
    loadImg(URL.createObjectURL(f)).then((img) => { if (img) { setPhoto(img); setPhotoName(f.name); if (layout === "board") setLayout("photoBottom"); } else toast("Gagal membaca foto", "err"); });
    void camera;
  }
  async function useDemo() {
    const img = await loadImg("/images/story-demo.jpg");
    if (img) { setPhoto(img); setPhotoName("Foto contoh"); if (layout === "board") setLayout("photoBottom"); }
    else toast("Foto contoh tidak tersedia", "err");
  }

  return (
    <Modal open={open} onClose={onClose} title="Bagikan ke Story" subtitle="Foto hanya diproses di HP ini dan tidak disimpan di server."
      footer={<div className="flex gap-2"><button onClick={download} className="btn-ghost flex-1 py-3 uppercase tracking-wider"><Icon name="download" className="h-4 w-4" /> Unduh</button><button onClick={share} disabled={busy} className="btn-primary flex-[2] py-3 uppercase tracking-wider">{busy ? <Spinner className="h-4 w-4" /> : <Icon name="share" className="h-4 w-4" />} Bagikan</button></div>}>
      <div className="flex flex-col items-center gap-4">
        <div className="-mx-1 w-full overflow-x-auto px-1 scrollbar-none">
          <Segmented<Layout> size="sm" value={layout} onChange={setLayout} options={[{ value: "board", label: "Papan Skor" }, { value: "photoBottom", label: "Foto + Skor Bawah" }, { value: "photoTop", label: "Foto + Papan Atas" }]} />
        </div>
        <canvas ref={canvasRef} className="aspect-[9/16] w-full max-w-[260px] rounded-3xl shadow-xl ring-1 ring-black/10" />
        {layout !== "board" && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="btn-ghost cursor-pointer uppercase tracking-wide">
                <Icon name="camera" className="h-4 w-4" /> Ambil foto
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e, true)} />
              </label>
              <label className="btn-ghost cursor-pointer uppercase tracking-wide">
                <Icon name="grid" className="h-4 w-4" /> Dari galeri
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <button type="button" onClick={useDemo} className="w-full text-center text-xs font-semibold text-felt-700 underline">Pakai foto contoh meja mahjong</button>
            {photoName && <p className="text-center text-xs text-felt-900/50">Foto: {photoName}</p>}
            <label className="block">
              <span className="label">Kegelapan lapisan skor</span>
              <input type="range" min={0} max={100} value={shadeAmt} onChange={(e) => setShadeAmt(Number(e.target.value))} className="w-full accent-emerald-700" />
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null, venue: PublicVenue, x: number, y: number, s: number, brand: string) {
  ctx.save();
  rr(ctx, x, y, s, s, s * 0.3); ctx.clip();
  if (logo) ctx.drawImage(logo, x, y, s, s);
  else {
    ctx.fillStyle = "#fdfbf6"; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = brand; ctx.font = `900 ${s * 0.52}px "Noto Serif TC", serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(venue.logoText, x + s / 2, y + s / 2 + 2);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2; rr(ctx, x, y, s, s, s * 0.3); ctx.stroke();
  ctx.textBaseline = "alphabetic";
}
function drawTile(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, rot: number, alpha: number) {
  const h = w * 1.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate((rot * Math.PI) / 180); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = "#0f5132"; rr(ctx, 0, 9, w, h, 13); ctx.fill();
  ctx.fillStyle = "#f7f1e1"; rr(ctx, 0, 0, w, h, 13); ctx.fill();
  if (img) ctx.drawImage(img, w * 0.08, h * 0.07, w * 0.84, h * 0.86);
  ctx.restore();
}
function fit(ctx: CanvasRenderingContext2D, text: string, size: number, maxW: number) {
  ctx.font = `700 ${size}px "Plus Jakarta Sans", sans-serif`;
  const w = ctx.measureText(text).width;
  return w > maxW ? Math.max(24, Math.floor((size * maxW) / w)) : size;
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  ctx.restore();
}
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
