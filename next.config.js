/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'randomuser.me',
      'images.unsplash.com'
    ],
  },
  // Pass environment variables to the browser
  env: {
    // NODE_ENV is a reserved variable that cannot be set manually in Next.js
    // We'll use NEXT_PUBLIC_ENV instead for custom environment detection
    NEXT_PUBLIC_ENV: process.env.NODE_ENV || 'development',
    POAP_CONTRACT_ADDRESS: process.env.POAP_CONTRACT_ADDRESS || '',
  },
};

export default nextConfig; 