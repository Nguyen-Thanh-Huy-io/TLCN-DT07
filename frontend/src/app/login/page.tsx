"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { PublicAuthService } from "@/services/auth/public-auth.service";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const result = await PublicAuthService.login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)]">
      <Header activeTab="account" />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-[#d7c5a1] bg-[rgba(250,246,238,0.92)] p-8 shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a1d1f]">HISGO</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#172b46]">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-[#504640]">
            Đăng nhập để tiếp tục hành trình khám phá lịch sử Việt Nam.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#302622]">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                className="h-11 w-full rounded-lg border border-[#d7c5a1] bg-white px-3.5 text-sm text-[#302622] outline-none placeholder:text-[#9a8d7e] focus:ring-2 focus:ring-[#6e181b]/30"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#302622]">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-[#d7c5a1] bg-white px-3.5 text-sm text-[#302622] outline-none placeholder:text-[#9a8d7e] focus:ring-2 focus:ring-[#6e181b]/30"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-[#6e181b] text-sm font-semibold text-white transition hover:bg-[#501013] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#776b61]">
            <Link href="/" className="font-semibold text-[#6e181b] hover:underline">
              ← Quay về trang chủ
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
