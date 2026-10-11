import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";

const ExpenseSchema = new Schema(
  {
    // 記下這筆帳的使用者
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "TWD" },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    date: { type: Date, required: true },
    // 使用者輸入的原始文字，方便之後追查 AI 分析結果
    rawText: { type: String, required: true },
  },
  { timestamps: true }
);

// 共同記帳本依期間查詢所有成員的消費
ExpenseSchema.index({ date: 1 });

export type Expense = InferSchemaType<typeof ExpenseSchema>;

export const ExpenseModel: Model<Expense> =
  (mongoose.models.Expense as Model<Expense>) ??
  mongoose.model<Expense>("Expense", ExpenseSchema);
