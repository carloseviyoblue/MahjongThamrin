import { notFound } from "next/navigation";
import type { Metadata } from "next";
import VenueShell from "@/components/VenueShell";
import RulesView from "@/components/RulesView";
import { getVenue } from "@/lib/venue";
import { PAY_RULE_DESC, PAY_RULE_LABEL } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "House Rules" };

export default async function RulesPage({ params }: PageProps<"/v/[slug]/rules">) {
  const venue = await getVenue((await params).slug);
  if (!venue) notFound();
  return (
    <VenueShell venue={venue} back={`/v/${venue.slug}`} title="House Rules">
      <div className="card p-5 sm:p-6">
        <RulesView rules={venue.rules} venueName={venue.name} gameType={venue.rules.preset} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(["half", "full"] as const).map((k) => (
          <div key={k} className="card p-4">
            <p className="font-semibold text-felt-950">{PAY_RULE_LABEL[k]}</p>
            <p className="mt-1 text-sm text-felt-900/60">{PAY_RULE_DESC[k]}</p>
          </div>
        ))}
      </div>
    </VenueShell>
  );
}
