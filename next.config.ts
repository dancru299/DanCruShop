// When @sentry/nextjs is installed, wrap with withSentryConfig:
//
//   import { withSentryConfig } from "@sentry/nextjs";
//   export default withSentryConfig(nextConfig, {
//     silent: true,
//     disableSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
//   });

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
