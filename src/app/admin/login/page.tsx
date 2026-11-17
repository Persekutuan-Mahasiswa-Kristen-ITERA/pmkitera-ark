import { LoginForm } from "./login-form";
import { GOOGLE_LOGIN_MESSAGES, googleLoginError } from "@/lib/auth/google-login-messages";
import { ACCESS_MESSAGES, accessReason } from "@/lib/auth/access-messages";

/**
 * /admin/login. `?google=<code>`: coming back from a failed "Masuk dengan Google".
 * `?access=<reason>`: signed in to PI-CORE, but no ARK access (see services/auth-service.ts).
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string | string[]; access?: string | string[] }>;
}) {
  const { google, access } = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : null);
  const message = one(access)
    ? ACCESS_MESSAGES[accessReason(one(access))]
    : one(google)
      ? GOOGLE_LOGIN_MESSAGES[googleLoginError(one(google))]
      : undefined;
  return <LoginForm initialError={message} signOutFirst={Boolean(one(access))} />;
}
