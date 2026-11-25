import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { getCurrentUser } from "@/lib/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftarkan Venue" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/host");
  return <AuthForm mode="register" />;
}
