import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { bootstrapWorkspaceForUser } from "@/lib/auth/workspace-bootstrap";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/resend/client";

export const auth = betterAuth({
  appName: "QuoteFlow",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendPasswordResetEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
        url,
        token,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
    },
  },
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await bootstrapWorkspaceForUser({
            id: user.id,
            name: user.name,
            email: user.email,
          });
        },
      },
    },
  },
});
