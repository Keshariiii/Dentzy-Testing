/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — outputs to /out, compatible with Cloudflare Pages
  output: 'export',
  // Allowed development origins for LAN / mobile testing
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS 
    ? process.env.ALLOWED_DEV_ORIGINS.split(',').map(o => o.trim())
    : ['localhost:3000', '127.0.0.1:3000', 'localhost', '127.0.0.1'],

  // API proxy — only active in local dev (no NEXT_PUBLIC_API_URL set)
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },

  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
};

export default nextConfig;
