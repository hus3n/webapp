/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@whiskeysockets/baileys",
      "ws",
      "better-sqlite3",
    ],
  },
};

export default nextConfig;
