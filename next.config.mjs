/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uklonili smo deprecated appDir opciju
  eslint: {
    // Ignorišemo ESLint greške tokom build-a
    ignoreDuringBuilds: true,
  },
}

export default nextConfig