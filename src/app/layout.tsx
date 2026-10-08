import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "StreakKeeper",
  description: "Forgiving habit tracking with streak freezes",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-textPrimary antialiased min-h-screen">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}

