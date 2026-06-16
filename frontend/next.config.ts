import type { NextConfig } from "next";

const API_URL: string = process.env.API_URL ?? "http://backend:8000/api";
const API_PREFIX: string = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: `${API_PREFIX}/:path*`,  
        destination: `${API_URL}/:path*`, 
      },
    ];
  },
};

export default nextConfig;