import { routes, type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  headers: [
    routes.cacheControl("/static/(.*)", { public: true, maxAge: "1 week", immutable: true }),
  ],
};
