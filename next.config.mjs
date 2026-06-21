/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The MediaPipe Tasks Vision WASM bundle and D-ID/LiveKit SDKs are browser-only.
  // Make sure they're never pulled into the server bundle.
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false, path: false };
    return config;
  },
};

export default nextConfig;
