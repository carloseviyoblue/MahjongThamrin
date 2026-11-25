import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HostDashboard from "./HostDashboard";
import { getCurrentUser } from "@/lib/server";
import { publicVenue } from "@/lib/game";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard Host" };

export default async function HostPage() {
  const ctx = await getCurrentUser();
  if (!ctx) redirect("/host/login");
  const { user, venue } = ctx;
  return (
    <HostDashboard
      user={{ id: user.id, name: user.name, username: user.username, role: user.role }}
      venue={publicVenue(venue)}
    />
  );
}
