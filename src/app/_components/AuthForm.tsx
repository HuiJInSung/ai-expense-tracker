"use client";

import Link from "next/link";
import { useState } from "react";

export type AuthMode = "login" | "register";

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string; loading: string }> = {
  login: {
    title: "歡迎回來",
    subtitle: "登入查看全家人的最新花費",
    submit: "登入",
    loading: "登入中…",
  },
  register: {
    title: "加入家庭記帳本",
    subtitle: "輸入家人給你的驗證碼即可加入",
    submit: "建立帳號",
    loading: "建立中…",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const copy = COPY[mode];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `${copy.submit}失敗`);
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : `${copy.submit}失敗`);
      setLoading(false);
    }
  }

  return (
    <div id="auth" className="card scroll-mt-6 rounded-[28px] p-6 shadow-float sm:p-8">
      {/* 登入 / 註冊切換 */}
      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
        {(["login", "register"] as const).map((m) => (
          <Link
            key={m}
            href={m === "login" ? "/login" : "/register"}
            replace
            scroll={false}
            className={`rounded-xl py-2 text-center transition ${
              m === mode ? "card text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {m === "login" ? "登入" : "註冊"}
          </Link>
        ))}
      </div>

      <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{copy.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "register" && (
          <Field label="名稱" name="name" autoComplete="name" placeholder="家人怎麼稱呼你" maxLength={50} />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
        <Field
          label="密碼"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? "至少 8 個字元" : "輸入密碼"}
          minLength={mode === "register" ? 8 : undefined}
        />
        {mode === "register" && (
          <Field
            label="驗證碼"
            name="inviteCode"
            autoComplete="off"
            autoCapitalize="none"
            placeholder="向家人索取"
          />
        )}

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600 ring-1 ring-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand mt-1 rounded-2xl py-4 font-semibold text-white shadow-brand transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? copy.loading : copy.submit}
        </button>
      </form>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      <input
        required
        {...props}
        className="rounded-2xl bg-slate-50 px-4 py-3.5 text-slate-900 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}
