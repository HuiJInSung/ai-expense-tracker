// 前後端共用的記帳型別與分類設定（不可引入 server-only 套件，client component 也會用到）

export const EXPENSE_CATEGORIES = [
  "餐飲",
  "交通",
  "購物",
  "娛樂",
  "居住",
  "醫療",
  "教育",
  "其他",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_META: Record<ExpenseCategory, { emoji: string; color: string }> = {
  餐飲: { emoji: "🍜", color: "#f97316" },
  交通: { emoji: "🚇", color: "#3b82f6" },
  購物: { emoji: "🛍️", color: "#ec4899" },
  娛樂: { emoji: "🎮", color: "#8b5cf6" },
  居住: { emoji: "🏠", color: "#14b8a6" },
  醫療: { emoji: "💊", color: "#ef4444" },
  教育: { emoji: "📚", color: "#eab308" },
  其他: { emoji: "📦", color: "#64748b" },
};

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  /** YYYY-MM-DD */
  date: string;
  /** 記下這筆帳的成員 */
  recordedBy: { id: string; name: string };
};

export type CategoryTotal = { category: ExpenseCategory; amount: number; count: number };

/** 彙總消費；金額只計新台幣，外幣筆數另外回傳 */
export function summarize(expenses: ExpenseItem[]) {
  const twd = expenses.filter((e) => e.currency === "TWD");
  const byCategory = new Map<ExpenseCategory, CategoryTotal>();
  for (const e of twd) {
    const entry = byCategory.get(e.category) ?? { category: e.category, amount: 0, count: 0 };
    entry.amount += e.amount;
    entry.count += 1;
    byCategory.set(e.category, entry);
  }
  return {
    total: twd.reduce((sum, e) => sum + e.amount, 0),
    count: expenses.length,
    categoryTotals: [...byCategory.values()].sort((a, b) => b.amount - a.amount),
    foreignCount: expenses.length - twd.length,
  };
}

export function formatAmount(amount: number, currency = "TWD") {
  const n = amount.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
  return currency === "TWD" ? `$${n}` : `${currency} ${n}`;
}
