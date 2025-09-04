/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['plus.unsplash.com', 'images.unsplash.com'],
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Allow production builds to successfully complete even if ESLint fails
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow production builds to successfully complete even if TypeScript fails
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
