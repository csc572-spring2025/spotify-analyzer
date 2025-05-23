// file to get data about the user profile, and then style

"use client"
import { useSession } from "next-auth/react" // useSession extracts the Session object
import { useEffect, useState } from "react"
import Image from "next/image"

// the following Typescript interfaces define the shape (properties and types) of different data structures
interface SpotifyProfile {
  display_name: string
  images: { url: string }[]
  followers: { total: number }
  country: string
  product: string
}

interface SpotifySession {
  token: {
    access_token: string
  }
}

// exports a component UserProfile() with user data
export default function UserProfile() {
  const { data: session, status } = useSession() as {
    data: SpotifySession | null
    status: string
  }
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // fetch data from Spotify
  useEffect(() => {
    // Reset state when session changes
    if (status === "unauthenticated") {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchProfile = async () => {
      if (!session?.token?.access_token) return

      try {
        setLoading(true)
        setError(null)

        // Fetch user profile
        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        })

        if (!profileResponse.ok) {
          if (profileResponse.status === 429) {
            setError(
              "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
            )
            setLoading(false)
            return
          } else if (profileResponse.status === 401) {
            setError(
              "Your session has expired. Please sign out and sign in again."
            )
            setLoading(false)
            return
          }
          throw new Error(`Profile fetch failed: ${profileResponse.status}`)
        }

        const profileData = await profileResponse.json()

        if (profileData.error) {
          setError(
            `Spotify is temporarily unavailable. Please try again in a moment.`
          )
          setLoading(false)
          return
        }

        setProfile(profileData)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [session, status])

  // different messages to show depending on the status of fetching the data
  if (status === "loading" || loading) {
    return <div className="text-white">Loading profile...</div>
  }

  if (status === "unauthenticated") {
    return <div className="text-white">Please sign in to view your profile</div>
  }

  if (error) {
    return <div className="text-white">Error: {error}</div>
  }

  if (!profile) {
    return <div className="text-white">No profile data available</div>
  }

  // format account type for display
  const formatAccountType = (type: string | undefined | null) => {
    if (!type) return "Unknown"
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // renders UI, styled using Tailwind CSS
  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4">
        {profile.images?.[0]?.url && (
          <Image
            src={profile.images[0].url}
            alt="Profile"
            width={96}
            height={96}
            className="rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">
            {profile.display_name}
          </h2>
          <p className="text-gray-300">
            Followers: {profile.followers?.total || 0}
          </p>
          <p className="text-gray-300">
            Country: {profile.country || "Unknown"}
          </p>
          <p className="text-gray-300">
            Account Type: {formatAccountType(profile.product)}
          </p>
        </div>
      </div>
    </div>
  )
}
