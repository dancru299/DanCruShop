import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareProvider } from "@/components/compare/compare-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { CommandPaletteProvider } from "@/components/command-palette/command-palette-provider";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl, siteName } from "@/lib/site-config";

import "./globals.css";

const siteDescription =
  "A storefront for tools, source code, and digital resources for builders.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} — Tools, source code & digital resources`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: [{ url: "/logo-mark.svg", type: "image/svg+xml" }],
    shortcut: "/logo-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh bg-background font-sans text-foreground antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <CartProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <CommandPaletteProvider>
                    {children}
                    <CompareBar />
                    <CommandPalette />
                    <Toaster position="top-center" richColors />
                  </CommandPaletteProvider>
                </CompareProvider>
              </FavoritesProvider>
            </CartProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
