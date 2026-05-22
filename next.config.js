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
  experimental: {
    // Server Actions are enabled by default in Next 14. Keeping this block for future flags.
  },
};

module.exports = nextConfig;
