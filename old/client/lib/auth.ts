import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "crypto";

const SESSION_COOKIE = "hb_session";

type SessionPayload = {
  userId: string;
  issuedAt: number;
};

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return secret || "dev-session-secret";
};

const signPayload = (payload: string) => {
  const secret = getSessionSecret();
  return createHmac("sha256", secret).update(payload).digest("hex");
};

const encodePayload = (payload: SessionPayload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodePayload = (encoded: string) => {
  const json = Buffer.from(encoded, "base64url").toString("utf-8");
  return JSON.parse(json) as SessionPayload;
};

export async function setSessionCookie(userId: string) {
  const payload = encodePayload({ userId, issuedAt: Date.now() });
  const signature = signPayload(payload);
  const value = `${payload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const isValid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isValid) return null;

  try {
    return decodePayload(payload);
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return {
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
  };
}

export async function verifyPassword(password: string, saltHex: string, hashHex: string) {
  const salt = Buffer.from(saltHex, "hex");
  const hash = scryptSync(password, salt, 64);
  const expected = Buffer.from(hashHex, "hex");
  return (
    hash.length === expected.length &&
    timingSafeEqual(hash, expected)
  );
}
