"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPicoreBrowserClient } from "@/lib/picore/client";
import { PICORE_URL } from "@/lib/picore/config";
import { ACCESS_MESSAGES, accessReason } from "@/lib/auth/access-messages";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Archive } from "lucide-react";

// Same wording whether the email or the password is wrong (does not reveal which accounts exist).
const SAFE_LOGIN_ERROR = "Email atau kata sandi salah.";

/** Log in with a PI-CORE account (password here, or Google through PI-CORE). */
export function LoginForm({ initialError, signOutFirst }: { initialError?: string; signOutFirst?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isLoading, setIsLoading] = useState(false);

  // Signed in to PI-CORE but without ARK access: end that session here so the next try starts clean.
  useEffect(() => {
    if (signOutFirst) void fetch("/api/auth/logout", { method: "POST" });
  }, [signOutFirst]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const supabase = createPicoreBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(SAFE_LOGIN_ERROR);
        return;
      }
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        await supabase.auth.signOut({ scope: "local" });
        setError(ACCESS_MESSAGES[accessReason(me.access)]);
        return;
      }
      router.push("/admin/documents");
      router.refresh();
    } catch {
      setError("Gagal masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-sm border border-line p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-3">
            <Archive className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-primary">PMK ARK Admin</h1>
          <p className="text-sm text-muted mt-1">Masuk dengan akun PI-CORE Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email akun PI-CORE"
              required
            />
          </div>

          <div>
            <Label required htmlFor="login-password">Kata Sandi</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
            Masuk ke Dashboard
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          atau
          <span className="h-px flex-1 bg-line" />
        </div>
        <a
          href="/auth/google"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-card py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Masuk dengan Google
        </a>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Akun dan kata sandi dikelola di PI-CORE.{" "}
          <a href={PICORE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline">
            Lupa kata sandi atau belum punya akun?
          </a>
        </p>

        <div className="mt-8 text-center text-xs text-muted">
          <Link href="/" className="hover:text-accent underline">
            ← Kembali ke Website Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
