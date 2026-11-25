import Link from "next/link";
import { BrandMark, Icon, NoGambling, Tile } from "@/components/ui";
import JoinCode from "@/components/JoinCode";
import { ensureSeed } from "@/lib/server";

export const dynamic = "force-dynamic";

const FEATURES = [
  { no: "01", who: "Pemain", title: "Faan Dihitung Otomatis", desc: "Pilih pemenang, cara menang, dan pola — poin langsung terhitung. Mendukung HK Classic, New 18, Taiwan 16, dan Basic.", icon: "calc" },
  { no: "02", who: "Pemain", title: "Pick Tiles, Beres", desc: "Ketuk 14 tile tangan menang. Sistem mendeteksi Pung, Chow, Seven Pairs sampai Thirteen Orphans.", icon: "grid" },
  { no: "03", who: "Layar TV", title: "Leaderboard Klub di TV", desc: "Podium juara 1–3, peringkat bergulir, nama & logo venue. Pemain penasaran naik ranking.", icon: "tv" },
  { no: "04", who: "Venue", title: "QR di Setiap Meja", desc: "Cetak QR berlogo venue untuk tiap meja. Pemain scan → Open Table → langsung main. Tanpa kasir, tanpa kertas.", icon: "qr" },
  { no: "05", who: "Host", title: "Denah Meja Live", desc: "Lihat meja mana yang sedang dimainkan, skor sementara, dan tutup paksa dari dashboard.", icon: "home" },
  { no: "06", who: "Venue", title: "Data Member Rapi", desc: "Nomor HP dobel langsung ketahuan. Riwayat main & poin setiap member tersimpan.", icon: "users" },
  { no: "07", who: "Venue", title: "Aturan Faan Milik Venue", desc: "Preset HK Classic / HK New 18, lalu atur sendiri nilai tiap pola, batas faan & tabel poin.", icon: "book" },
  { no: "08", who: "Pemain", title: "Skor Jadi Instagram Story", desc: "Pakai foto main bareng, langsung share. Logo & nama venue ikut tampil — promosi gratis tiap hari.", icon: "camera" },
  { no: "09", who: "Semua", title: "Tanpa Install", desc: "Berjalan di browser HP, tablet, dan Smart TV. Cukup scan QR meja atau ketik kode room 6 karakter.", icon: "phone" },
];

const FAQ = [
  { q: "Apakah pemain harus membuat akun?", a: "Tidak. Pemain cukup scan QR di meja, isi 4 nama, lalu Buka Meja. Akun hanya untuk owner & staf venue." },
  { q: "Bagaimana jika meja disewa per jam?", a: "Aktifkan PIN staf di Pengaturan → Operasional. Meja hanya bisa dibuka/ditutup dengan PIN dari kasir." },
  { q: "Bagaimana dengan aturan bayar 半銃 dan 全銃?", a: "Keduanya didukung per permainan. 半銃: pembuang bayar penuh dan dua pemain lain setengah. 全銃: pembuang menanggung semuanya." },
  { q: "Bisakah nilai faan diubah?", a: "Bisa. Setiap pola (Mixed One Suit, Small Dragons, dll.) bisa diaktifkan/nonaktifkan dan diubah nilainya. Ada tombol reset ke default." },
  { q: "Apakah data bisa di-backup?", a: "Owner dapat mengunduh backup JSON lengkap dan ekspor CSV semua round kapan saja." },
];

export default async function Home() {
  await ensureSeed();
  return (
    <div className="paper">
      {/* NAV */}
      <header className="felt sticky top-0 z-40 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/"><BrandMark dark /></Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-cream-50/70 md:flex">
            <a href="#fitur" className="hover:text-cream-50">Fitur</a>
            <a href="#cara" className="hover:text-cream-50">Cara kerja</a>
            <a href="#demo" className="hover:text-cream-50">Demo</a>
            <a href="#faq" className="hover:text-cream-50">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/host/login" className="btn-dark-ghost px-3 py-2">Masuk Host</Link>
            <Link href="/host/register" className="btn-gold hidden px-3 py-2 sm:inline-flex">Daftarkan Venue</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="felt relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[6%] top-24 animate-float [--r:-12deg] opacity-80"><Tile code="dR" size="lg" /></div>
          <div className="absolute right-[8%] top-16 animate-float opacity-70 [--r:10deg] [animation-delay:1s]"><Tile code="wE" size="md" /></div>
          <div className="absolute bottom-16 left-[12%] hidden animate-float opacity-60 [--r:8deg] [animation-delay:2s] lg:block"><Tile code="p8" size="md" /></div>
          <div className="absolute bottom-24 right-[42%] hidden animate-float opacity-50 [--r:-6deg] [animation-delay:3s] lg:block"><Tile code="dG" size="sm" /></div>
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pb-28 md:pt-20">
          <div className="animate-rise">
            <span className="eyebrow rounded-full bg-gold-400/10 px-3 py-1.5 text-gold-300 ring-1 ring-gold-300/25">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-300" /> Pencatat skor Mahjong Hong Kong
            </span>
            <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.02] tracking-tight text-cream-50 sm:text-6xl">
              Faan dihitung otomatis.<br />
              <span className="gold-text">Leaderboard di TV.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream-50/70">
              Tempel QR di setiap meja. Pemain scan, buka meja, dan catat skor dari HP — faan & poin terhitung otomatis, leaderboard tampil di TV venue.
            </p>
            <div className="mt-8 max-w-md">
              <JoinCode dark />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/v/lotus" className="btn-dark-ghost">
                <Icon name="eye" className="h-4 w-4" /> Lihat demo venue
              </Link>
              <Link href="/host/register" className="btn-dark-ghost">
                <Icon name="plus" className="h-4 w-4" /> Daftarkan venue gratis
              </Link>
            </div>
          </div>

          {/* Phone mock */}
          <div className="relative mx-auto w-full max-w-[330px] animate-rise [animation-delay:.15s]">
            <div className="absolute -inset-8 rounded-full bg-gold-400/10 blur-3xl" />
            <div className="relative rounded-[2.4rem] border border-white/10 bg-felt-950 p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,.6)]">
              <div className="overflow-hidden rounded-[1.9rem] bg-cream-100">
                <div className="flex items-center justify-between bg-felt-800 px-4 pb-3 pt-4 text-cream-50">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[30%] bg-felt-600 font-han font-bold text-gold-200">蓮</span>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Lotus · Meja 1</p>
                      <p className="text-[10px] text-cream-50/60">Round 東 · Hand 6</p>
                    </div>
                  </div>
                  <span className="chip bg-gold-400/15 text-gold-200">● Bermain</span>
                </div>
                <div className="grid grid-cols-2 gap-2 p-3">
                  {[
                    { w: "東", n: "Budi", p: 1384, d: true },
                    { w: "南", n: "Wati", p: 872 },
                    { w: "西", n: "Kevin", p: 1056 },
                    { w: "北", n: "Lina", p: 688 },
                  ].map((x) => (
                    <div key={x.n} className={`rounded-2xl p-3 ${x.d ? "bg-felt-700 text-cream-50" : "bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-han text-lg font-bold ${x.d ? "text-gold-200" : "text-felt-700"}`}>{x.w}</span>
                        {x.d && <span className="chip bg-gold-400 px-1.5 py-0 text-[9px] text-felt-950">DEALER</span>}
                      </div>
                      <p className="mt-1 text-sm font-semibold">{x.n}</p>
                      <p className={`font-display text-2xl font-semibold ${x.d ? "" : x.p >= 1000 ? "text-felt-700" : "text-red-700"}`}>{x.p.toLocaleString("id-ID")}</p>
                    </div>
                  ))}
                </div>
                <div className="mx-3 mb-3 rounded-2xl bg-white p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-felt-900">Budi · Zimo</span>
                    <span className="chip bg-gold-100 text-gold-600">5 faan</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {["m1", "m2", "m3", "m7", "m8", "m9", "dR", "dR", "dR"].map((c, i) => <Tile key={i} code={c} size="xs" />)}
                  </div>
                  <p className="mt-2 text-[11px] text-felt-900/60">Mixed One Suit 3 · Pong Naga 1 · Self Pick 1</p>
                </div>
                <div className="px-3 pb-4">
                  <div className="btn-primary w-full">+ Catat Round</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="overflow-hidden border-y border-gold-300/30 bg-gold-50 py-3">
        <div className="flex w-max animate-[ticker_40s_linear_infinite] gap-10 whitespace-nowrap text-sm font-semibold text-felt-800">
          {[...Array(2)].flatMap((_, k) =>
            ["Hu dari buangan & Zimo", "半銃 / 全銃", "HK Classic & HK New 18", "Tabel 半辣上 / 全辣上", "QR per meja", "Open Table", "Undo & edit round", "Rekap otomatis", "Leaderboard mingguan", "Backup JSON & CSV", "Story Instagram"].map((t) => (
              <span key={`${k}-${t}`} className="inline-flex items-center gap-3"><span className="font-han text-gold-500">◆</span>{t}</span>
            )),
          )}
        </div>
      </div>

      {/* FEATURES */}
      <section id="fitur" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="eyebrow text-gold-600">Fitur lengkap</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-felt-950 sm:text-5xl">Semua yang dibutuhkan meja mahjong modern.</h2>
          <p className="mt-4 text-lg text-felt-900/65">Dirancang bersama pemilik venue — dari pemain kasual sampai turnamen bulanan.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.no} className={`group relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-1 ${i === 0 || i === 7 ? "felt text-cream-50" : "card"}`}>
              <div className="flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${i === 0 || i === 7 ? "bg-gold-400/15 text-gold-300" : "bg-felt-50 text-felt-700"}`}>
                  <Icon name={f.icon} />
                </span>
                <span className={`eyebrow ${i === 0 || i === 7 ? "text-gold-300/80" : "text-felt-900/40"}`}>
                  <span className="rounded bg-gold-400 px-1.5 py-0.5 text-[10px] text-felt-950">{f.no}</span> {f.who}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold leading-tight">{f.title}</h3>
              <p className={`mt-2 text-[15px] leading-relaxed ${i === 0 || i === 7 ? "text-cream-50/70" : "text-felt-900/65"}`}>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="cara" className="felt">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="eyebrow text-gold-300">Cara kerja</span>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-cream-50">Tiga langkah, meja langsung jalan.</h2>
              <p className="mt-4 text-cream-50/65">Owner cukup sekali setup. Selebihnya pemain mandiri dari QR di meja.</p>
            </div>
            <ol className="grid gap-4">
              {[
                ["Daftarkan meja & cetak QR", "Tambah meja venue (Meja 1, VIP 1, …), cetak QR berlogo venue, tempel di tiap meja."],
                ["Scan & Open Table", "Pemain scan QR, isi 4 nama (tautkan ke member), atur poin awal, lalu Buka Meja."],
                ["Catat hand, lalu Selesai", "Faan → poin otomatis. Setelah Selesai, rekap & story tersimpan, meja kembali tersedia."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
                  <span className="font-display text-4xl font-semibold text-gold-300/90">{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-cream-50">{t}</h3>
                    <p className="mt-1 text-cream-50/65">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-7">
            <span className="eyebrow text-gold-600">Demo pemain</span>
            <h3 className="mt-3 font-display text-3xl font-semibold text-felt-950">Lotus Mahjong Club</h3>
            <p className="mt-2 text-felt-900/65">Simulasikan scan QR: Meja 1 sedang dimainkan, Meja 2 tersedia untuk Open Table.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/v/lotus" className="btn-primary">Buka demo venue <span className="text-cream-50/70">· scan QR meja</span></Link>
              <Link href="/v/lotus/tv" className="btn-ghost"><Icon name="tv" className="h-4 w-4" /> Layar TV</Link>
              <Link href="/host/login" className="btn-ghost"><Icon name="grid" className="h-4 w-4" /> Dashboard host</Link>
              <Link href="/v/lotus/rules" className="btn-ghost"><Icon name="book" className="h-4 w-4" /> House rules</Link>
            </div>
          </div>
          <div className="card p-7">
            <span className="eyebrow text-gold-600">Demo host</span>
            <h3 className="mt-3 font-display text-3xl font-semibold text-felt-950">Dashboard owner</h3>
            <p className="mt-2 text-felt-900/65">Kelola meja & QR, riwayat, member, staf, branding & aturan faan.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-cream-100 p-3"><p className="label mb-0.5">Owner</p><p className="font-mono font-semibold">lotus / lotus123</p></div>
              <div className="rounded-2xl bg-cream-100 p-3"><p className="label mb-0.5">Staf</p><p className="font-mono font-semibold">stephanie / staff123</p></div>
            </div>
            <Link href="/host/login" className="btn-gold mt-5">Masuk sebagai host <Icon name="arrowRight" className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="text-center font-display text-4xl font-semibold text-felt-950">Pertanyaan umum</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-felt-950">
                {f.q}
                <Icon name="chevronDown" className="h-5 w-5 shrink-0 text-felt-900/40 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-felt-900/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="felt">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-12 text-center">
          <BrandMark dark />
          <p className="max-w-md text-sm text-cream-50/55">Pencatat skor mahjong Hong Kong untuk venue, klub, dan komunitas di Indonesia.</p>
          <NoGambling dark />
          <p className="text-xs text-cream-50/35">© {new Date().getFullYear()} WinMahjong</p>
        </div>
      <div className="mx-auto max-w-6xl px-5 pb-4 text-center">
          <Link href="/panduan" className="text-sm font-semibold text-felt-700 hover:underline">Baca panduan bermain: HK Classic · New 18 · Taiwan · Basic →</Link>
        </div>
      </footer>
    </div>
  );
}
