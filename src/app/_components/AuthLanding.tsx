import { AuthForm, type AuthMode } from "@/app/_components/AuthForm";
import { CATEGORY_META, type ExpenseCategory } from "@/lib/expenses";
import { APP_NAME } from "@/lib/site";

const HIGHLIGHTS = ["一句話完成記帳", "AI 自動分類", "全家同步查看"];

const FEATURES = [
  {
    emoji: "💬",
    title: "說一句話就記好帳",
    body: "「午餐拉麵 280，搭計程車 150」— AI 自動拆成兩筆、判斷日期與分類，不用再一格一格填。",
    tint: "bg-indigo-50",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "全家共用一本帳",
    body: "家人各自登入記帳，所有花費集中在同一本，每一筆都清楚標示是誰記的。",
    tint: "bg-rose-50",
  },
  {
    emoji: "📊",
    title: "每月、每年一目了然",
    body: "依分類統計本月花費，年度圖表看出哪個月花最多，家庭預算心裡有數。",
    tint: "bg-cyan-50",
  },
];

export function AuthLanding({ mode }: { mode: AuthMode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* 背景光暈 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute top-[38rem] -left-40 h-[24rem] w-[24rem] rounded-full bg-rose-200/30 blur-3xl" />
      </div>

      {/* 頂部列 */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-bold tracking-tight text-slate-900">{APP_NAME}</span>
        </div>
        <a
          href="#auth"
          className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card ring-1 ring-slate-900/5 transition hover:text-slate-900 sm:block"
        >
          {mode === "login" ? "登入" : "註冊"}
        </a>
      </header>

      {/* 主視覺 */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-10 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pt-16 lg:pb-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-600 shadow-card ring-1 ring-indigo-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            AI 智慧記帳 · 家人共享
          </span>

          <h1 className="mt-6 text-[40px] leading-[1.15] font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[56px]">
            一句話記帳，
            <br />
            <span className="bg-brand bg-clip-text text-transparent">全家花費一目了然</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {APP_NAME}讓記帳像傳訊息一樣簡單。說出你花了什麼，AI 幫你拆帳、分類、記日期，家人隨時都能一起看。
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] text-emerald-600">
                  ✓
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <AuthForm mode={mode} />
      </section>

      {/* 產品預覽 + 特色 */}
      <section className="relative border-t border-slate-200/70 bg-white/60 backdrop-blur-sm">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <PhonePreview />

          <div>
            <p className="text-sm font-semibold tracking-wide text-indigo-600">為家庭設計的記帳方式</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              記帳不再是一件苦差事
            </h2>
            <ul className="mt-8 flex flex-col gap-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="card flex gap-4 rounded-3xl p-5">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${f.tint}`}
                  >
                    {f.emoji}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/70 bg-white/60 py-8 text-center text-xs text-slate-400">
        © {APP_NAME} · 用 AI 照顧家裡的每一筆花費
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <span className="bg-brand flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-brand">
      🪙
    </span>
  );
}

// 示意用的範例資料（不是真實紀錄）
const PREVIEW_ITEMS: { description: string; category: ExpenseCategory; who: string; color: string; amount: string }[] = [
  { description: "午餐拉麵", category: "餐飲", who: "Pamela", color: "#ec4899", amount: "-$280" },
  { description: "計程車回家", category: "交通", who: "爸爸", color: "#6366f1", amount: "-$150" },
  { description: "全聯採買", category: "購物", who: "Pamela", color: "#ec4899", amount: "-$860" },
];

function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]" aria-label="App 畫面示意">
      {/* AI 對話泡泡 */}
      <div className="card absolute top-2 -left-8 z-10 hidden w-56 rounded-2xl rounded-bl-md p-3 shadow-float sm:block lg:-left-24">
        <p className="text-[11px] font-semibold text-indigo-600">✨ 你說</p>
        <p className="mt-1 text-sm text-slate-700">午餐拉麵 280，搭計程車 150</p>
      </div>
      <div className="card absolute -right-6 -bottom-6 z-10 hidden rounded-2xl rounded-tr-md p-3 shadow-float sm:block lg:-right-20">
        <p className="text-[11px] font-semibold text-emerald-600">✓ AI 已分類</p>
        <div className="mt-1.5 flex gap-1.5">
          {(["餐飲", "交通"] as const).map((c) => (
            <span
              key={c}
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${CATEGORY_META[c].color}1a`, color: CATEGORY_META[c].color }}
            >
              {CATEGORY_META[c].emoji} {c}
            </span>
          ))}
        </div>
      </div>

      {/* 手機外框 */}
      <div className="rounded-[44px] bg-slate-900 p-2.5 shadow-[0_40px_80px_-30px_rgb(15_23_42/0.45)]">
        <div className="overflow-hidden rounded-[36px] bg-[#f5f7fb]">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-slate-900" />
          <div className="px-4 pt-4 pb-6">
            <p className="text-[10px] text-slate-500">嗨，Pamela 👋</p>
            <p className="text-lg font-bold text-slate-900">2026 年 10 月</p>

            <div className="bg-brand relative mt-3 overflow-hidden rounded-2xl p-4 text-white shadow-brand">
              <span aria-hidden className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-white/15" />
              <p className="relative text-[10px] text-white/85">10 月總支出</p>
              <p className="relative mt-1 text-2xl font-bold tabular-nums">$28,450</p>
              <div className="relative mt-3 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                <span className="bg-orange-400" style={{ flexGrow: 4 }} />
                <span className="bg-teal-400" style={{ flexGrow: 3 }} />
                <span className="bg-pink-400" style={{ flexGrow: 2 }} />
                <span className="bg-blue-300" style={{ flexGrow: 1 }} />
              </div>
            </div>

            <div className="mt-3 flex gap-1.5">
              {["四", "五", "六", "日", "一"].map((d, i) => (
                <span
                  key={d}
                  className={`flex flex-1 flex-col items-center rounded-xl py-1.5 text-[9px] ${
                    i === 3 ? "bg-brand text-white" : "card text-slate-500"
                  }`}
                >
                  {d}
                  <b className={`text-xs ${i === 3 ? "text-white" : "text-slate-800"}`}>{8 + i}</b>
                </span>
              ))}
            </div>

            <ul className="card mt-3 divide-y divide-slate-100 rounded-2xl">
              {PREVIEW_ITEMS.map((item) => (
                <li key={item.description} className="flex items-center gap-2.5 px-3 py-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-sm"
                    style={{ backgroundColor: `${CATEGORY_META[item.category].color}17` }}
                  >
                    {CATEGORY_META[item.category].emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-900">{item.description}</p>
                    <p className="flex items-center gap-1 text-[9px] text-slate-400">
                      {item.category} ·
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.who}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 tabular-nums">{item.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
