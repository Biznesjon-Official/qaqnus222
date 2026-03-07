import type { NextConfig } from 'next'

const PRODUCTION_URL = 'https://qaqnus222.biznesjon.uz'

// Switch: true = production API dan ma'lumot oladi, false = local DB ishlatadi
const USE_PRODUCTION_API = process.env.USE_PRODUCTION_API === 'true'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  async rewrites() {
    if (!USE_PRODUCTION_API) return []
    return [
      // Auth local qoladi — barcha boshqa API production ga yo'naltiriladi
      {
        source: '/api/:path((?!auth).*)',
        destination: `${PRODUCTION_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
