import { redirect } from "next/navigation";
import { currentSessionUser } from "@/lib/auth/session";
import DashboardNav from "@/components/layout/DashboardNav";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentSessionUser();
  if (!user) redirect("/login");

  return <DashboardNav user={user}>{children}</DashboardNav>;
}
