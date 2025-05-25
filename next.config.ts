
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // The kvisakol.com entry is removed as product images are now local.
      // If you have other external images from kvisakol.com (not product images),
      // you might need to re-add it or a more specific pattern.
    ],
  },
};

export default nextConfig;

    
