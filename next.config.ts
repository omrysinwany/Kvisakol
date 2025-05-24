
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
      {
        protocol: 'https',
        hostname: 'kviskol.co.il', // Assuming this is the correct domain
        port: '',
        pathname: '/**',
      },
      // If they use a specific CDN subdomain, add it too:
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.kviskol.co.il', 
      //   port: '',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;
