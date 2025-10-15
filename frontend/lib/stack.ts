import { StackServerApp } from "@stackframe/stack";

// Initialize Stack Auth client for Next.js
export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    afterSignIn: "/dashboard",
    afterSignUp: "/dashboard",
    afterSignOut: "/",
  },
});
