/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // @sfgc/shared ships TypeScript source rather than a build artefact, so Next
  // has to compile it alongside the app.
  transpilePackages: ['@sfgc/shared'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.sfgc.ac.in' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },

  eslint: {
    // Lint is run explicitly via `npm run lint`; a lint warning should not
    // block a production build.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
