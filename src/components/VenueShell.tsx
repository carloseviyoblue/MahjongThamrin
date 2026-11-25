import ThemeStyle from "@/components/ThemeStyle";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, NoGambling, VenueBadge } from "./ui";
import { themeCss } from "@/lib/theme";

type V = { slug: string; name: string; shortName: string; logoText: string; logoSubText?: string; logoUrl: string | null; primaryColor: string; accentColor?: string; surfaceMode?: string; radiusMode?: string; cardStyle?: string; fontPair?: string; social: string; tagline: string };

export default function VenueShell({ venue, children, back, title }: { venue: V; children: ReactNode; back?: string; title?: string }) {
  return (
    <div className="paper themed min-h-dvh overflow-x-hidden">
        <ThemeStyle venue={venue} />
      <header className="felt text-cream-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link href={back ?? `/v/${venue.slug}`} className="flex min-w-0 items-center gap-3">
            {back && <Icon name="arrowLeft" className="h-5 w-5 shrink-0 text-cream-50/70" />}
            <VenueBadge logoText={venue.logoText} logoSubText={venue.logoSubText} logoUrl={venue.logoUrl} color={venue.primaryColor} size={40} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight">{title ?? venue.name}</p>
              <p className="truncate text-xs text-cream-50/55">{title ? venue.name : venue.social || "Powered by WinMahjong"}</p>
            </div>
          </Link>
          <Link href="/host/login" className="btn-dark-ghost shrink-0 px-3 py-2 text-xs">
            <Icon name="lock" className="h-4 w-4" /> <span className="hidden sm:inline">Host</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-5 pb-10 pt-4">
        <NoGambling />
        <p className="mt-2 text-center text-xs text-felt-900/40">
          Powered by <Link href="/" className="font-semibold hover:text-felt-700">WinMahjong</Link>
        </p>
      </footer>
    </div>
  );
}
