import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SessionSchema = new Schema({
  // cookie 裡的 token 只存 SHA-256 雜湊，資料庫外洩也無法拿來登入
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // TTL index：過期後 MongoDB 會自動刪除
  expiresAt: { type: Date, required: true, expires: 0 },
});

export type Session = InferSchemaType<typeof SessionSchema>;

export const SessionModel: Model<Session> =
  (mongoose.models.Session as Model<Session>) ??
  mongoose.model<Session>("Session", SessionSchema);
