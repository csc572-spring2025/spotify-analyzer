"use client"
import { signOut } from "next-auth/react"

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      Sign Out
    </button>
  )
} 