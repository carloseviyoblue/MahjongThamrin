"use client";

import ThemeStyle from "@/components/ThemeStyle";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, ToastProvider, VenueBadge, api } from "@/components/ui";
import { themeCss } from "@/lib/theme";
import type { PublicVenue } from "@/lib/types";
import TablesTab from "./tabs/TablesTab";
import GamesTab from "./tabs/GamesTab";
import MembersTab from "./tabs/MembersTab";
import StaffTab from "./tabs/StaffTab";
import SettingsTab from "./tabs/SettingsTab";

export type HostUser = { id: number; name: string; username: string; role: "owner" | "staff" };
type Tab = "tables" | "games" | "members" | "staff" | "settings";

export default function HostDashboard({ user, venue: initialVenue }: { user: HostUser; venue: PublicVenue }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tables");
  const [venue, setVenue] = useState(initialVenue);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/host/login");
    router.refresh();
  }

  const tabs: { k: Tab; label: string; icon: string }[] = [
    { k: "tables", label: "Meja & QR", icon: "grid" },
    { k: "games", label: "Riwayat & Liga", icon: "trophy" },
    { k: "members", label: "Member", icon: "users" },
    { k: "staff", label: "Staf", icon: "shield" },
    { k: "settings", label: "Pengaturan", icon: "settings" },
  ];

  return (
    <ToastProvider>
      <div className="paper themed min-h-dvh overflow-x-hidden">
        <ThemeStyle venue={venue} />
        <header className="felt text-cream-50">
          <div className="mx-auto max-w-6xl px-5 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <VenueBadge logoText={venue.logoText} logoSubText={venue.logoSubText} logoUrl={venue.logoUrl} color={venue.primaryColor} size={46} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-xl font-semibold">{venue.shortName}</p>
                    <span className="chip shrink-0 bg-gold-400/15 py-0.5 text-[10px] uppercase tracking-widest text-gold-200">Host</span>
                  </div>
                  <p className="truncate text-xs text-cream-50/60">{user.name} · {user.role === "owner" ? "Owner" : "Staf"}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/v/${venue.slug}/tv`} target="_blank" className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="tv" className="h-4 w-4" /><span className="hidden md:inline">Layar TV</span></Link>
                <Link href={`/v/${venue.slug}`} target="_blank" className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="eye" className="h-4 w-4" /><span className="hidden md:inline">Halaman venue</span></Link>
                <button onClick={logout} className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="logout" className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></button>
              </div>
            </div>
            <nav className="-mx-5 mt-6 flex gap-1 overflow-x-auto px-5 scrollbar-none">
              {tabs.map((t) => (
                <button key={t.k} onClick={() => setTab(t.k)} className={`flex shrink-0 items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-semibold transition ${tab === t.k ? "bg-cream-100 text-felt-900" : "text-cream-50/70 hover:text-cream-50"}`}>
                  <Icon name={t.icon} className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6">
          {tab === "tables" && <TablesTab user={user} venue={venue} />}
          {tab === "games" && <GamesTab venue={venue} />}
          {tab === "members" && <MembersTab />}
          {tab === "staff" && <StaffTab user={user} />}
          {tab === "settings" && <SettingsTab user={user} venue={venue} onSaved={setVenue} />}
          <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-felt-900/35">WinMahjong · {venue.name}</p>
        </main>
      </div>
    </ToastProvider>
  );
}
