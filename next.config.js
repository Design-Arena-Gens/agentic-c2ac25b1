/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    optimizeCss: true,
    turbo: {
      rules: {}
    }
  },
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;

