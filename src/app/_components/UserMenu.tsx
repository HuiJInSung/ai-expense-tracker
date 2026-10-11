"use client";

import { useState } from "react";

type Props = { user: { name: string; email: string } };

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // 整頁跳轉，確保所有使用者資料都從畫面清掉
      window.location.replace("/login");
    }
  }

  return (
    <div className="relative ml-0.5">
      <button
        type="button"
        aria-label="帳號選單"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="bg-brand flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-brand ring-2 ring-white transition active:scale-90"
      >
        {user.name.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="關閉選單"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="card animate-fade-in absolute top-12 right-0 z-50 w-60 rounded-2xl p-2 shadow-float">
            <div className="flex items-center gap-3 px-2.5 py-2">
              <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="my-1.5 h-px bg-slate-100" />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              {loggingOut ? "登出中…" : "登出"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
