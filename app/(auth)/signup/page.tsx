"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  resendCode,
  signUpWithPassword,
  verifySignupCode,
} from "@/actions/auth.actions";
import { CodeInput } from "@/components/auth/code-input";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "code";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (password !== confirm) {
      setFormError("Mật khẩu nhập lại không khớp.");
      return;
    }

    startTransition(async () => {
      const result = await signUpWithPassword(email, password);

      if (!result.ok) {
        setFormError(result.error);
        toast.error("Không đăng ký được", { description: result.error });
        return;
      }

      setStep("code");
      toast.success("Đã gửi mã xác thực", {
        description: "Vui lòng kiểm tra email của bạn.",
      });
    });
  }

  function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCodeError(null);

    startTransition(async () => {
      const result = await verifySignupCode(email, code);

      if (!result.ok) {
        setCodeError(result.error);
        return;
      }

      // Code holds the password from step 1; sign in to start the session.
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.success("Tài khoản đã được kích hoạt", {
          description: "Vui lòng đăng nhập.",
        });
        router.push("/login");
        return;
      }

      toast.success("Chào mừng đến với DanCruShop!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendCode(email, "signup");

      if (!result.ok) {
        toast.error("Không gửi lại được mã", { description: result.error });
        return;
      }

      toast.success("Đã gửi lại mã xác thực");
    });
  }

  if (step === "code") {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-normal">
            Nhập mã xác thực
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Chúng tôi đã gửi mã gồm 6 chữ số tới{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>

        <form className="mt-6" onSubmit={handleCodeSubmit}>
          <FieldGroup>
            <Field data-invalid={codeError ? true : undefined}>
              <CodeInput
                value={code}
                onChange={setCode}
                disabled={isPending}
                invalid={Boolean(codeError)}
                autoFocus
              />
              {codeError ? (
                <FieldError>{codeError}</FieldError>
              ) : (
                <FieldDescription>Mã có hiệu lực trong 10 phút.</FieldDescription>
              )}
            </Field>

            <Button
              className="w-full"
              type="submit"
              disabled={isPending || code.length < 6}
            >
              {isPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : null}
              {isPending ? "Đang xác thực..." : "Xác thực & kích hoạt"}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            Đổi email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            Gửi lại mã
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-normal">
          Tạo tài khoản DanCruShop
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Đăng ký bằng email và mật khẩu của bạn.
        </p>
      </div>

      <div className="mt-6">
        <GoogleButton />
      </div>

      <FieldSeparator className="my-5">hoặc</FieldSeparator>

      <form onSubmit={handleFormSubmit}>
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

          <Field>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
              disabled={isPending}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>

          <Field data-invalid={formError ? true : undefined}>
            <FieldLabel htmlFor="confirm">Nhập lại mật khẩu</FieldLabel>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              value={confirm}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={formError ? true : undefined}
              onChange={(event) => setConfirm(event.target.value)}
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
            {isPending ? "Đang gửi mã..." : "Đăng ký"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
