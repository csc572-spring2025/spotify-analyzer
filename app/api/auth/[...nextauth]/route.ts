/*
Configures NextAuth.js to authenticate users using SpotifyProvider (Spotify's authorization provider)
*/

import NextAuth from "next-auth/next"
import { type NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"

// use NextAuth to authorize access to spotify data
const options: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      /*
      - authorization: defines scope of authoritzation (what information our webapp can access):
        - user-read-email: access user's email address
        - playlist-read-private/modify-private/modify-public: manage playlists
        - user-top-read: access top artists/tracks
      - clientID: get client ID from .env
      - clientSecret: get client Secret from .env
      */
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-private,playlist-modify-private,playlist-modify-public,user-top-read,user-read-private,user-read-recently-played,user-read-playback-state,user-read-currently-playing",
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
    }),
  ],
  pages: { // redirects user to root URL for sign in and any errors
    signIn: "/",
    error: "/",
  },
  session: { // use JSON web tokens (jwt) to store the Session (objects containing login info), expires after 1 hour
    strategy: "jwt",
    maxAge: 60 * 60, // users have to re-authenticate after 1 hour
  },
  callbacks: {
    // functions that are called when a certain action is performed
    // called when a JSON web token (jwt) is created or updated
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token // stores access token in a JWT
        token.expires_at = account.expires_at // store when token expires
      }
      return token // the token is automatically encrypted and stored as a cookie by NextAuth
    },
    // called when a session is created
    async session({ session, token }) {
      // adds JWT token to the session
      return {
        ...session,
        token,
      }
    },
  },
}

// create and export the NextAuth request handler with the options above
const handler = NextAuth(options)

export { handler as GET, handler as POST }
