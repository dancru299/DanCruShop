import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            DanCruShop
          </Link>
        </div>
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          {children}
        </section>
      </div>
    </main>
  );
}
