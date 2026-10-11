import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppSkeleton, ExpenseHome } from "@/app/_components/ExpenseHome";
import { getCurrentUser } from "@/lib/session";

export default function Page() {
  // 讀取 cookie 屬於 request-time 資料，必須放在 Suspense 裡
  return (
    <Suspense fallback={<AppSkeleton />}>
      <AuthedHome />
    </Suspense>
  );
}

async function AuthedHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // 只傳畫面需要的欄位給 client
  return <ExpenseHome user={{ id: user.id, name: user.name, email: user.email }} />;
}
