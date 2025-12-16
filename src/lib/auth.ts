import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Only allow @mbrme.com emails
      if (user.email && user.email.endsWith('@mbrme.com')) {
        return true;
      }
      return false;
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin?error=AccessDenied',
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel/production
});

