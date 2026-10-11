import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { UserModel } from "@/models/User";

// 註冊驗證碼：只有知道驗證碼的人才能加入共同記帳本（目前先寫死）
const INVITE_CODE = "love";

const RegisterSchema = z.object({
  email: z.email("Email 格式不正確").trim().toLowerCase(),
  password: z.string().min(8, "密碼至少 8 個字元").max(100, "密碼太長"),
  name: z.string().trim().min(1, "請輸入名稱").max(50, "名稱最多 50 字"),
  inviteCode: z.string("請輸入驗證碼").trim().toLowerCase(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "請求內容必須是 JSON" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, password, name, inviteCode } = parsed.data;
  if (inviteCode !== INVITE_CODE) {
    return Response.json({ error: "驗證碼錯誤" }, { status: 403 });
  }

  try {
    await connectDB();
    if (await UserModel.exists({ email })) {
      return Response.json({ error: "此 Email 已經註冊過" }, { status: 409 });
    }

    // role 不接受前端傳入，一律為一般使用者
    const user = await UserModel.create({
      email,
      name,
      passwordHash: await hashPassword(password),
    });
    await createSession(String(user._id));

    return Response.json(
      { user: { id: String(user._id), email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );
  } catch (err) {
    // 同時送出兩次註冊時，unique index 會擋下第二次
    if ((err as { code?: number }).code === 11000) {
      return Response.json({ error: "此 Email 已經註冊過" }, { status: 409 });
    }
    console.error("[api/auth/register]", err);
    return Response.json({ error: "註冊失敗，請稍後再試" }, { status: 500 });
  }
}
