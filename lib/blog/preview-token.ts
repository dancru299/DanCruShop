import "server-only";

import crypto from "node:crypto";

function getPreviewSecret() {
  return (
    process.env.BLOG_PREVIEW_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dancrushop-blog-preview-dev"
  );
}

export function generatePreviewToken(postId: string): string {
  return crypto
    .createHmac("sha256", getPreviewSecret())
    .update(postId)
    .digest("hex");
}

export function verifyPreviewToken(postId: string, token: string): boolean {
  try {
    const expected = generatePreviewToken(postId);
    const expectedBuf = Buffer.from(expected, "hex");
    const receivedBuf = Buffer.from(token, "hex");

    if (receivedBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}
