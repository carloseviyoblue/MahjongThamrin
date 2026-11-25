import type { Metadata } from "next";
import TableApp from "./TableApp";

export const metadata: Metadata = { title: "Meja" };

export default async function PlayerTablePage({ params }: PageProps<"/m/[secret]">) {
  const { secret } = await params;
  return <TableApp secret={secret} />;
}
