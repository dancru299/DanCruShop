"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon, Loader2Icon, MailIcon } from "lucide-react";
import { toast } from "sonner";

import { signInWithMagicLink } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const result = await signInWithMagicLink(email);

      if (!result.ok) {
        setFormError(result.error);
        toast.error("Khong gui duoc link", {
          description: result.error,
        });
        return;
      }

      setEmail("");
      toast.success("Check your email", {
        description: "Magic link da duoc gui neu email nay hop le.",
      });
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <MailIcon aria-hidden="true" className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Dang nhap DanCruShop
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Nhap email de nhan magic link vao dashboard cua ban.
          </p>
        </div>

        <form className="mt-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={formError ? true : undefined}>
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
                aria-invalid={formError ? true : undefined}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              {formError ? (
                <FieldError>{formError}</FieldError>
              ) : (
                <FieldDescription>
                  Link dang nhap chi dung mot lan va se het han theo cau hinh
                  Supabase.
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
              {isPending ? "Dang gui..." : "Gui link dang nhap"}
            </Button>
          </FieldGroup>
        </form>
      </section>
    </main>
  );
}
