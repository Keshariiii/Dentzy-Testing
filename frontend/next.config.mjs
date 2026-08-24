/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export — outputs to /out, compatible with Cloudflare Pages
  output: 'export',
  // Allowed development origins for LAN / mobile testing
  allowedDevOrigins: [
    '192.168.2.111',
    '192.168.2.111:5173',
    '192.168.137.1',
    '192.168.137.1:5173',
    '10.121.190.227',
    '10.121.190.227:5173',
    'localhost:5173',
    '127.0.0.1:5173',
  ],

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

  // Allow images from any source (for generated assets)
  images: {
    unoptimized: true,
  },

  // Ignore lint errors during CI/CD build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,
};

export default nextConfig;
