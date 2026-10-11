import { deleteSession } from "@/lib/session";

export async function POST() {
  try {
    await deleteSession();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/auth/logout]", err);
    return Response.json({ error: "登出失敗，請稍後再試" }, { status: 500 });
  }
}
