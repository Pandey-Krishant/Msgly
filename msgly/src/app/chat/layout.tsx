import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/unauth");
  }
  return <>{children}</>;
}
