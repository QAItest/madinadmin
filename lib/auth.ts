import { betterAuth } from "better-auth";

const isVercelRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const localBuildSecret = "madin-admin-local-build-secret-change-in-env";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true
  },
  secret: process.env.BETTER_AUTH_SECRET ?? (isVercelRuntime ? undefined : localBuildSecret),
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean)
});
