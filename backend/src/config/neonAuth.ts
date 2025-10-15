import { StackServerApp } from "@stackframe/stack";

// Initialize Stack Auth (Neon Auth)
if (
  !process.env.NEXT_PUBLIC_STACK_PROJECT_ID ||
  !process.env.STACK_SECRET_SERVER_KEY
) {
  throw new Error(
    "Missing Stack Auth environment variables. Please check NEXT_PUBLIC_STACK_PROJECT_ID and STACK_SECRET_SERVER_KEY"
  );
}

export const stackServerApp = new StackServerApp({
  tokenStore: "cookie", // Use generic cookie store, not nextjs-cookie (backend is Fastify, not Next.js)
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
});
