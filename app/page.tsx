"use client"
import { useSession } from "next-auth/react"
import { signIn, signOut } from "next-auth/react"
import UserProfile from "./components/UserProfile"
import TopItems from "./components/TopItems"

export default function Home() {
  const { data: session } = useSession()

  console.log(session)

  if (session) {
    return (
      <div className="p-6 space-y-8">
        <UserProfile />
        <TopItems />
        <p
          className="opacity-70 mt-8 mb-5 underline cursor-pointer text-white"
          onClick={() => signOut()}
        >
          Sign Out
        </p>
      </div>
    )
  } else {
    return (
      <button
        onClick={() => signIn()}
        className="shadow-primary w-56 h-16 rounded-xl bg-white border-0 text-black text-3xl active:scale-[0.99] m-6"
      >
        Sign In
      </button>
    )
  }
}
