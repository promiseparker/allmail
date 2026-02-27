import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.userId = user.id;
        token.plan = (user as any).plan ?? "free";
      }

      // Refresh plan on subsequent calls
      if (token.userId && !token.plan) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          select: { plan: true },
        });
        if (dbUser) token.plan = dbUser.plan;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.plan = token.plan as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Ensure user record is up to date
      if (user?.id) {
        await db.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        }).catch(() => null); // Non-fatal
      }
    },
  },
};
