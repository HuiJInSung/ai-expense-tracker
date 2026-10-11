import {
  CATEGORY_META,
  formatAmount,
  type CategoryTotal,
  type ExpenseCategory,
} from "@/lib/expenses";

export function StatTiles({ tiles }: { tiles: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map(({ label, value }, i) => (
        <div
          key={label}
          className={`rounded-2xl px-3.5 py-3.5 ${i === 0 ? "bg-brand text-white shadow-brand" : "card"}`}
        >
          <p className={`text-xs ${i === 0 ? "text-white/80" : "text-slate-400"}`}>{label}</p>
          <p
            className={`mt-1.5 truncate text-[17px] font-bold tabular-nums ${
              i === 0 ? "" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

type BreakdownProps = {
  total: number;
  categoryTotals: CategoryTotal[];
  foreignCount: number;
  emptyText: string;
};

export function CategoryBreakdown({ total, categoryTotals, foreignCount, emptyText }: BreakdownProps) {
  return (
    <section className="card rounded-3xl p-5">
      <h2 className="font-semibold text-slate-900">各項花費</h2>
      {categoryTotals.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-xl">
            📊
          </span>
          <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
        </div>
      ) : (
        <>
          <CategoryBar totals={categoryTotals} total={total} className="mt-4 h-2.5 bg-slate-100" />
          <ul className="mt-5 flex flex-col gap-4">
            {categoryTotals.map(({ category, amount, count }) => {
              const pct = total ? (amount / total) * 100 : 0;
              return (
                <li key={category} className="flex items-center gap-3">
                  <CategoryIcon category={category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {category}
                        <span className="ml-2 text-xs font-normal text-slate-400">{count} 筆</span>
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatAmount(amount)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: CATEGORY_META[category].color }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-medium text-slate-400 tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {foreignCount > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          * 統計僅含新台幣，另有 {foreignCount} 筆外幣消費未計入
        </p>
      )}
    </section>
  );
}

type MonthlyChartProps = {
  /** 12 個月的新台幣合計 */
  totals: number[];
  /** 1-12，目前選取的月份 */
  activeMonth: number;
  onSelectMonth: (month: number) => void;
};

export function MonthlyChart({ totals, activeMonth, onSelectMonth }: MonthlyChartProps) {
  const max = Math.max(...totals);
  return (
    <section className="card rounded-3xl p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-slate-900">每月支出</h2>
        <span className="text-xs text-slate-400">點選月份查看統計</span>
      </div>
      <div className="mt-5 flex h-44 items-end gap-1.5">
        {totals.map((amount, i) => {
          const month = i + 1;
          const active = month === activeMonth;
          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(month)}
              aria-label={`${month} 月 ${formatAmount(amount)}`}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span
                className={`text-[10px] font-semibold text-indigo-600 tabular-nums ${
                  active ? "" : "invisible"
                }`}
              >
                {formatCompact(amount)}
              </span>
              <span
                className={`w-full rounded-lg transition-all group-active:scale-95 ${
                  active ? "bg-brand shadow-brand" : "bg-indigo-100 group-hover:bg-indigo-200"
                }`}
                style={{ height: max ? `max(${(amount / max) * 100}%, 4px)` : "4px" }}
              />
              <span
                className={`text-[10px] ${active ? "font-bold text-indigo-600" : "text-slate-400"}`}
              >
                {month}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatCompact(amount: number) {
  return amount >= 10000 ? `${(amount / 10000).toFixed(1)}萬` : amount.toLocaleString("zh-TW");
}

export function CategoryBar({
  totals,
  total,
  className = "",
}: {
  totals: CategoryTotal[];
  total: number;
  className?: string;
}) {
  return (
    <div className={`flex gap-0.5 overflow-hidden rounded-full ${className}`}>
      {totals.map(({ category, amount }) => (
        <div
          key={category}
          style={{
            flexGrow: total ? amount / total : 0,
            backgroundColor: CATEGORY_META[category].color,
          }}
          title={category}
        />
      ))}
    </div>
  );
}

export function CategoryIcon({ category }: { category: ExpenseCategory }) {
  const { emoji, color } = CATEGORY_META[category];
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
      style={{ backgroundColor: `${color}17` }}
    >
      {emoji}
    </span>
  );
}
