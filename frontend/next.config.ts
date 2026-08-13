import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // Strip any trailing slashes from the backend URL
    const normalizedBackendUrl = backendUrl.replace(/\/+$/, "");

    return [
      {
        source: '/api/auth/:path*',
        destination: `${normalizedBackendUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
