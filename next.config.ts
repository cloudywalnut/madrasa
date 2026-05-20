import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/student/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://docs.google.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
