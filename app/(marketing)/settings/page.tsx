import Link from "next/link";
import { redirect } from "next/navigation";
import { BellIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/settings");
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage your account preferences and shopping experience on DanCruShop.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            Icon: UserRoundIcon,
            description: "Change your display name and avatar.",
            href: "/profile",
            title: "Profile",
          },
          {
            Icon: BellIcon,
            description: "Purchase receipts and product update emails.",
            href: "#",
            title: "Notifications",
          },
          {
            Icon: ShieldCheckIcon,
            description: "Login, access permissions, and payment security.",
            href: "#",
            title: "Security",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border bg-card/60 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <item.Icon aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-4 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
            {item.href !== "#" ? (
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                render={<Link href={item.href} />}
                nativeButton={false}
              >
                Open
              </Button>
            ) : (
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Coming soon
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
