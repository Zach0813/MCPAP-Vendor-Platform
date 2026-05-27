/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Whitelist remote image hosts. Supabase Storage public URLs come from <project>.supabase.co.
    // Add your specific Supabase project hostname once known, then prune the wildcard.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // optional upgrade path per spec
      },
    ],
  },
  // FFmpeg packages are server-only and shouldn't be bundled for the client
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
  experimental: {
    // Server Actions are enabled by default in Next 14. Keeping this block for future flags.
  },
};

module.exports = nextConfig;
