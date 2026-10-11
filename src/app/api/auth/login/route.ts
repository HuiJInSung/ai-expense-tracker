import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { UserModel } from "@/models/User";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "請求內容必須是 JSON" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success || !parsed.data.email || !parsed.data.password) {
    return Response.json({ error: "請輸入 Email 和密碼" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  try {
    await connectDB();
    const user = await UserModel.findOne({ email });
    // 帳號不存在和密碼錯誤回傳相同訊息，避免被拿來探測哪些 Email 有註冊
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return Response.json({ error: "Email 或密碼錯誤" }, { status: 401 });
    }

    await createSession(String(user._id));
    return Response.json({
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[api/auth/login]", err);
    return Response.json({ error: "登入失敗，請稍後再試" }, { status: 500 });
  }
}
