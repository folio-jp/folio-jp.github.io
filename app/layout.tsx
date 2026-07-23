import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Critical Thinking Trainer",
  description: "5ターンで鍛えるクリティカルシンキングMVP"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b border-gold/20 bg-black/50">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-wide text-gold">
              Critical Thinking Trainer
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link href="/dashboard" className="btn-secondary">
                ダッシュボード
              </Link>
              <Link href="/auth" className="btn-secondary">
                ログイン
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
