import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { APP_SHELL_LAYOUT_CSS } from "@/lib/appShellLayoutCss";

const appOrigin =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
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
  /**
   * Do not read `public/compiled-styles.css` via fs here — that opts the root layout into
   * dynamic rendering and can yield streamed HTML without a full document shell (broken CSS in Safari).
   * The same CSS is served from `/compiled-styles.css` as a `public/` static asset.
   */
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style id="app-shell-layout-critical" dangerouslySetInnerHTML={{ __html: APP_SHELL_LAYOUT_CSS }} />
        <link rel="stylesheet" href="/app-shell-layout.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/compiled-styles.css" />
      </head>
      <body className="min-h-screen bg-[#F7F9FC] font-sans antialiased bg-pattern bg-glow" suppressHydrationWarning>
        {/* Body-level links: some CDN/streaming paths delay or omit <head>; HTML5 allows stylesheet links in body. */}
        <link rel="stylesheet" href="/app-shell-layout.css" precedence="default" />
        <link rel="stylesheet" href="/compiled-styles.css" precedence="default" />
        {/* Streamed HTML often omits layout <head> in Safari; inject stylesheets during parse before first paint. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){function a(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement("link");l.rel="stylesheet";l.href=h;(document.head||document.documentElement).appendChild(l)}
a("/app-shell-layout.css");
a("/compiled-styles.css");
a("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");})();`,
          }}
        />
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
