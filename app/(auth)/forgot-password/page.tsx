"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  requestPasswordReset,
  resetPasswordWithCode,
} from "@/actions/auth.actions";
import { CodeInput } from "@/components/auth/code-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(null);

    startTransition(async () => {
      const result = await requestPasswordReset(email);

      if (!result.ok) {
        setEmailError(result.error);
        return;
      }

      setStep("reset");
      toast.success("If the email is valid, a code has been sent", {
        description: "Please check your inbox.",
      });
    });
  }

  function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);

    if (password !== confirm) {
      setResetError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await resetPasswordWithCode(email, code, password);

      if (!result.ok) {
        setResetError(result.error);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.success("Password reset", { description: "Please log in." });
        router.push("/login");
        return;
      }

      toast.success("Password reset");
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleResend() {
    startTransition(async () => {
      const result = await requestPasswordReset(email);

      if (!result.ok) {
        toast.error("Couldn't resend code", { description: result.error });
        return;
      }

      toast.success("Code resent");
    });
  }

  if (step === "reset") {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-normal">
            Reset password
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter the code sent to{" "}
            <span className="font-medium text-foreground">{email}</span> and a
            new password.
          </p>
        </div>

        <form className="mt-6" onSubmit={handleResetSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Verification code</FieldLabel>
              <CodeInput
                value={code}
                onChange={setCode}
                disabled={isPending}
                invalid={Boolean(resetError)}
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={isPending}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>

            <Field data-invalid={resetError ? true : undefined}>
              <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                value={confirm}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isPending}
                aria-invalid={resetError ? true : undefined}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />
              {resetError ? <FieldError>{resetError}</FieldError> : null}
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
              {isPending ? "Resetting..." : "Reset password"}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setStep("email")}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
            Change email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-normal">
          Forgot password
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter your email and we'll send a code to reset your password.
        </p>
      </div>

      <form className="mt-6" onSubmit={handleEmailSubmit}>
        <FieldGroup>
          <Field data-invalid={emailError ? true : undefined}>
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
              aria-invalid={emailError ? true : undefined}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {emailError ? (
              <FieldError>{emailError}</FieldError>
            ) : (
              <FieldDescription>
                A verification code will be sent if this email has an account.
              </FieldDescription>
            )}
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
            {isPending ? "Sending..." : "Send code"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
