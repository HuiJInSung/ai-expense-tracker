"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AddSheet } from "@/app/_components/AddSheet";
import { UserMenu } from "@/app/_components/UserMenu";
import { DateStrip } from "@/app/_components/DateStrip";
import {
  CategoryBar,
  CategoryBreakdown,
  CategoryIcon,
  MonthlyChart,
  StatTiles,
} from "@/app/_components/Stats";
import { formatAmount, summarize, type ExpenseItem } from "@/lib/expenses";

type Tab = "list" | "stats";
type StatsPeriod = "month" | "year";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function localToday() {
  return new Date().toLocaleDateString("sv-SE");
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * 依查詢字串讀取消費；query 為 null 時不讀取。
 * 同一個查詢重新整理（reloadKey 變動）時保留舊資料，避免畫面閃爍。
 */
function useExpenses(query: string | null, reloadKey: number) {
  const key = query && `${query}#${reloadKey}`;
  const [result, setResult] = useState<{
    key: string;
    expenses: ExpenseItem[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/expenses?${query}`, { signal: controller.signal })
      .then(async (res) => {
        // session 過期或被登出時回到登入頁
        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "讀取失敗");
        setResult({ key, expenses: data.expenses, error: null });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResult({ key, expenses: [], error: err instanceof Error ? err.message : "讀取失敗" });
      });
    return () => controller.abort();
  }, [key, query]);

  const loading = !!key && result?.key !== key;
  const sameQuery = !!result && result.key.startsWith(`${query}#`);
  return {
    loading,
    expenses: sameQuery ? result.expenses : [],
    error: !loading && result ? result.error : null,
  };
}

const noopSubscribe = () => () => {};

export type SessionUser = { id: string; name: string; email: string };

export function ExpenseHome({ user }: { user: SessionUser }) {
  // 「今天」要用使用者裝置的時區，所以只在瀏覽器端讀取；預渲染時先顯示骨架
  const today = useSyncExternalStore(noopSubscribe, localToday, () => null);
  if (!today) return <AppSkeleton />;
  return <ExpenseApp today={today} user={user} />;
}

export function AppSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 animate-pulse flex-col gap-6 px-5 pt-6">
      <div className="space-y-2">
        <div className="h-3 w-20 rounded-full bg-slate-200/70" />
        <div className="h-7 w-40 rounded-full bg-slate-200/70" />
      </div>
      <div className="h-44 rounded-[28px] bg-slate-200/70" />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[72px] w-12 shrink-0 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-40 rounded-3xl bg-slate-200/70" />
    </div>
  );
}

function ExpenseApp({ today, user }: { today: string; user: SessionUser }) {
  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);
  const [month, setMonth] = useState(thisMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>("list");
  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const year = month.slice(0, 4);
  const showingYear = tab === "stats" && period === "year";

  const monthData = useExpenses(`month=${month}`, reloadKey);
  // 年度資料只在看年度統計時才讀取
  const yearData = useExpenses(showingYear ? `year=${year}` : null, reloadKey);
  const error = showingYear ? yearData.error : monthData.error;

  function goToMonth(next: string, date?: string) {
    setMonth(next);
    setSelectedDate(date ?? (next === thisMonth ? today : `${next}-01`));
  }

  // 頂部箭頭：看年度時一次跳一年，其他時候一次跳一個月
  function shift(delta: number) {
    goToMonth(shiftMonth(month, showingYear ? delta * 12 : delta));
  }

  function handleAdded(items: { date: string }[]) {
    setSheetOpen(false);
    setTab("list");
    goToMonth(items[0].date.slice(0, 7), items[0].date);
    setReloadKey((k) => k + 1);
    setToast(`已新增 ${items.length} 筆記帳`);
    setTimeout(() => setToast(null), 2500);
  }

  const monthStats = useMemo(() => {
    const summary = summarize(monthData.expenses);
    // 日均：本月以今天為止的天數計算，過去月份以整月計算
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const elapsedDays =
      month === thisMonth ? Number(today.slice(8, 10)) : month < thisMonth ? daysInMonth : 1;
    return {
      ...summary,
      dailyAverage: summary.total / elapsedDays,
      markedDates: new Set(monthData.expenses.map((e) => e.date)),
    };
  }, [monthData.expenses, month, thisMonth, today]);

  const yearStats = useMemo(() => {
    const summary = summarize(yearData.expenses);
    const monthlyTotals = Array.from({ length: 12 }, () => 0);
    for (const e of yearData.expenses) {
      if (e.currency === "TWD") monthlyTotals[Number(e.date.slice(5, 7)) - 1] += e.amount;
    }
    // 月均：今年以目前月份數計算，過去年份以 12 個月計算
    const elapsedMonths =
      year === thisYear ? Number(today.slice(5, 7)) : year < thisYear ? 12 : 1;
    const peak = Math.max(...monthlyTotals);
    return {
      ...summary,
      monthlyTotals,
      monthlyAverage: summary.total / elapsedMonths,
      peakMonth: peak > 0 ? monthlyTotals.indexOf(peak) + 1 : null,
    };
  }, [yearData.expenses, year, thisYear, today]);

  const dayItems = monthData.expenses.filter((e) => e.date === selectedDate);
  const dayTotal = dayItems.filter((e) => e.currency === "TWD").reduce((s, e) => s + e.amount, 0);
  const monthNum = Number(month.slice(5, 7));
  const selected = new Date(`${selectedDate}T00:00:00`);
  const isCurrentPeriod = showingYear ? year === thisYear : month === thisMonth;


  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-32">
      {/* 頂部列 */}
      <header className="sticky top-0 z-30 bg-background/85 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-slate-500">嗨，{user.name} 👋</p>
            <h1 className="mt-0.5 text-[26px] leading-tight font-bold tracking-tight text-slate-900">
              {showingYear ? `${year} 年` : `${year} 年 ${monthNum} 月`}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <IconButton label={showingYear ? "上一年" : "上個月"} onClick={() => shift(-1)}>
              <path d="M15 18l-6-6 6-6" />
            </IconButton>
            {!isCurrentPeriod && (
              <button
                type="button"
                onClick={() => goToMonth(thisMonth)}
                className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 transition active:scale-95"
              >
                {showingYear ? "今年" : "本月"}
              </button>
            )}
            <IconButton label={showingYear ? "下一年" : "下個月"} onClick={() => shift(1)}>
              <path d="M9 18l6-6-6-6" />
            </IconButton>
            <UserMenu user={user} />
          </div>
        </div>

        {tab === "stats" && (
          <div className="mt-4 grid grid-cols-2 rounded-2xl bg-slate-200/60 p-1">
            {(["month", "year"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-xl py-2 text-sm font-semibold transition ${
                  period === p ? "card text-slate-900" : "text-slate-500"
                }`}
              >
                {p === "month" ? "月統計" : "年統計"}
              </button>
            ))}
          </div>
        )}
      </header>

      {error && (
        <p className="mx-5 mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-100">
          {error}
        </p>
      )}

      {tab === "list" && (
        <div className="flex flex-col gap-6 pt-2">
          {/* 本月總覽卡片 */}
          <button
            type="button"
            onClick={() => {
              setPeriod("month");
              setTab("stats");
            }}
            className="bg-brand relative mx-5 overflow-hidden rounded-[28px] p-6 text-left text-white shadow-brand transition active:scale-[0.99]"
          >
            <span aria-hidden className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-white/15" />
            <span aria-hidden className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/85">{monthNum} 月總支出</span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  查看統計 →
                </span>
              </div>
              <p className="mt-2 text-[36px] leading-none font-bold tracking-tight tabular-nums">
                {monthData.loading ? "—" : formatAmount(monthStats.total)}
              </p>
              <CategoryBar
                totals={monthStats.categoryTotals}
                total={monthStats.total}
                className="mt-5 h-1.5 bg-white/25"
              />
              <div className="mt-4 flex gap-6 text-xs text-white/80">
                <span>
                  共 <b className="text-sm font-semibold text-white">{monthStats.count}</b> 筆
                </span>
                <span>
                  日均{" "}
                  <b className="text-sm font-semibold text-white tabular-nums">
                    {formatAmount(Math.round(monthStats.dailyAverage))}
                  </b>
                </span>
              </div>
            </div>
          </button>

          <DateStrip
            month={month}
            selectedDate={selectedDate}
            today={today}
            markedDates={monthStats.markedDates}
            onSelect={setSelectedDate}
          />

          {/* 當日明細 */}
          <section className="px-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {selected.getMonth() + 1} 月 {selected.getDate()} 日 週{WEEKDAYS[selected.getDay()]}
                {selectedDate === today && (
                  <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                    今天
                  </span>
                )}
              </h2>
              {dayItems.length > 0 && (
                <span className="text-sm font-medium text-slate-500 tabular-nums">
                  合計 <span className="text-slate-900">{formatAmount(dayTotal)}</span>
                </span>
              )}
            </div>

            {monthData.loading && dayItems.length === 0 ? (
              <ListSkeleton />
            ) : dayItems.length === 0 ? (
              <div className="card mt-3 flex flex-col items-center rounded-3xl px-6 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  🧾
                </span>
                <p className="mt-3 font-medium text-slate-700">這天還沒有記帳</p>
                <p className="mt-1 text-sm text-slate-400">用一句話告訴 AI 你花了什麼</p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="mt-4 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition active:scale-95"
                >
                  + 新增一筆
                </button>
              </div>
            ) : (
              <ul className="card mt-3 divide-y divide-slate-100 overflow-hidden rounded-3xl">
                {dayItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <CategoryIcon category={item.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{item.description}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        {item.category}
                        <span aria-hidden>·</span>
                        <RecorderBadge recorder={item.recordedBy} currentUserId={user.id} />
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 tabular-nums">
                      -{formatAmount(item.amount, item.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "stats" && period === "month" && (
        <div className="flex flex-col gap-4 px-5 pt-1">
          <StatTiles
            tiles={[
              { label: `${monthNum} 月支出`, value: formatAmount(monthStats.total) },
              { label: "筆數", value: String(monthStats.count) },
              { label: "日均", value: formatAmount(Math.round(monthStats.dailyAverage)) },
            ]}
          />
          {monthData.loading && monthData.expenses.length === 0 ? (
            <ListSkeleton />
          ) : (
            <CategoryBreakdown
              total={monthStats.total}
              categoryTotals={monthStats.categoryTotals}
              foreignCount={monthStats.foreignCount}
              emptyText={`${monthNum} 月還沒有花費紀錄`}
            />
          )}
        </div>
      )}

      {showingYear && (
        <div className="flex flex-col gap-4 px-5 pt-1">
          <StatTiles
            tiles={[
              { label: `${year} 年支出`, value: formatAmount(yearStats.total) },
              { label: "月均", value: formatAmount(Math.round(yearStats.monthlyAverage)) },
              {
                label: "最高月份",
                value: yearStats.peakMonth ? `${yearStats.peakMonth} 月` : "—",
              },
            ]}
          />
          {yearData.loading && yearData.expenses.length === 0 ? (
            <ListSkeleton />
          ) : (
            <>
              <MonthlyChart
                totals={yearStats.monthlyTotals}
                activeMonth={monthNum}
                onSelectMonth={(m) => {
                  goToMonth(`${year}-${String(m).padStart(2, "0")}`);
                  setPeriod("month");
                }}
              />
              <CategoryBreakdown
                total={yearStats.total}
                categoryTotals={yearStats.categoryTotals}
                foreignCount={yearStats.foreignCount}
                emptyText={`${year} 年還沒有花費紀錄`}
              />
            </>
          )}
        </div>
      )}

      {/* 底部導覽列 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="card relative flex items-center justify-around rounded-[28px] py-2.5 shadow-float">
          <TabButton active={tab === "list"} label="明細" onClick={() => setTab("list")}>
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </TabButton>
          <button
            type="button"
            aria-label="新增記帳"
            onClick={() => setSheetOpen(true)}
            className="bg-brand -mt-9 flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-brand ring-[5px] ring-background transition active:scale-90"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <TabButton active={tab === "stats"} label="統計" onClick={() => setTab("stats")}>
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
          </TabButton>
        </div>
      </nav>

      {sheetOpen && <AddSheet onClose={() => setSheetOpen(false)} onAdded={handleAdded} />}

      {toast && (
        <div className="animate-fade-in fixed inset-x-0 top-5 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-float">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}

// 依成員 id 固定配一個顏色，方便一眼分辨是誰記的
const MEMBER_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#0ea5e9", "#84cc16"];

function memberColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}

function RecorderBadge({
  recorder,
  currentUserId,
}: {
  recorder: ExpenseItem["recordedBy"];
  currentUserId: string;
}) {
  const isMe = recorder.id === currentUserId;
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
        style={{ backgroundColor: memberColor(recorder.id) }}
      >
        {recorder.name.slice(0, 1).toUpperCase()}
      </span>
      <span className={`truncate ${isMe ? "font-medium text-slate-600" : ""}`}>
        {isMe ? "我" : recorder.name}
      </span>
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="card mt-3 flex flex-col gap-4 rounded-3xl p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
            <div className="h-2.5 w-1/4 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="card flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition active:scale-90"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function TabButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-20 flex-col items-center gap-1 py-0.5 text-[11px] font-semibold transition ${
        active ? "text-indigo-600" : "text-slate-400"
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 2} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      {label}
    </button>
  );
}
