import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, type SeatPlayer } from "@/db/schema";

export async function cleanPlayers(venueId: number, players: unknown): Promise<{ error: string } | { value: SeatPlayer[] }> {
  if (!Array.isArray(players) || players.length !== 4) return { error: "Isi 4 pemain (Timur, Selatan, Barat, Utara)." };
  const venueMembers = await db.select({ id: members.id }).from(members).where(eq(members.venueId, venueId));
  const validIds = new Set(venueMembers.map((m) => m.id));
  const clean: SeatPlayer[] = [];
  for (const p of players as Partial<SeatPlayer>[]) {
    const name = String(p?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    if (!name) return { error: "Semua nama pemain wajib diisi." };
    const memberId = typeof p?.memberId === "number" && validIds.has(p.memberId) ? p.memberId : null;
    clean.push({ name, memberId });
  }
  if (new Set(clean.map((p) => p.name.toLowerCase())).size !== 4) return { error: "Nama pemain tidak boleh sama dalam satu meja." };
  const ids = clean.map((p) => p.memberId).filter(Boolean);
  if (new Set(ids).size !== ids.length) return { error: "Satu member tidak bisa duduk di dua kursi." };
  return { value: clean };
}
