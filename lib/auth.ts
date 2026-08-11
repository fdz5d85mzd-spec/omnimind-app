import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isMasterEmail, isAdminEmail } from "@/lib/roles";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isMaster: boolean;
      isAdmin: boolean;
      impersonating?: { adminEmail: string } | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        const realEmail = session.user.email;
        const realIsMaster = isMasterEmail(realEmail);
        const realIsAdmin = isAdminEmail(realEmail);
        session.user.isMaster = realIsMaster;
        session.user.isAdmin = realIsAdmin;

        // Admin "view as user" -- only ever swaps identity when the *real*,
        // signed JWT belongs to a privileged account (checked above, before
        // any swap), so a forged/manually-set cookie on a non-admin session
        // does nothing. See lib/impersonation.ts + app/api/admin/impersonate.
        if (realIsMaster || realIsAdmin) {
          const impersonateId = cookies().get(IMPERSONATE_COOKIE)?.value;
          if (impersonateId && impersonateId !== session.user.id) {
            const target = await prisma.user.findUnique({
              where: { id: impersonateId },
              select: { id: true, email: true, name: true, image: true },
            });
            if (target) {
              session.user.impersonating = { adminEmail: realEmail ?? "" };
              session.user.id = target.id;
              session.user.email = target.email;
              session.user.name = target.name;
              session.user.image = target.image;
              session.user.isMaster = isMasterEmail(target.email);
              session.user.isAdmin = isAdminEmail(target.email);
            }
          }
        }
      }
      return session;
    },
  },
};
