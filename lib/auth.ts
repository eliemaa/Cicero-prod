import "server-only";
import { auth } from "@clerk/nextjs/server";
import { ClientError } from "./validation";
export function authConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_ADMIN_USER_ID,
  );
}
export async function requireAdmin() {
  if (!authConfigured())
    throw new ClientError("Administrator sign-in has not been configured.");
  const { userId } = await auth();
  if (!userId || userId !== process.env.CLERK_ADMIN_USER_ID)
    throw new ClientError("You do not have access to this dashboard.");
  return userId;
}
