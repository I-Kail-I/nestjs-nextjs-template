import type { NextConfig } from 'next';
import { isDevelopment } from '@/utils/check-env';

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
  output: 'standalone',
  images: {
    remotePatterns: isDevelopment
      ? [
          {
            protocol: 'https',
            hostname: '**', // Allows all HTTPS domains
          },
          {
            protocol: 'http',
            hostname: '**', // Allows all HTTP domains (useful for local dev servers)
          },
        ]
      : [],
  },
};

export default nextConfig;
