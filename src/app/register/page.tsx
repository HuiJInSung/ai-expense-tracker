import type { Metadata } from "next";
import { AuthLanding } from "@/app/_components/AuthLanding";
import { APP_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `註冊 · ${APP_NAME}` };

export default function RegisterPage() {
  return <AuthLanding mode="register" />;
}
