import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Os textos ficam em /content e são lidos via fs em tempo de execução,
  // então precisam ser incluídos explicitamente no trace de produção.
  outputFileTracingIncludes: {
    "/api/generate": ["./content/**/*"],
  },
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
