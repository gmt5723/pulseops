import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/check",
        destination: "http://127.0.0.1:4000/check",
      },
      {
        source: "/api/monitors",
        destination: "http://127.0.0.1:4000/monitors",
      },
    ];
  },
};

export default nextConfig;