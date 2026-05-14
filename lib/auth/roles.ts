import { createClient } from "@/lib/supabase/server";

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to check admin role", error);
      return false;
    }

    return data?.role === "admin";
  } catch (error) {
    console.error("Unexpected error while checking admin role", error);
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized admin action.");
  }
}
