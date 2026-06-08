"use client";

import { useCallback } from "react";

import type { AnalyticsEventName, AnalyticsPayload } from "@/lib/analytics/events";

const ANALYTICS_STORAGE_KEY = "dancrushop-anonymous-id-v1";

function createAnonymousId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const current = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);

    if (current) {
      return current;
    }

    const next = createAnonymousId();
    window.localStorage.setItem(ANALYTICS_STORAGE_KEY, next);

    return next;
  } catch {
    return null;
  }
}

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  payload: Omit<AnalyticsPayload, "anonymousId" | "eventName"> = {}
) {
  if (typeof window === "undefined") {
    return;
  }

  const body: AnalyticsPayload = {
    anonymousId: getAnonymousId(),
    eventName,
    path: payload.path ?? window.location.pathname,
    referrer: payload.referrer ?? document.referrer,
    ...payload,
  };

  const serializedBody = JSON.stringify(body);

  if (navigator.sendBeacon) {
    const blob = new Blob([serializedBody], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }

  void fetch("/api/analytics", {
    body: serializedBody,
    headers: {
      "Content-Type": "application/json",
    },
    keepalive: true,
    method: "POST",
  });
}

export function useAnalytics() {
  return useCallback(
    (
      eventName: AnalyticsEventName,
      payload: Omit<AnalyticsPayload, "anonymousId" | "eventName"> = {}
    ) => {
      trackAnalyticsEvent(eventName, payload);
    },
    []
  );
}
