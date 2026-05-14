import { NextResponse } from "next/server";

import { verifyWebhookSignature } from "@/lib/payments/lemon-squeezy";
import {
  processOrderCreatedEvent,
  processOrderRefundedEvent,
} from "@/lib/payments/lemon-squeezy-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type JsonObject = Record<string, unknown>;

type LemonSqueezyWebhookPayload = {
  meta?: {
    event_name?: unknown;
    custom_data?: unknown;
    [key: string]: unknown;
  };
  data?: {
    id?: unknown;
    type?: unknown;
    [key: string]: unknown;
  };
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
  payload: LemonSqueezyWebhookPayload,
  eventName: string,
  providerEventId: string | null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      provider: "lemon_squeezy",
      event_type: eventName,
      provider_event_id: providerEventId,
      payload,
    })
    .select("id, processed_at")
    .single();

  if (!error) {
    return {
      duplicate: false,
      event: data as StoredWebhookEvent,
      supabase,
    };
  }

  if (error.code !== "23505" || !providerEventId) {
    console.error("Failed to store Lemon Squeezy webhook event", {
      error,
      eventName,
      providerEventId,
    });

    throw new Error("Could not store webhook event.");
  }

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("webhook_events")
    .select("id, processed_at")
    .eq("provider", "lemon_squeezy")
    .eq("provider_event_id", providerEventId)
    .single();

  if (existingEventError) {
    console.error("Failed to load duplicate Lemon Squeezy webhook event", {
      error: existingEventError,
      eventName,
      providerEventId,
    });

    throw new Error("Could not load duplicate webhook event.");
  }

  return {
    duplicate: true,
    event: existingEvent as StoredWebhookEvent,
    supabase,
  };
}

async function markWebhookEventProcessed(eventId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("webhook_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    console.error("Failed to mark Lemon Squeezy webhook event as processed", {
      error,
      eventId,
    });

    throw new Error("Could not mark webhook event as processed.");
  }
}

function parseWebhookPayload(rawPayload: string) {
  const parsed = JSON.parse(rawPayload) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Webhook payload must be a JSON object.");
  }

  return parsed as LemonSqueezyWebhookPayload;
}

function getEventName(payload: LemonSqueezyWebhookPayload) {
  const eventName = payload.meta?.event_name;

  return typeof eventName === "string" && eventName.length > 0
    ? eventName
    : "unknown";
}

function getProviderEventId(
  eventName: string,
  payload: LemonSqueezyWebhookPayload
) {
  const dataType = payload.data?.type;
  const dataId = payload.data?.id;

  if (typeof dataType === "string" && typeof dataId === "string") {
    return `${eventName}:${dataType}:${dataId}`;
  }

  if (typeof dataId === "string") {
    return `${eventName}:${dataId}`;
  }

  return null;
}

export async function POST(request: Request) {
  const rawPayload = await request.text();
  const signature = request.headers.get("x-signature");

  if (!signature) {
    console.warn("Lemon Squeezy webhook missing x-signature header");

    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    const isValidSignature = verifyWebhookSignature(rawPayload, signature);

    if (!isValidSignature) {
      console.warn("Invalid Lemon Squeezy webhook signature");

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    console.error("Failed to verify Lemon Squeezy webhook signature", error);

    return NextResponse.json({ error: "Signature verification failed" }, { status: 500 });
  }

  let payload: LemonSqueezyWebhookPayload;

  try {
    payload = parseWebhookPayload(rawPayload);
  } catch (error) {
    console.error("Failed to parse Lemon Squeezy webhook payload", error);

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName = getEventName(payload);
  const providerEventId = getProviderEventId(eventName, payload);

  try {
    const storedEvent = await storeWebhookEvent(
      payload,
      eventName,
      providerEventId
    );

    console.info("Stored Lemon Squeezy webhook event", {
      customData: payload.meta?.custom_data,
      duplicate: storedEvent.duplicate,
      eventName,
      providerEventId,
    });

    if (storedEvent.duplicate && storedEvent.event.processed_at) {
      return NextResponse.json({
        duplicate: true,
        processed: true,
        received: true,
      });
    }

    switch (eventName) {
      case "order_created":
        await processOrderCreatedEvent(payload);
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
      case "order_refunded":
        await processOrderRefundedEvent(payload);
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
      default:
        await markWebhookEventProcessed(storedEvent.event.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unexpected Lemon Squeezy webhook handler error", error);

    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
