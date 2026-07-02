import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@dmat/ui', '@dmat/types', '@dmat/api-client'],
};

export default nextConfig;
