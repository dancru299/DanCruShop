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
      setFormError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await signUpWithPassword(email, password);

      if (!result.ok) {
        setFormError(result.error);
        toast.error("Sign-up failed", { description: result.error });
        return;
      }

      setStep("code");
      toast.success("Verification code sent", {
        description: "Please check your email.",
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
        toast.success("Account activated", {
          description: "Please log in.",
        });
        router.push("/login");
        return;
      }

      toast.success("Welcome to DanCruShop!");
      router.push("/dashboard");
      router.refresh();
    });
  }

  function handleResend() {
    startTransition(async () => {
      const result = await resendCode(email, "signup");

      if (!result.ok) {
        toast.error("Couldn't resend code", { description: result.error });
        return;
      }

      toast.success("Verification code resent");
    });
  }

  if (step === "code") {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-normal">
            Enter verification code
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            We sent a 6-digit code to{" "}
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
                <FieldDescription>The code is valid for 10 minutes.</FieldDescription>
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
              {isPending ? "Verifying..." : "Verify & activate"}
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
          Create your DanCruShop account
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Sign up with your email and password.
        </p>
      </div>

      <div className="mt-6">
        <GoogleButton />
      </div>

      <FieldSeparator className="my-5">or</FieldSeparator>

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
            <FieldLabel htmlFor="password">Password</FieldLabel>
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

          <Field data-invalid={formError ? true : undefined}>
            <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
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
            {isPending ? "Sending code..." : "Sign up"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
