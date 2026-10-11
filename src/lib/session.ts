import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SessionModel } from "@/models/Session";
import { UserModel, type UserRole } from "@/models/User";

const COOKIE_NAME = "session";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/** cookie 加密後的內容：session token 與到期時間 */
type CookiePayload = { t: string; e: number };

let keys: { cookie: Buffer; token: Buffer } | null = null;

/** 從 SESSION_SECRET 衍生兩把獨立金鑰：一把加密 cookie、一把雜湊 token */
function getKeys() {
  if (keys) return keys;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("缺少環境變數 SESSION_SECRET（至少 32 個字元）");
  }
  const derive = (info: string) => Buffer.from(hkdfSync("sha256", secret, "", info, 32));
  keys = { cookie: derive("session-cookie-encryption"), token: derive("session-token-hmac") };
  return keys;
}

// 資料庫只存 token 的 HMAC；沒有 SESSION_SECRET 就無法從資料庫反推出可用的 cookie
function hashToken(token: string) {
  return createHmac("sha256", getKeys().token).update(token).digest("hex");
}

// AES-256-GCM：cookie 內容無法被讀取，也無法被竄改（驗證標籤不符就解不開）
function encryptCookie(payload: CookiePayload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKeys().cookie, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

function decryptCookie(value: string): CookiePayload | null {
  try {
    const data = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", getKeys().cookie, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const json = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
    const payload = JSON.parse(json) as CookiePayload;
    return typeof payload.t === "string" && typeof payload.e === "number" ? payload : null;
  } catch {
    // 被竄改、金鑰已更換或格式錯誤
    return null;
  }
}

/** 建立登入 session 並寫入加密的 HttpOnly cookie（只能在 Route Handler / Server Action 呼叫） */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await connectDB();
  await SessionModel.create({ tokenHash: hashToken(token), userId, expiresAt });

  (await cookies()).set(COOKIE_NAME, encryptCookie({ t: token, e: expiresAt.getTime() }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** 讀取目前登入的使用者；未登入或 session 失效時回傳 null */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;

  // 下面要用目前時間判斷 session 是否過期，明確標記為只在 request 時執行
  await connection();
  const payload = decryptCookie(value);
  if (!payload || payload.e <= Date.now()) return null;

  await connectDB();
  const session = await SessionModel.findOne({
    tokenHash: hashToken(payload.t),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;

  const user = await UserModel.findById(session.userId).lean();
  if (!user) return null;

  return { id: String(user._id), email: user.email, name: user.name, role: user.role };
}

/** 登出：刪除資料庫中的 session 並清掉 cookie */
export async function deleteSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const payload = value && decryptCookie(value);
  if (payload) {
    await connectDB();
    await SessionModel.deleteOne({ tokenHash: hashToken(payload.t) });
  }
  cookieStore.delete(COOKIE_NAME);
}
