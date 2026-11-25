import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venueTables } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membuka meja" };

/** Compatibility alias for older /t/<secret> QR player links. */
export default async function LegacyPlayerTableLink({ params }: PageProps<"/t/[secret]">) {
  const { secret } = await params;
  if (!/^[A-Za-z0-9]{10,32}$/.test(secret)) notFound();
  const [table] = await db
    .select({ secret: venueTables.secret })
    .from(venueTables)
    .where(eq(venueTables.secret, secret))
    .limit(1);
  if (!table) notFound();
  redirect(`/m/${table.secret}`);
}
