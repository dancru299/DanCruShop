import { NextResponse } from "next/server";

import { verifyPayPalWebhook } from "@/lib/payments/paypal";
import {
  processPayPalCaptureCompleted,
  processPayPalCaptureRefunded,
} from "@/lib/payments/paypal-webhook";
import { notifyWebhookFailure } from "@/lib/payments/webhook-failure-alert";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

type PayPalWebhookPayload = {
  id?: unknown;
  event_type?: unknown;
  resource?: unknown;
  [key: string]: unknown;
};

type StoredWebhookEvent = {
  id: string;
  processed_at: string | null;
};

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function storeWebhookEvent(
  payload: PayPalWebhookPayload,
  eventName: string,
  providerEventId: string | null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      provider: "paypal",
      event_type: eventName,
      provider_event_id: providerEventId,
      payload,
    })
    .select("id, processed_at")
    .single();

  if (!error) {
    return { duplicate: false, event: data as StoredWebhookEvent };
  }

  if (error.code !== "23505" || !providerEventId) {
    console.error("Failed to store PayPal webhook event", {
      error,
      eventName,
      providerEventId,
    });

    throw new Error("Could not store webhook event.");
  }

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("webhook_events")
    .select("id, processed_at")
    .eq("provider", "paypal")
    .eq("provider_event_id", providerEventId)
    .single();

  if (existingEventError) {
    console.error("Failed to load duplicate PayPal webhook event", {
      error: existingEventError,
      eventName,
      providerEventId,
    });

    throw new Error("Could not load duplicate webhook event.");
  }

  return { duplicate: true, event: existingEvent as StoredWebhookEvent };
}

async function markWebhookEventProcessed(eventId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    console.error("Failed to mark PayPal webhook event as processed", {
      error,
      eventId,
    });

    throw new Error("Could not mark webhook event as processed.");
  }
}

function getEventName(payload: PayPalWebhookPayload) {
  return typeof payload.event_type === "string" && payload.event_type.length > 0
    ? payload.event_type
    : "unknown";
}

function getProviderEventId(payload: PayPalWebhookPayload) {
  return typeof payload.id === "string" && payload.id.length > 0
    ? payload.id
    : null;
}

export async function POST(request: Request) {
  const rawPayload = await request.text();
  const headers = {
    authAlgo: request.headers.get("paypal-auth-algo"),
    certUrl: request.headers.get("paypal-cert-url"),
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionSig: request.headers.get("paypal-transmission-sig"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
  };

  try {
    const isValid = await verifyPayPalWebhook(headers, rawPayload);

    if (!isValid) {
      console.warn("Invalid PayPal webhook signature");

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    console.error("Failed to verify PayPal webhook signature", error);

    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 500 }
    );
  }

  let payload: PayPalWebhookPayload;

  try {
    const parsed = JSON.parse(rawPayload) as unknown;

    if (!isRecord(parsed)) {
      throw new Error("Webhook payload must be a JSON object.");
    }

    payload = parsed as PayPalWebhookPayload;
  } catch (error) {
    console.error("Failed to parse PayPal webhook payload", error);

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName = getEventName(payload);
  const providerEventId = getProviderEventId(payload);

  try {
    const storedEvent = await storeWebhookEvent(
      payload,
      eventName,
      providerEventId
    );

    if (storedEvent.duplicate && storedEvent.event.processed_at) {
      return NextResponse.json({
        duplicate: true,
        processed: true,
        received: true,
      });
    }

    switch (eventName) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await processPayPalCaptureCompleted(payload);
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED":
      case "PAYMENT.CAPTURE.DENIED":
        await processPayPalCaptureRefunded(payload);
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
      default:
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected PayPal webhook handler error", error);

    notifyWebhookFailure({
      message,
      provider: "paypal",
      providerEventId,
    });

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
