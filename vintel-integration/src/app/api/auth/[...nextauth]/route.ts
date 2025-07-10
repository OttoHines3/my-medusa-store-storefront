import { auth } from "~/server/auth";

// This handles all auth requests
export const { GET, POST } = auth.handlers;
