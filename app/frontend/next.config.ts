import type { NextConfig } from 'next';

const API_URL: string = process.env.API_URL ?? '';
const API_PREFIX: string = process.env.NEXT_PUBLIC_API_PREFIX ?? '';

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
