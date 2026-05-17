import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SiteHeader } from "@/components/shared/site-header";
import { checkIsAdmin } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex min-w-0 flex-1 flex-col px-4 py-8 md:px-8">
          <div className="mx-auto flex w-full max-w-8xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
