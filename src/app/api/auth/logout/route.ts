import { destroySession } from "@/lib/server";

export async function POST() {
  await destroySession();
  return Response.json({ ok: true });
}
