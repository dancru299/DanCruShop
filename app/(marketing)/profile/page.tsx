import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/account/profile-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:py-14">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Tài khoản</p>
        <h1 className="text-3xl font-semibold tracking-normal">Hồ sơ</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Cập nhật tên hiển thị và ảnh đại diện dùng trong mua hàng, đánh giá và phản hồi.
        </p>
      </div>

      <ProfileForm
        email={user.email ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initialFullName={fullName}
      />
    </section>
  );
}
