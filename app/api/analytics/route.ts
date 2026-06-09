import { NextResponse } from "next/server";

import { sanitizeAnalyticsPayload } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/server";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function getOptionalUserId() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { allowed } = await enforceRateLimit(`analytics:${ip}`, {
    max: 120,
    windowMs: 60_000,
  });

  if (!allowed) {
    return NextResponse.json({ error: "Too many events." }, { status: 429 });
  }

  let rawPayload: unknown;

  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const payload = sanitizeAnalyticsPayload(rawPayload);

  if (!payload) {
    return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
  }

  await recordAnalyticsEvent({
    anonymousId: payload.anonymousId,
    eventName: payload.eventName,
    metadata: payload.metadata,
    orderId: payload.orderId,
    path: payload.path,
    productId: payload.productId,
    referrer: payload.referrer,
    userId: await getOptionalUserId(),
  });

  return new NextResponse(null, { status: 204 });
}
