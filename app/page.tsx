"use client"
import { useSession, signOut } from "next-auth/react"
import UserProfile from "./components/UserProfile"
import TopItems from "./components/TopItems"
import ArtistDiscovery from "./components/ArtistDiscovery"
import HomePage from "./components/HomePage"
// import GenreTrends from "./components/GenreTrends"

export default function Home() {
  const { data: session } = useSession()

  console.log(session)

  const handleSignOut = () => {
    signOut({
      callbackUrl: "/",
      redirect: true,
    })
  }

  if (session) {
    return (
      <div className="p-6 space-y-8">
        <UserProfile />
        <TopItems />
        <ArtistDiscovery />
        {/* <GenreTrends /> */}
        <div className="flex justify-center">
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  } else {
    return <HomePage />
  }
}
