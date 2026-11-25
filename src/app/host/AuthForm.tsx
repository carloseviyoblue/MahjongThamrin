"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark, Icon, Segmented, Spinner, api } from "@/components/ui";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [f, setF] = useState({ venueName: "", ownerName: "", username: "", password: "", preset: "classic" as "classic" | "new18" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "login") await api("/api/auth/login", { method: "POST", json: { username: f.username, password: f.password } });
      else await api("/api/auth/register", { method: "POST", json: f });
      router.replace("/host");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="felt relative hidden flex-col justify-between overflow-hidden p-12 text-cream-50 lg:flex">
        <Link href="/"><BrandMark dark /></Link>
        <div>
          <p className="font-han text-[120px] font-black leading-none text-gold-300/15">東南西北</p>
          <h2 className="mt-6 max-w-md font-display text-4xl font-semibold leading-tight">Kelola room, member, dan aturan faan venue Anda dari satu tempat.</h2>
          <ul className="mt-6 space-y-2 text-cream-50/70">
            {["Buat room & meja dalam hitungan detik", "Liga mingguan & bulanan otomatis", "Branding venue tampil di TV & story"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-gold-300" strokeWidth={2.5} />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-cream-50/40">Dilarang berjudi · Untuk hiburan & olahraga otak</p>
      </div>

      <div className="paper flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 lg:hidden"><Link href="/"><BrandMark /></Link></div>
          <h1 className="font-display text-3xl font-semibold text-felt-950">{mode === "login" ? "Masuk sebagai host" : "Daftarkan venue"}</h1>
          <p className="mt-1.5 text-sm text-felt-900/60">
            {mode === "login" ? "Untuk owner & staf venue." : "Gratis. Venue Anda langsung siap dipakai."}
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="label" htmlFor="venueName">Nama venue</label>
                  <input id="venueName" className="input" value={f.venueName} onChange={set("venueName")} placeholder="Lotus Mahjong Club" required />
                </div>
                <div>
                  <label className="label" htmlFor="ownerName">Nama owner</label>
                  <input id="ownerName" className="input" value={f.ownerName} onChange={set("ownerName")} placeholder="Nama lengkap" required />
                </div>
                <div>
                  <span className="label">Aturan main awal</span>
                  <Segmented value={f.preset} onChange={(v) => setF({ ...f, preset: v })} options={[{ value: "classic", label: "HK Classic" }, { value: "new18", label: "HK New 18" }]} />
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="username">Username</label>
              <input id="username" className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") })} placeholder="username" autoComplete="username" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={show ? "text" : "password"} className="input pr-11" value={f.password} onChange={set("password")} placeholder={mode === "register" ? "Minimal 6 karakter" : "••••••"} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-felt-900/40 hover:text-felt-800" aria-label="Tampilkan password"><Icon name="eye" className="h-4 w-4" /></button>
              </div>
            </div>
            {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner className="h-4 w-4" /> : <>{mode === "login" ? "Masuk" : "Buat venue"} <Icon name="arrowRight" className="h-4 w-4" /></>}
            </button>
          </form>
          {mode === "login" ? (
            <>
              <div className="mt-6 rounded-2xl bg-gold-50 p-4 text-sm ring-1 ring-gold-200">
                <p className="font-semibold text-felt-950">Akun demo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setF({ ...f, username: "lotus", password: "lotus123" })} className="chip bg-white text-felt-800 ring-1 ring-felt-900/10 hover:ring-felt-500">Owner · lotus</button>
                  <button type="button" onClick={() => setF({ ...f, username: "stephanie", password: "staff123" })} className="chip bg-white text-felt-800 ring-1 ring-felt-900/10 hover:ring-felt-500">Staf · stephanie</button>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-felt-900/60">Belum punya venue? <Link href="/host/register" className="font-semibold text-felt-700 hover:underline">Daftar gratis</Link></p>
            </>
          ) : (
            <p className="mt-6 text-center text-sm text-felt-900/60">Sudah punya akun? <Link href="/host/login" className="font-semibold text-felt-700 hover:underline">Masuk</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
