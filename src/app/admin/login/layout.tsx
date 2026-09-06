// Login route tidak menggunakan AdminLayout (supaya tidak kena proteksi auto-redirect).
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
