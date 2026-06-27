import "server-only";

import type { Resend } from "resend";

/**
 * Sends an admin-only alert when a payment webhook fails to process.
 * Kept intentionally lightweight so it doesn't add another failure path
 * to an already-failing codepath. If the email send fails we log and
 * continue — the original webhook error is still surfaced by the caller.
 */
export async function notifyWebhookFailure(params: {
  message: string;
  provider: "lemon_squeezy" | "paypal";
  providerEventId?: string | null;
}) {
  const alertEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!alertEmail) {
    // No alert email configured — skip silently.
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.warn("[webhook-alert] Resend not configured, cannot send alert.");
    return;
  }

  try {
    // Dynamic import so we don't pull in the Resend client at module-load time
    // when it isn't configured.
    const { Resend: ResendClient } = await import("resend");
    const resend = new ResendClient(apiKey) as Resend;

    const eventId = params.providerEventId ?? "unknown";
    const subject = `[DanCruShop] ${params.provider} webhook failure — ${eventId}`;

    await resend.emails.send({
      from: fromEmail,
      to: alertEmail,
      subject,
      text: `A ${params.provider} webhook could not be processed.

Event ID: ${eventId}
Error: ${params.message}

Check the webhook_events table and server logs for more details.

—
DanCruShop automated alert`,
    });

    console.info("[webhook-alert] Admin notified of webhook failure", {
      provider: params.provider,
      providerEventId: params.providerEventId,
    });
  } catch (error) {
    console.error("[webhook-alert] Could not send failure notification", error);
    // Swallow — don't let alert failure cascade into the original error handler.
  }
}