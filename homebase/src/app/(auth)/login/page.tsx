import { redirect } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const auth = await getAuthState();

  if (auth.isLoggedIn) {
    redirect("/");
  }

  if (!auth.isPasswordSet) {
    redirect("/setup");
  }

  return <LoginForm />;
}
