import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";

export function RegisterPage() {
  const { registerWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("两次输入的密码不一致");
      setIsSubmitting(false);
      return;
    }

    try {
      await registerWithPassword({ email, password });
      navigate("/", { replace: true });
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "注册失败");
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/30">
        <h1 className="text-xl font-semibold text-white">注册</h1>
        <p className="mt-2 text-sm text-mist/70">创建账号后，每个用户拥有独立的作品与设定数据。</p>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-mist/70">
            邮箱
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-mist/70">
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="至少 8 位"
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-mist/70">
            确认密码
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-accent/40"
              placeholder="再次输入密码"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="mt-6 text-sm text-mist/70">
          已有账号？{" "}
          <Link to="/login" className="text-accent hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}

