import { connectDB } from "@/lib/mongodb";
import { analyzeExpenseText } from "@/lib/openai";
import { getCurrentUser } from "@/lib/session";
import { ExpenseModel } from "@/models/Expense";

export async function POST(request: Request) {
  // 先確認登入，未登入就不呼叫 OpenAI
  let user;
  try {
    user = await getCurrentUser();
  } catch (err) {
    console.error("[api/expenses/analyze]", err);
    return Response.json({ error: "讀取登入狀態失敗" }, { status: 500 });
  }
  if (!user) return Response.json({ error: "請先登入" }, { status: 401 });

  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "請求內容必須是 JSON" }, { status: 400 });
  }

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "請提供 text 欄位" }, { status: 400 });
  }

  try {
    const analysis = await analyzeExpenseText(text.trim());

    await connectDB();
    const expenses = await ExpenseModel.insertMany(
      analysis.items.map((item) => ({
        ...item,
        userId: user.id,
        date: new Date(item.date),
        rawText: text,
      }))
    );

    return Response.json({ analysis, expenses });
  } catch (err) {
    console.error("[api/expenses/analyze]", err);
    const message = err instanceof Error ? err.message : "未知錯誤";
    return Response.json({ error: message }, { status: 500 });
  }
}
