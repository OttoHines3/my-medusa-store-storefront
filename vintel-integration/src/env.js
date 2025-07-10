import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET: isProduction ? z.string() : z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Zoho API Configuration - Required in production, optional in development
    ZOHO_CLIENT_ID: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_CLIENT_SECRET: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_REFRESH_TOKEN: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_ORG_ID: isProduction ? z.string() : z.string().optional().default(""),
    ZOHO_ACCESS_TOKEN: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_API_URL: isProduction
      ? z.string()
      : z.string().optional().default("https://www.zohoapis.com/crm/v3"),

    // Zoho Billing Configuration - Required in production, optional in development
    ZOHO_BILLING_ORGANIZATION_ID: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_BILLING_AUTH_TOKEN: isProduction
      ? z.string()
      : z.string().optional().default(""),
    ZOHO_BILLING_WEBHOOK_SECRET: isProduction
      ? z.string()
      : z.string().optional().default(""),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    // Zoho API Configuration
    ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
    ZOHO_ORG_ID: process.env.ZOHO_ORG_ID,
    ZOHO_ACCESS_TOKEN: process.env.ZOHO_ACCESS_TOKEN,
    ZOHO_API_URL: process.env.ZOHO_API_URL,

    // Zoho Billing Configuration
    ZOHO_BILLING_ORGANIZATION_ID: process.env.ZOHO_BILLING_ORGANIZATION_ID,
    ZOHO_BILLING_AUTH_TOKEN: process.env.ZOHO_BILLING_AUTH_TOKEN,
    ZOHO_BILLING_WEBHOOK_SECRET: process.env.ZOHO_BILLING_WEBHOOK_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
