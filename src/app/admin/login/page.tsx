"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Archive } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      router.push("/admin/documents");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
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
          <p className="text-sm text-muted mt-1">Masuk untuk mengelola arsip digital PMK ITERA</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label required>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pmkitera.org"
              required
            />
          </div>

          <div>
            <Label required>Kata Sandi</Label>
            <Input
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

        <div className="mt-8 text-center text-xs text-muted">
          <Link href="/" className="hover:text-accent underline">
            ← Kembali ke Website Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
