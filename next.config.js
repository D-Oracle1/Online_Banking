// Load environment variables at config time
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly expose environment variables to server-side runtime
  env: {
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_EMAIL: process.env.VAPID_EMAIL,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increased to support 5MB files + Base64 encoding overhead (~33%)
    },
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Optimize compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: false,
  },

  // Comprehensive security headers to prevent browser warnings and protect against attacks
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // HSTS - Force HTTPS (important for Chrome security)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy - Restrict dangerous features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
          },
          // Content Security Policy - Comprehensive protection
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
              "connect-src 'self' https://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://vercel.live wss://vercel.live",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "media-src 'self' https://*.supabase.co",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ]
  },

  // Rewrites for static landing pages
  async rewrites() {
    return [
      {
        source: '/home',
        destination: '/index.html',
      },
      {
        source: '/about',
        destination: '/about.html',
      },
      {
        source: '/services',
        destination: '/services.html',
      },
      {
        source: '/contact',
        destination: '/contact.html',
      },
      {
        source: '/faq',
        destination: '/faq.html',
      },
      {
        source: '/career',
        destination: '/career.html',
      },
      {
        source: '/credit-cards',
        destination: '/credit-cards.html',
      },
      {
        source: '/currency',
        destination: '/currency.html',
      },
    ]
  },


}

module.exports = nextConfig
