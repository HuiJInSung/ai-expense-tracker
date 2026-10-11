import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  // 依每個 request 的 cookie 回應，不在 build 時預先產生
  await connection();
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "尚未登入" }, { status: 401 });
    return Response.json({ user });
  } catch (err) {
    console.error("[api/auth/me]", err);
    return Response.json({ error: "讀取使用者失敗" }, { status: 500 });
  }
}
