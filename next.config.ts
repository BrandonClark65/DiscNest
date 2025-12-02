import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // You can add more allowed domains here
      // { protocol: 'https', hostname: 'yourcdn.com' }
    ],
  },
};

export default nextConfig;
