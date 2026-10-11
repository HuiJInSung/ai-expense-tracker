import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";

export const ExpenseAnalysisSchema = z.object({
  items: z.array(
    z.object({
      description: z.string().describe("消費項目的簡短描述"),
      amount: z.number().describe("金額，正數"),
      currency: z.string().describe("ISO 4217 幣別代碼，未提及時用 TWD"),
      category: z.enum(EXPENSE_CATEGORIES),
      date: z
        .string()
        .describe("消費日期 YYYY-MM-DD，依今天日期推算「昨天」等相對說法"),
    })
  ),
});

export type ExpenseAnalysis = z.infer<typeof ExpenseAnalysisSchema>;

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

let client: OpenAI | null = null;
function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺少環境變數 OPENAI_API_KEY");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function analyzeExpenseText(text: string): Promise<ExpenseAnalysis> {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });

  const response = await getClient().responses.parse({
    model: MODEL,
    input: [
      {
        role: "system",
        content: `你是記帳助理。從使用者的文字中找出所有消費紀錄，一筆消費一個 item。今天是 ${today}。若文字中沒有任何消費，回傳空的 items。`,
      },
      { role: "user", content: text },
    ],
    text: { format: zodTextFormat(ExpenseAnalysisSchema, "expense_analysis") },
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI 沒有回傳可解析的結果");
  }
  return response.output_parsed;
}
