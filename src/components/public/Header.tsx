import Link from "next/link";
import Image from "next/image";
import { Home, BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-app/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl text-card flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 overflow-hidden">
            <Image
              src="/logo-pmk.avif"
              alt="PMK ARK"
              width={24}
              height={24}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div>
            <span className="font-serif font-bold text-xl text-primary tracking-tight">PMK ARK</span>
            <span className="block text-[10px] font-sans font-medium uppercase tracking-widest text-muted">
              Archive & Resource Knowledge
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <Home className="w-4 h-4 text-muted" /> Beranda
          </Link>
          <Link
            href="/arsip"
            className="text-sm font-medium text-primary hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-muted" /> Arsip Pelayanan
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-card mt-auto border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-1 mb-4">
              <Image
                src="/logo-pmk.avif"
                alt="PMK ARK"
                width={32}
                height={32}
                className="w-9 h-9 rounded-lg object-contain p-1"
                unoptimized
              />
              <span className="font-serif font-bold text-lg">PMK ARK</span>
            </div>
            <p className="text-sm text-card/70 leading-relaxed">
              Repositori dokumen pelayanan mingguan Persatuan Mahasiswa Kristen Institut Teknologi Sumatera (PMK ITERA). Satu sumber kebenaran untuk PPT Ibadah, Warta, dan Khotbah.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-card/90 mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-sm text-card/70">
              <li>
                <Link href="/" className="hover:text-card transition-colors">Beranda</Link>
              </li>
              <li>
                <Link href="/arsip" className="hover:text-card transition-colors">Cari Arsip Pelayanan</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm uppercase tracking-wider text-card/90 mb-4">Tentang PMK ITERA</h4>
            <p className="text-sm text-card/70 leading-relaxed">
              Keluarga mahasiswa Kristen di Kampus ITERA Lampung Selatan yang berkomitmen untuk bertumbuh dalam iman dan melayani sesama.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-card/10 flex flex-col sm:flex-row items-center justify-between text-xs text-card/50">
          <p>© {new Date().getFullYear()} PMK ARK — PMK ITERA. Dibuat untuk kemuliaan nama Tuhan.</p>
          <p className="mt-2 sm:mt-0">Stabil jangka panjang & mudah diwariskan.</p>
        </div>
      </div>
    </footer>
  );
}
