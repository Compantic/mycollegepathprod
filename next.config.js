/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  /** Less aggressive gzip chunking on streamed responses. */
  compress: false,
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingExcludes: {
    "*": [
      "./serviceAccountKey.json",
      "serviceAccountKey.json",
      "./mycollegepath-660df-firebase-adminsdk-fbsvc-2cd7856a32.json",
    ],
  },
  async redirects() {
    return [];
  },
  /** Stale cached HTML at the edge can serve fragment-only responses → refresh loses CSS; force revalidation for app shell. */
  async headers() {
    return [
      {
        source: "/app/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-cache, must-revalidate" }],
      },
    ];
  },
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
    ],
  },
};

module.exports = nextConfig;
