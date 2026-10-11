import type { ExpenseCategory, ExpenseItem } from "@/lib/expenses";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { ExpenseModel } from "@/models/Expense";
import { UserModel } from "@/models/User";

// 消費日期以 YYYY-MM-DD 存成 UTC 午夜，所以用 UTC 邊界查詢
function parseRange(params: URLSearchParams): [Date, Date] | null {
  const month = params.get("month")?.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]) - 1;
    if (m < 0 || m > 11) return null;
    return [new Date(Date.UTC(y, m, 1)), new Date(Date.UTC(y, m + 1, 1))];
  }
  const year = params.get("year")?.match(/^\d{4}$/);
  if (year) {
    const y = Number(year[0]);
    return [new Date(Date.UTC(y, 0, 1)), new Date(Date.UTC(y + 1, 0, 1))];
  }
  return null;
}

// GET /api/expenses?month=YYYY-MM 或 ?year=YYYY：取得該期間所有消費
export async function GET(request: Request) {
  const range = parseRange(new URL(request.url).searchParams);
  if (!range) {
    return Response.json(
      { error: "請提供 month=YYYY-MM 或 year=YYYY 參數" },
      { status: 400 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

    // 共同記帳本：登入的成員都能看到所有人的記帳
    await connectDB();
    const docs = await ExpenseModel.find({ date: { $gte: range[0], $lt: range[1] } })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // 一次查出這些記帳的成員名稱（只取 name，不外流 email 等欄位）
    const userIds = [...new Set(docs.map((d) => String(d.userId)))];
    const users = await UserModel.find({ _id: { $in: userIds } }, { name: 1 }).lean();
    const nameById = new Map(users.map((u) => [String(u._id), u.name]));

    const expenses: ExpenseItem[] = docs.map((doc) => {
      const recorderId = String(doc.userId);
      return {
        id: String(doc._id),
        description: doc.description,
        amount: doc.amount,
        currency: doc.currency,
        category: doc.category as ExpenseCategory,
        date: doc.date.toISOString().slice(0, 10),
        recordedBy: { id: recorderId, name: nameById.get(recorderId) ?? "已刪除的成員" },
      };
    });

    return Response.json({ expenses });
  } catch (err) {
    console.error("[api/expenses]", err);
    const message = err instanceof Error ? err.message : "未知錯誤";
    return Response.json({ error: message }, { status: 500 });
  }
}
