"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, Spinner, api } from "./ui";

export default function JoinCode({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function extractSecret(raw: string) {
    const value = raw.trim();
    const pathMatch = value.match(/(?:^|\/)m\/([A-Za-z0-9]{10,32})(?:[/?#]|$)/);
    if (pathMatch) return pathMatch[1];
    if (/^[A-Za-z0-9]{10,32}$/.test(value)) return value;
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const secret = extractSecret(code);
    if (!secret) {
      setErr("Scan QR meja atau tempel token/link meja lengkap dari host.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await api(`/api/tables/${secret}`);
      router.push(`/m/${secret}`);
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className={`flex items-stretch gap-2 rounded-2xl p-1.5 ${dark ? "bg-white/8 ring-1 ring-white/15" : "bg-white ring-1 ring-felt-900/10 shadow-sm"}`}>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.slice(0, 180));
            setErr("");
          }}
          placeholder="TEMPEL LINK MEJA"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Link atau token meja"
          className={`min-w-0 flex-1 bg-transparent px-3 text-center font-mono text-sm font-semibold outline-none placeholder:text-[11px] placeholder:font-sans placeholder:font-medium sm:text-base ${
            dark ? "text-gold-200 placeholder:text-cream-50/35" : "text-felt-900 placeholder:text-felt-900/35"
          }`}
        />
        <button type="submit" disabled={loading} className="btn-gold shrink-0 px-4 sm:px-5">
          {loading ? <Spinner className="h-4 w-4" /> : <>Buka <Icon name="arrowRight" className="h-4 w-4" /></>}
        </button>
      </div>
      <p className={`mt-2 min-h-5 text-center text-xs sm:text-sm ${err ? (dark ? "text-red-300" : "text-red-600") : dark ? "text-cream-50/55" : "text-felt-900/50"}`}>
        {err || "Paling mudah: scan QR meja. Kamu juga bisa tempel link dari host."}
      </p>
    </form>
  );
}
