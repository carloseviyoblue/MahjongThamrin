import type { Ruleset, GameState, GameType } from "./rules";

export type SeatPlayer = { name: string; memberId: number | null };

export type PublicVenue = {
  id: number; slug: string; name: string; shortName: string; logoText: string; logoSubText?: string; logoUrl: string | null;
  social: string; primaryColor: string; accentColor: string; surfaceMode: string; radiusMode: string; cardStyle: string;
  fontPair: string; leaderboardStyle: string; tagline: string; address: string; rules: Ruleset;
  defaultGameType: GameType; defaultStartingPoints: number; defaultPayRule: "half" | "full"; playerSelfOpen: boolean;
};

export type RoundView = {
  id: number; method: "discard" | "selfdraw" | "draw"; winnerSeat: number | null; discarderSeat: number | null; faan: number;
  details: { patterns: { key: string; faan: number }[]; tiles?: string[]; flowers?: string[]; mode: "manual" | "tiles"; note?: string };
  deltas: number[]; players: SeatPlayer[]; createdAt: string;
};

export type TableView = {
  id: number; label: string; area: string; secret: string; gameType: GameType; status: "open" | "playing" | "finished";
  players: SeatPlayer[]; startingPoints: number; payRule: "half" | "full"; totals: number[]; state: GameState;
  roundCount: number; rounds: RoundView[]; updatedAt: string; active?: boolean;
};

export type VenueOverview = { venue: PublicVenue; tables: TableView[]; board: LeaderRow[]; period: string };
export type TablePayload = { table: TableView; venue: PublicVenue; rules: Ruleset; isStaff: boolean; lastFinished: { totals: number[]; players: SeatPlayer[]; endedAt: string | null } | null };
export type LeaderRow = { key: string; name: string; memberId: number | null; points: number; games: number; rounds: number; wins: number; maxFaan: number };
