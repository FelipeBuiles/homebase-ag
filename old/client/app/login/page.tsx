import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { getAppConfig } from "@/lib/settings";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const config = await getAppConfig();
  if (!config?.setupComplete) {
    redirect("/setup");
  }

  if (!config.passwordHash) {
    redirect("/");
  }

  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
