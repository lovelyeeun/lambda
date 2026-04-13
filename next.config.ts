import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx", "jspdf", "jspdf-autotable"],
};

export default nextConfig;
