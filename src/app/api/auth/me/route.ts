import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "尚未登入" }, { status: 401 });
    return Response.json({ user });
  } catch (err) {
    console.error("[api/auth/me]", err);
    return Response.json({ error: "讀取使用者失敗" }, { status: 500 });
  }
}
