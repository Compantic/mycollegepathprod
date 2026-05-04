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
    return [
      {
        source: "/pricing",
        destination: "/#pricing",
        permanent: true,
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
