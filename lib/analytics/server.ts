import "server-only";

import type { AnalyticsEventName } from "@/lib/analytics/events";
import {
  getSupabaseErrorDetails,
  isMissingSupabaseTable,
} from "@/lib/supabase/errors";
import { createAdminClient } from "@/lib/supabase/admin";

type ServerAnalyticsInput = {
  anonymousId?: string | null;
  eventName: AnalyticsEventName;
  metadata?: Record<string, unknown>;
  orderId?: string | null;
  path?: string | null;
  productId?: string | null;
  referrer?: string | null;
  userId?: string | null;
};

export async function recordAnalyticsEvent(input: ServerAnalyticsInput) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      anonymous_id: input.anonymousId ?? null,
      event_name: input.eventName,
      metadata: input.metadata ?? {},
      order_id: input.orderId ?? null,
      path: input.path ?? null,
      product_id: input.productId ?? null,
      referrer: input.referrer ?? null,
      user_id: input.userId ?? null,
    });

    if (!error) {
      return;
    }

    if (isMissingSupabaseTable(error, "analytics_events")) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Analytics table is not deployed.", getSupabaseErrorDetails(error));
      }

      return;
    }

    console.warn("Failed to record analytics event.", getSupabaseErrorDetails(error));
  } catch (error) {
    console.warn("Unexpected analytics recording error.", error);
  }
}
