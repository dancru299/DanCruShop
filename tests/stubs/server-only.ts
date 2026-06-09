// No-op stub for the `server-only` marker package.
//
// In production the Next.js bundler resolves `import "server-only"` to a module
// that throws if it is ever pulled into a client bundle. Vitest has no such
// bundler alias, so we map the specifier to this empty module (see
// vitest.config.ts) to let us unit-test server-only modules in isolation.
export {};
