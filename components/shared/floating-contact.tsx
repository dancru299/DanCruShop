"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  HeadphonesIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  PhoneIcon,
  SendIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Mirrors ContactSettings from lib/store/settings (server-only) so this client
// component never imports the server module. `icon` is an optional uploaded logo.
type ContactChannel = { url: string | null; icon: string | null };
type ContactChannels = {
  zalo: ContactChannel;
  telegram: ContactChannel;
  messenger: ContactChannel;
  phone: ContactChannel;
};

type Item = {
  key: keyof ContactChannels;
  label: string;
  href: string;
  iconUrl: string | null;
  // Brand colors are intentional raw hex (recognizability), not design tokens.
  className: string;
  fallbackIcon: React.ReactNode;
};

function normalizePhoneHref(value: string) {
  return value.startsWith("tel:") ? value : `tel:${value.replace(/\s+/g, "")}`;
}

export function FloatingContact({ channels }: { channels: ContactChannels }) {
  const [open, setOpen] = useState(false);

  const items: Item[] = [];

  if (channels.zalo.url) {
    items.push({
      key: "zalo",
      label: "Chat Zalo",
      href: channels.zalo.url,
      iconUrl: channels.zalo.icon,
      className: "bg-[#0068ff] text-white hover:bg-[#0058db]",
      fallbackIcon: <MessagesSquareIcon aria-hidden="true" className="size-6" />,
    });
  }
  if (channels.messenger.url) {
    items.push({
      key: "messenger",
      label: "Messenger",
      href: channels.messenger.url,
      iconUrl: channels.messenger.icon,
      className: "bg-[#0084ff] text-white hover:bg-[#0072db]",
      fallbackIcon: <MessageCircleIcon aria-hidden="true" className="size-6" />,
    });
  }
  if (channels.telegram.url) {
    items.push({
      key: "telegram",
      label: "Telegram",
      href: channels.telegram.url,
      iconUrl: channels.telegram.icon,
      className: "bg-[#229ed9] text-white hover:bg-[#1e8ec2]",
      fallbackIcon: <SendIcon aria-hidden="true" className="size-6" />,
    });
  }
  if (channels.phone.url) {
    items.push({
      key: "phone",
      label: "Gọi ngay",
      href: normalizePhoneHref(channels.phone.url),
      iconUrl: channels.phone.icon,
      className: "bg-emerald-500 text-white hover:bg-emerald-600",
      fallbackIcon: <PhoneIcon aria-hidden="true" className="size-6" />,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3.5">
      <div
        className={cn(
          "flex flex-col items-end gap-3.5 transition-all duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        {items.map((item, index) => (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="group flex items-center gap-2.5"
            style={{ transitionDelay: open ? `${index * 45}ms` : "0ms" }}
          >
            <span className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
              {item.label}
            </span>
            <span
              className={cn(
                "flex size-14 items-center justify-center overflow-hidden rounded-full shadow-lg ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110",
                // Uploaded logos sit on a clean white disc; otherwise brand color.
                item.iconUrl ? "bg-white" : item.className
              )}
            >
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt=""
                  className="size-9 object-contain"
                />
              ) : (
                item.fallbackIcon
              )}
            </span>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Đóng liên hệ" : "Liên hệ hỗ trợ"}
        className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/15 transition-transform duration-200 hover:scale-105"
      >
        {!open ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40" />
        ) : null}
        {open ? (
          <XIcon aria-hidden="true" className="size-7" />
        ) : (
          <HeadphonesIcon aria-hidden="true" className="size-7" />
        )}
      </button>
    </div>
  );
}
