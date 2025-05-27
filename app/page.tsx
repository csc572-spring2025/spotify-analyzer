/*
  This file sets up a homepage for non-logged in users, a page for logged in users, and a log out button.
*/

"use client"
import { signOut, useSession } from "next-auth/react"
import ArtistDiscovery from "./components/ArtistDiscovery"
import HomePage from "./components/HomePage"
import TopItems from "./components/TopItems"
import UserProfile from "./components/UserProfile"
import ListeningAnalytics from "./components/ListeningAnalytics"
// import GenreTrends from "./components/GenreTrends"

export default function Home() {
  const { data: session } = useSession()

  console.log(session)

  // function that returns the user to the homepage if they sign out
  const handleSignOut = () => {
    signOut({
      callbackUrl: "/",
      redirect: true,
    })
  }

  // if the user is signed in, show the personalized page
  // if not, display the homepage
  if (session) {
    return (
      <div className="p-6 space-y-8">
        <UserProfile />
        <TopItems />
        <ArtistDiscovery />
        <ListeningAnalytics />
        {/* set up the sign out button */}
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
