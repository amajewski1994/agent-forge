import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/agent-forge",
  assetPrefix: "/agent-forge/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
