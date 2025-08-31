/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['logo.clearbit.com'],
  },
  env: {
    MONGODB_CONNECTION_URI: process.env.MONGODB_CONNECTION_URI,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
  },
}

module.exports = nextConfig