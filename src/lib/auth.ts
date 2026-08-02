import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await findUserByEmail(credentials.email.toLowerCase());
        if (!user || !user.is_active) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.full_name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
     async jwt({ token, user }) {
       if (user) {
         token.role = (user as { role: "teacher" | "admin_officer" }).role;
       }
       return token;
     },
     async session({ session, token }) {
       if (session.user) {
         session.user.role = token.role;
         session.user.id = token.sub;
       }
       return session;
     },
   },
};
