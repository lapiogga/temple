/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 이미지 최적화: 추후 S3/CloudFront 도메인 추가
  images: { remotePatterns: [] },
};
export default nextConfig;
