// When @sentry/nextjs is installed, wrap with withSentryConfig:
//
//   import { withSentryConfig } from "@sentry/nextjs";
//   export default withSentryConfig(nextConfig, {
//     silent: true,
//     disableSourceMapUpload: !process.env.SENTRY_AUTH_TOKEN,
//   });

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Admin image uploads (uploadAdminImage) post the file through a Server
    // Action. The default body limit is 1MB, which silently rejects images
    // above it with "An unexpected response was received from the server.".
    // Keep this comfortably above the 5MB image cap to allow multipart overhead.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
