"use client";

import { useState } from "react";

type AnalyzedItem = { date: string };

const EXAMPLES = ["午餐拉麵 280", "搭計程車 150", "昨天看電影 320"];

type Props = {
  onClose: () => void;
  onAdded: (items: AnalyzedItem[]) => void;
};

export function AddSheet({ onClose, onAdded }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析失敗");
      const items: AnalyzedItem[] = data.analysis.items;
      if (items.length === 0) {
        setError("沒有找到消費紀錄，試著寫上品項和金額");
        return;
      }
      onAdded(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="關閉"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
      />
      <form
        onSubmit={handleSubmit}
        className="animate-slide-up relative w-full max-w-md rounded-t-[32px] bg-white px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-float"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-start gap-3">
          <span className="bg-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-brand">
            ✨
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">新增記帳</h2>
            <p className="text-sm text-slate-500">用一句話描述，AI 會拆成多筆並自動分類</p>
          </div>
        </div>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：今天午餐吃拉麵 280 元，搭計程車 150"
          rows={3}
          className="mt-5 w-full resize-none rounded-2xl bg-slate-50 p-4 text-slate-900 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-400"
        />

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText((t) => (t ? `${t}，${ex}` : ex))}
              className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition active:scale-95"
            >
              + {ex}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 ring-1 ring-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-brand mt-5 w-full rounded-2xl py-4 font-semibold text-white shadow-brand transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "AI 分析中…" : "分析並儲存"}
        </button>
      </form>
    </div>
  );
}
