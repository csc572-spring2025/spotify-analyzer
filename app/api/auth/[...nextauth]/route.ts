import NextAuth from "next-auth/next"
import { type NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

// use NextAuth to authorize access to spotify data
const options: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      /*
      user-read-recently-played: access most recently played tracks
      user-read-currently-playing
      user-read-playback-state
      user-modify-playback-state
      */
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-private,playlist-modify-private,playlist-modify-public,user-top-read,user-read-private,user-read-recently-played,user-read-playback-state,user-read-currently-playing",
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    // store spotify access token in JSON Web Token
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token
      }
      return token
    },
    // adds token to session
    async session({ session, token }) {
      return {
        ...session,
        token,
      }
    },
  },
}

const handler = NextAuth(options)

export { handler as GET, handler as POST }
