import type { Metadata } from "next";
import TvBoard from "./TvBoard";

export const metadata: Metadata = { title: "Layar TV" };

export default async function TvPage({ params }: PageProps<"/v/[slug]/tv">) {
  return <TvBoard slug={(await params).slug} />;
}
