import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,  // coupong_v4를 명시적 루트로 지정 (부모 폴더 제외)
  },
  async redirects() {
    return [
      {
        source: '/board/:slug',
        destination: '/board?slug=:slug',
        permanent: true,
      },
      {
        source: '/promo/:path*',
        destination: '/board',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
