import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark, Icon, NoGambling } from "@/components/ui";
import { GUIDES, GUIDE_ORDER } from "@/lib/guides";
import { GAME_TYPE_META } from "@/lib/rules";

export const metadata: Metadata = { title: "Panduan Bermain Mahjong" };

export default function PanduanIndex() {
  return (
    <div className="paper min-h-dvh">
      <header className="felt text-cream-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/"><BrandMark dark /></Link>
          <Link href="/v/lotus" className="btn-dark-ghost px-3 py-2 text-xs">Demo venue</Link>
        </div>
        <div className="mx-auto max-w-4xl px-5 pb-12 pt-6 text-center">
          <span className="eyebrow text-gold-300">Dokumen tata cara</span>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Panduan Bermain Mahjong</h1>
          <p className="mx-auto mt-3 max-w-xl text-cream-50/65">Empat tipe permainan yang didukung WinMahjong, ditulis rapi dari aturan meja sungguhan — termasuk cara hitung faan/tai dan pembayaran.</p>
        </div>
      </header>
      <main className="mx-auto grid max-w-4xl gap-4 px-5 py-10 sm:grid-cols-2">
        {GUIDE_ORDER.map((t) => {
          const g = GUIDES[t];
          return (
            <Link key={t} href={`/panduan/${t}`} className="card group p-6 transition hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="chip bg-felt-700 text-cream-50">{GAME_TYPE_META[t].zh}</span>
                <Icon name="chevronRight" className="h-5 w-5 text-felt-900/30 transition group-hover:translate-x-1 group-hover:text-felt-700" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-felt-950">{g.title}</h2>
              <p className="mt-1 text-sm font-medium text-gold-600">{g.subtitle}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-felt-900/65">{g.intro}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {g.facts.slice(0, 3).map((f) => <span key={f.label} className="chip bg-cream-100 text-felt-800">{f.label}: {f.value}</span>)}
              </div>
            </Link>
          );
        })}
      </main>
      <footer className="mx-auto max-w-4xl px-5 pb-12"><NoGambling /></footer>
    </div>
  );
}
