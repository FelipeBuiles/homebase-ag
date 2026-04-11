import { redirect } from "next/navigation";
import { getAuthState } from "@/actions/auth";
import { SetupForm } from "@/components/auth/setup-form";

export default async function SetupPage() {
  const auth = await getAuthState();

  if (auth.isLoggedIn) {
    redirect("/");
  }

  if (auth.isPasswordSet) {
    redirect("/login");
  }

  return <SetupForm />;
}
