import "server-only";

import { createElement } from "react";
import { Resend } from "resend";

import PurchaseSuccessEmail from "@/emails/purchase-success";
import RefundNotificationEmail from "@/emails/refund-notification";
import { getSupportEmail } from "@/lib/site-config";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error("Missing RESEND_FROM_EMAIL");
  }

  return fromEmail;
}

export async function sendPurchaseSuccessEmail(
  email: string,
  productName: string,
  magicLink: string
) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject: `Your ${productName} purchase is ready`,
    react: createElement(PurchaseSuccessEmail, {
      magicLink,
      productName,
    }),
  });

  if (error) {
    console.error("Failed to send purchase success email", {
      email,
      error,
      productName,
    });

    throw new Error("Could not send purchase success email.");
  }

  return data;
}

export async function sendRefundNotificationEmail(email: string) {
  const resend = getResendClient();
  const supportEmail = getSupportEmail();
  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Your DanCruShop order has been refunded",
    react: createElement(RefundNotificationEmail, { supportEmail }),
  });

  if (error) {
    console.error("Failed to send refund notification email", {
      email,
      error,
    });

    throw new Error("Could not send refund notification email.");
  }

  return data;
}
