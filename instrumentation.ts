// Sentry instrumentation — runs once when the Next.js server starts.
// Requires @sentry/nextjs to be installed first:
//   npm install @sentry/nextjs
// Then uncomment the body of this function.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // await import("./sentry.edge.config");
  }
}
