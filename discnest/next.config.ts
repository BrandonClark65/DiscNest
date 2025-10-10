import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // You can add more allowed domains here
      // { protocol: 'https', hostname: 'yourcdn.com' }
    ],
  },
};

export default nextConfig;
