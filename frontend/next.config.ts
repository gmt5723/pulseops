import type { NextConfig } from "next";

const apiBaseUrl = (
  process.env.API_BASE_URL || "http://127.0.0.1:4000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/check",
        destination: `${apiBaseUrl}/check`,
      },
      {
        source: "/api/checks",
        destination: `${apiBaseUrl}/checks`,
      },
      {
        source: "/api/monitors",
        destination: `${apiBaseUrl}/monitors`,
      },
      {
        source: "/api/monitors/:id",
        destination: `${apiBaseUrl}/monitors/:id`,
      },
    ];
  },
};

export default nextConfig;