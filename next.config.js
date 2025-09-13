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
  turbopack: {
    //...
  },
  webpack: (config, { isServer }) => {
    // Optimize SVG handling to prevent large files from impacting webpack cache performance
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            // Optimize SVGs during build
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      // Remove viewBox to allow responsive scaling
                      removeViewBox: false,
                      // Keep dimensions for proper sizing
                      removeDimensions: false,
                    },
                  },
                },
                // Remove unnecessary metadata and comments
                'removeMetadata',
                'removeComments',
                'removeEditorsNSData',
                'cleanupAttrs',
                'cleanupNumericValues',
                'removeUnknownsAndDefaults',
                'removeNonInheritableGroupAttrs',
                'removeUselessStrokeAndFill',
                'removeUnusedNS',
                'cleanupIDs',
                'collapseGroups',
                'mergePaths',
                'convertShapeToPath',
                'sortAttrs',
                'removeDimensions',
              ],
            },
          },
        },
      ],
    })

    // Optimize webpack cache for better performance with large assets
    if (!isServer) {
      config.cache = {
        ...config.cache,
        // Use filesystem cache with compression for better performance
        type: 'filesystem',
        compression: 'gzip',
        // Set cache size limits to prevent memory issues
        maxMemoryGenerations: 1,
        // Optimize cache for large string serialization
        store: 'pack',
      }
    }

    return config
  },
}

export default nextConfig
