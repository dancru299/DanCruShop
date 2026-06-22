import { SiteHeader } from "@/components/shared/site-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-8 md:grid-cols-[13rem_1fr] md:gap-8">
        <aside>
          <DashboardNav />
        </aside>
        {children}
      </div>
    </div>
  );
}
