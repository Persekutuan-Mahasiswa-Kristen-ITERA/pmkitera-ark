"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  FolderKanban,
  CalendarDays,
  LogOut,
  Archive,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Halaman login tidak boleh dibungkus proteksi auth (mencegah loop redirect).
  const isLoginPage = pathname === "/admin/login";
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(!isLoginPage);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/admin/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setIsLoading(false));
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <span className="w-8 h-8 border-4 border-accent border-r-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  if (!user) return null;

  const navItems = [
    { label: "Kelola Dokumen", href: "/admin/documents", icon: FileText },
    { label: "Kategori", href: "/admin/categories", icon: FolderKanban },
    { label: "Periode Pelayanan", href: "/admin/service-periods", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen flex bg-app">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-card border-r border-line">
        <div className="p-6 border-b border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-primary text-base">PMK ARK</h1>
            <p className="text-xs text-muted">Panel Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-card"
                    : "text-muted hover:bg-app-alt hover:text-primary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line">
          {user ? (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
                {user?.name ? user.name.charAt(0) : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-primary truncate">{user?.name || "Admin"}</p>
                <p className="text-xs text-muted truncate capitalize flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-600" /> {user?.role || "admin"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted text-center py-2">Memuat...</div>
          )}
          <Button variant="outline" size="sm" className="w-full justify-start text-red-700 border-red-200 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-line">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-accent" />
            <span className="font-serif font-bold text-primary">PMK ARK Admin</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-muted hover:text-primary"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        {isMobileOpen && (
          <div className="md:hidden bg-card border-b border-line p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    pathname === item.href ? "bg-accent text-card" : "text-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                </Link>
              );
            })}
            <Button variant="outline" size="sm" className="w-full text-red-700 mt-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Keluar
            </Button>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
