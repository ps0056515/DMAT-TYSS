import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dmat/ui', '@dmat/types'],
};

export default nextConfig;
