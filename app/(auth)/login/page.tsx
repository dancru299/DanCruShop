"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function getNextPath() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }

  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_callback_failed") {
      toast.error("Đăng nhập thất bại", {
        description: "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
      });
    }
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const message = "Email hoặc mật khẩu không đúng.";
        setFormError(message);
        toast.error("Không đăng nhập được", { description: message });
        return;
      }

      const next = getNextPath();
      router.push(next);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-normal">
          Đăng nhập DanCruShop
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Nhập email và mật khẩu để truy cập tài khoản của bạn.
        </p>
      </div>

      <div className="mt-6">
        <GoogleButton next={getNextPath()} />
      </div>

      <FieldSeparator className="my-5">hoặc</FieldSeparator>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isPending}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>

          <Field data-invalid={formError ? true : undefined}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isPending}
              aria-invalid={formError ? true : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {formError ? <FieldError>{formError}</FieldError> : null}
          </Field>

          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2Icon
                data-icon="inline-start"
                aria-hidden="true"
                className="animate-spin"
              />
            ) : (
              <ArrowRightIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          href="/signup"
          className="text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Đăng ký
        </Link>
      </p>
    </>
  );
}
