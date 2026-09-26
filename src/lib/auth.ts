import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Fetch user from DB if available
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              timezone: user.timezone,
            };
          }
        } catch {
          // Fallback demo user for dev
        }

        if (credentials.email && credentials.password.length >= 8) {
          return {
            id: "demo-user-id",
            email: credentials.email,
            name: credentials.email.split("@")[0],
            timezone: "UTC",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}
