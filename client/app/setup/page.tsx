import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";
import { getAppConfig } from "@/lib/settings";

export default async function SetupPage() {
  const config = await getAppConfig();
  if (config?.setupComplete) {
    redirect("/");
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-10 md:flex-row">
        <div className="max-w-md space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Setup</p>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold leading-tight">
            Let&apos;s get your home organized.
          </h1>
          <p className="text-muted-foreground text-lg">
            This quick setup creates your local admin space. Passwords are optional and
            keep your instance private.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
