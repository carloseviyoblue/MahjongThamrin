import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Icon, NoGambling, Tile } from "@/components/ui";
import { GUIDES, GUIDE_ORDER } from "@/lib/guides";
import { GAME_TYPES, type GameType } from "@/lib/rules";

export const dynamic = "force-static";

export function generateStaticParams() {
  return GAME_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: PageProps<"/panduan/[type]">): Promise<Metadata> {
  const { type } = await params;
  const g = GUIDES[type as GameType];
  return { title: g ? `Panduan ${g.title}` : "Panduan" };
}

export default async function GuidePage({ params }: PageProps<"/panduan/[type]">) {
  const { type } = await params;
  if (!GAME_TYPES.includes(type as GameType)) notFound();
  const g = GUIDES[type as GameType];

  return (
    <div className="paper min-h-dvh print:bg-white">
      <header className="felt text-cream-50 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/panduan" className="flex items-center gap-2 text-sm font-semibold text-cream-50/80 hover:text-cream-50"><Icon name="arrowLeft" className="h-4 w-4" /> Semua panduan</Link>
          <div className="flex gap-1">
            {GUIDE_ORDER.map((t) => (
              <Link key={t} href={`/panduan/${t}`} className={`rounded-full px-3 py-1.5 text-xs font-bold ${t === type ? "bg-gold-400 text-felt-950" : "bg-white/10 text-cream-50/70 hover:bg-white/20"}`}>{GUIDES[t].title.split(" ").slice(0, 2).join(" ")}</Link>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-4">
          <div className="flex gap-1.5 opacity-90"><Tile code="dR" size="sm" /><Tile code="dG" size="sm" /><Tile code="dW" size="sm" /><Tile code="wE" size="sm" /></div>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{g.title}</h1>
          <p className="mt-2 font-medium text-gold-300">{g.subtitle}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-cream-50/70">{g.intro}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {g.facts.map((f) => (
            <div key={f.label} className="card p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-felt-900/45">{f.label}</p>
              <p className="mt-0.5 font-display text-lg font-semibold text-felt-950">{f.value}</p>
            </div>
          ))}
        </div>

        {g.sections.map((s) => (
          <section key={s.title} className="card mt-4 p-5 sm:p-6">
            <h2 className="font-display text-2xl font-semibold text-felt-950">{s.title}</h2>
            {s.body.map((b, i) => <p key={i} className="mt-3 leading-relaxed text-felt-900/75">{b}</p>)}
            {s.list && (
              <ul className="mt-3 space-y-1.5">
                {s.list.map((li) => (
                  <li key={li} className="flex gap-2 text-[15px] text-felt-900/75">
                    <span className="mt-1 font-han text-xs text-gold-500">◆</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="card mt-4 overflow-hidden">
          <div className="border-b border-felt-900/6 px-5 py-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-felt-950">Tabel Skor</h2>
            <p className="text-sm text-felt-900/55">Nilai dapat disesuaikan venue di Pengaturan → Aturan Faan.</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {g.scoring.map((r) => (
                <tr key={r.name} className="border-t border-felt-900/5">
                  <td className="px-5 py-2.5 sm:px-6">
                    <p className="font-semibold text-felt-950">{r.name} <span className="font-han text-felt-700/60">{r.zh}</span></p>
                    <p className="text-xs text-felt-900/55">{r.note}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right sm:px-6"><span className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-black text-white">{r.value}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card mt-4 p-5 sm:p-6">
          <h2 className="font-display text-2xl font-semibold text-felt-950">Pembayaran Poin</h2>
          <ul className="mt-3 space-y-1.5">
            {g.payout.map((li) => (
              <li key={li} className="flex gap-2 text-[15px] text-felt-900/75"><span className="mt-1 font-han text-xs text-gold-500">◆</span><span>{li}</span></li>
            ))}
          </ul>
        </section>

        <section className="mt-4 space-y-3">
          <h2 className="px-1 font-display text-2xl font-semibold text-felt-950">Pertanyaan Umum</h2>
          {g.faq.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-felt-950">{f.q}<Icon name="chevronDown" className="h-5 w-5 shrink-0 text-felt-900/40 transition group-open:rotate-180" /></summary>
              <p className="mt-3 text-felt-900/70">{f.a}</p>
            </details>
          ))}
        </section>

        <div className="mt-8 flex flex-wrap gap-2 print:hidden">
          <Link href="/v/lotus" className="btn-primary">Coba di demo venue</Link>
          <Link href={`/panduan`} className="btn-ghost">Panduan lain</Link>
        </div>
        <div className="mt-8"><NoGambling /></div>
        <p className="mt-3 text-center text-xs text-felt-900/40">Sumber rujukan HK: mahjonggame.hk — Hong Kong Mahjong Rules & Scoring (diakses 2026). Aturan meja venue selalu yang berlaku.</p>
      </main>
    </div>
  );
}
