import { pgTable, serial, text, integer, timestamp, jsonb, uniqueIndex, index, boolean } from "drizzle-orm/pg-core";
import type { Ruleset, GameType } from "@/lib/rules";

export type SeatPlayer = { name: string; memberId: number | null };

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  logoText: text("logo_text").notNull().default("麻"),
  logoSubText: text("logo_sub_text").notNull().default("中"),
  logoUrl: text("logo_url"),
  social: text("social").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#0f5132"),
  accentColor: text("accent_color").notNull().default("#d4a73d"),
  surfaceMode: text("surface_mode").notNull().default("light"),
  radiusMode: text("radius_mode").notNull().default("soft"),
  cardStyle: text("card_style").notNull().default("solid"),
  fontPair: text("font_pair").notNull().default("jakarta"),
  leaderboardStyle: text("leaderboard_style").notNull().default("podium"),
  tagline: text("tagline").notNull().default(""),
  address: text("address").notNull().default(""),
  rules: jsonb("rules").$type<Ruleset>().notNull(),
  defaultGameType: text("default_game_type").$type<GameType>().notNull().default("classic"),
  defaultStartingPoints: integer("default_starting_points").notNull().default(1000),
  defaultPayRule: text("default_pay_rule").$type<"half" | "full">().notNull().default("half"),
  playerSelfOpen: boolean("player_self_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"owner" | "staff">().notNull().default("staff"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_venue_idx").on(t.venueId)],
);

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const members = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("members_venue_phone_uq").on(t.venueId, t.phone)],
);

/** Meja fisik venue — masing-masing punya QR & alamat rahasia sendiri */
export const venueTables = pgTable(
  "venue_tables",
  {
    id: serial("id").primaryKey(),
    venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    area: text("area").notNull().default(""),
    secret: text("secret").notNull().unique(),
    gameType: text("game_type").$type<GameType>().notNull().default("classic"),
    startingPoints: integer("starting_points").notNull().default(1000),
    payRule: text("pay_rule").$type<"half" | "full">().notNull().default("half"),
    status: text("status").$type<"open" | "playing" | "finished">().notNull().default("open"),
    session: integer("session").notNull().default(1),
    players: jsonb("players").$type<SeatPlayer[]>().notNull().default([]),
    finalTotals: jsonb("final_totals").$type<number[] | null>(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vt_venue_idx").on(t.venueId)],
);

export type RoundDetails = {
  patterns: { key: string; faan: number }[];
  tiles?: string[];
  flowers?: string[];
  mode: "manual" | "tiles";
  note?: string;
};

export const rounds = pgTable(
  "rounds",
  {
    id: serial("id").primaryKey(),
    venueId: integer("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
    tableId: integer("table_id").notNull().references(() => venueTables.id, { onDelete: "cascade" }),
    session: integer("session").notNull().default(1),
    method: text("method").$type<"discard" | "selfdraw" | "draw">().notNull(),
    winnerSeat: integer("winner_seat"),
    discarderSeat: integer("discarder_seat"),
    faan: integer("faan").notNull().default(0),
    details: jsonb("details").$type<RoundDetails>().notNull(),
    deltas: jsonb("deltas").$type<number[]>().notNull(),
    players: jsonb("players").$type<SeatPlayer[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rounds_table_idx").on(t.tableId), index("rounds_venue_idx").on(t.venueId, t.createdAt)],
);

export type Venue = typeof venues.$inferSelect;
export type VenueTable = typeof venueTables.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type User = typeof users.$inferSelect;
