"use client"
import { useSession } from "next-auth/react"
import { signIn, signOut } from "next-auth/react"
import UserProfile from "./components/UserProfile"
import TopItems from "./components/TopItems"
import ArtistDiscovery from "./components/ArtistDiscovery"
import MoodTrends from "./components/MoodTrends"
import SignOutButton from "./components/SignOutButton"
// import GenreTrends from "./components/GenreTrends"

export default function Home() {
  const { data: session } = useSession()

  console.log(session)

  if (session) {
    return (
      <div className="p-6 space-y-8">
        <UserProfile />
        <TopItems />
        <ArtistDiscovery />
        <MoodTrends />
        {/* <GenreTrends /> */}
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    )
  } else {
    return (
      <button
        onClick={() => signIn("spotify")}
        className="shadow-primary w-56 h-16 rounded-xl bg-white border-0 text-black text-3xl active:scale-[0.99] m-6"
      >
        Sign In
      </button>
    )
  }
}
