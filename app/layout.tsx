import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MyCollegePath – Your College Admissions Coach",
  description: "Find and evaluate colleges with personalized matching and AI guidance.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "1024x1024" }],
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Fallback when SSR omits stylesheet <link>s (some Linux Docker builds). */}
        {process.env.NODE_ENV === "production" ? (
          <link rel="stylesheet" href="/compiled-styles.css" />
        ) : null}
      </head>
      <body className="min-h-screen bg-[#F7F9FC] font-sans antialiased bg-pattern bg-glow" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
