"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/hisgo/Header";
import { Footer } from "@/components/hisgo/Footer";
import { PublicAuthService } from "@/services/auth/public-auth.service";

// Khớp AuthUtilsService.validatePassword phía backend: ≥ 8 ký tự, có hoa, thường, số và
// một ký tự đặc biệt trong tập !@#$%^&*(),.?":{}|<>
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const INPUT_CLASS =
  "h-11 w-full rounded-lg border border-[#d7c5a1] bg-white px-3.5 text-sm text-[#302622] outline-none placeholder:text-[#9a8d7e] focus:ring-2 focus:ring-[#6e181b]/30";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/chuong-trinh-hoc";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!PASSWORD_RULE.test(password)) {
      setError("Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    setError(null);

    const created = await PublicAuthService.register({ username: username.trim(), email: email.trim(), password });
    if (!created.success) {
      setLoading(false);
      setError(created.message || "Không thể tạo tài khoản.");
      return;
    }

    // Không bắt xác minh email trước khi học: đăng nhập luôn sau khi tạo tài khoản.
    const loggedIn = await PublicAuthService.login(email.trim(), password);
    setLoading(false);
    if (!loggedIn.success) {
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }
    router.push(redirectTo);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_5%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(135deg,#f6f0e4_0%,#ece4d3_100%)]">
      <Header activeTab="account" />

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 md:py-20">
        <div className="rounded-2xl border border-[#d7c5a1] bg-[rgba(250,246,238,0.92)] p-8 shadow-[0_20px_60px_rgba(80,47,17,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a1d1f]">HISGO</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[#172b46]">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-[#504640]">
            Đăng ký miễn phí để theo học các lộ trình và lưu tiến độ của bạn.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-[#302622]">
                Tên hiển thị
              </label>
              <input
                id="username"
                required
                minLength={3}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: nguyenvana"
                className={INPUT_CLASS}
              />
            </div>
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
                className={INPUT_CLASS}
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-[11px] text-[#776b61]">
                ≥ 8 ký tự, có chữ hoa, chữ thường, số và một ký tự đặc biệt như ! @ # $ % &amp; *
              </p>
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-[#302622]">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={INPUT_CLASS}
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
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#776b61]">
            Đã có tài khoản?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-semibold text-[#6e181b] hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
