import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { validateServerEnv } from "@/lib/env";

export interface SessionData {
  isLoggedIn: boolean;
}

function getSessionPassword(): string {
  validateServerEnv();
  const configured = process.env.SESSION_SECRET?.trim();

  if (!configured) {
    return "dev-mode-session-secret-key-32chars!";
  }

  if (configured.length >= 32) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be at least 32 characters long");
  }

  // Normalize short local dev secrets like "test" into a valid session key.
  return createHash("sha256").update(configured).digest("hex");
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "homebase_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
