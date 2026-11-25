import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { venueTables } from "@/db/schema";
import { getCurrentUser, siteOrigin } from "@/lib/server";
import { Tile, VenueBadge } from "@/components/ui";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cetak QR Meja" };

export default async function QrPage({ searchParams }: PageProps<"/host/qr">) {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/host/login");
  const sp = await searchParams;
  const size = sp.size === "large" ? "large" : "normal";
  const tables = await db.select().from(venueTables).where(eq(venueTables.venueId, ctx.venue.id)).orderBy(asc(venueTables.sortOrder), asc(venueTables.id));
  const origin = await siteOrigin();
  const items = await Promise.all(
    tables.filter((t) => t.active).map(async (t) => ({
      t,
      url: `${origin}/m/${t.secret}`,
      svg: await QRCode.toString(`${origin}/m/${t.secret}`, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#082e1e", light: "#00000000" } }),
    })),
  );
  const v = ctx.venue;
  return (
    <div className="min-h-dvh bg-cream-200 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-felt-900/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div>
            <p className="font-display text-xl font-semibold text-felt-950">Cetak QR meja</p>
            <p className="text-xs text-felt-900/55">{items.length} QR · alamat rahasia /m/… — tempel satu di setiap meja.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/host/qr?size=${size === "large" ? "normal" : "large"}`} className="btn-ghost">{size === "large" ? "Ukuran kecil" : "Ukuran besar"}</Link>
            <Link href="/host" className="btn-ghost">Kembali</Link>
            <PrintButton />
          </div>
        </div>
      </div>
      <div className={`mx-auto grid max-w-5xl gap-5 p-5 print:max-w-none print:gap-0 print:p-0 ${size === "large" ? "sm:grid-cols-2 print:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3"}`}>
        {items.length === 0 && <p className="col-span-full py-20 text-center text-felt-900/60">Belum ada meja aktif.</p>}
        {items.map(({ t, svg, url }) => (
          <div key={t.id} className="break-inside-avoid print:p-3">
            <div className="relative flex h-full flex-col items-center overflow-hidden rounded-[26px] border-2 bg-white p-5 text-center shadow-lg print:shadow-none" style={{ borderColor: v.primaryColor }}>
              <div className="absolute inset-x-0 top-0 h-2" style={{ background: v.primaryColor }} />
              <div className="flex items-center gap-2">
                <VenueBadge logoText={v.logoText} logoSubText={v.logoSubText} logoUrl={v.logoUrl} color={v.primaryColor} size={32} />
                <span className="font-display text-base font-semibold text-felt-950">{v.name}</span>
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-felt-900/50">{t.area || "Meja"}</p>
              <p className={`font-display font-semibold leading-none text-felt-950 ${size === "large" ? "text-5xl" : "text-4xl"}`}>{t.label}</p>
              <p className="mt-1 text-[11px] font-semibold text-gold-600">{t.gameType === "classic" ? "Hong Kong Classic" : t.gameType === "new18" ? "HK New 18" : t.gameType === "taiwan" ? "Taiwan 16" : "Basic"}</p>
              <div className={`relative my-3 rounded-2xl bg-cream-50 p-3 ring-1 ring-felt-900/10 ${size === "large" ? "w-60" : "w-44"}`}>
                <div className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
              </div>
              <p className="text-sm font-bold text-felt-950">Scan untuk buka meja & catat skor</p>
              <p className="mt-1 font-mono text-[10px] text-felt-900/50">{url.replace(/^https?:\/\/[^/]+/, "")}</p>
              <div className="mt-auto flex items-end gap-1 pt-3 opacity-90">
                <Tile code="wE" size="xs" /><Tile code="wS" size="xs" /><Tile code="wW" size="xs" /><Tile code="wN" size="xs" />
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-red-700/70">Dilarang berjudi</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
