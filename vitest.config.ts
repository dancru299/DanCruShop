import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `import "server-only"` is injected by the Next.js bundler at build time
      // and has no resolvable module on its own. Map it to a no-op stub so we
      // can unit-test server-only modules (webhook, fulfillment, signatures).
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
