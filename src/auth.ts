import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Facebook from 'next-auth/providers/facebook'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID!,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
        // Capture avatar from provider — each provider uses different field names
        token.picture =
          (profile as any).picture ??
          (profile as any).avatar_url ??
          (profile as any).image ??
          null
      }
      return token
    },
    async session({ session, token }) {
      // Expose provider info so the exchange route can upsert the Payload user
      ;(session as any).provider = token.provider
      ;(session as any).providerAccountId = token.providerAccountId
      ;(session as any).picture = token.picture
      return session
    },
  },
  // NextAuth session is intentionally short-lived — only bridges OAuth → Payload exchange
  session: {
    strategy: 'jwt',
    maxAge: 60 * 5, // 5 minutes
  },
})
