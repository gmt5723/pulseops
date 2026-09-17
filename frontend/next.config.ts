import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/check",
        destination: "http://127.0.0.1:4000/check",
      },
    ];
  },
};

export default nextConfig;