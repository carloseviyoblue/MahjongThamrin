import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { ensureSeed, getCurrentUser } from "@/lib/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk Host" };

export default async function LoginPage() {
  await ensureSeed();
  if (await getCurrentUser()) redirect("/host");
  return <AuthForm mode="login" />;
}
