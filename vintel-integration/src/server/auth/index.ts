// Clerk authentication will be configured here.

import NextAuth from "next-auth";
import { authOptions } from "./config";

// Initialize NextAuth with the configuration
export const auth = NextAuth(authOptions);

// Export type helpers
export type { Session } from "next-auth";
export type { DefaultSession } from "next-auth";
