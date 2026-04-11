import { createSafeActionClient, createMiddleware } from "next-safe-action";
import { getSession } from "@/lib/auth/session";

/**
 * Auth middleware — verifies session before allowing any action.
 * Throws "Unauthorized" if the user is not logged in.
 */
const authMiddleware = createMiddleware().define(async ({ next }) => {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }
  return next({ ctx: { session } });
});

/**
 * Authenticated action client — all data-modifying actions should use this.
 */
export const action = createSafeActionClient().use(authMiddleware);

/**
 * Public action client — used only for auth actions (login, setup)
 * that must be callable without an existing session.
 */
export const publicAction = createSafeActionClient();
