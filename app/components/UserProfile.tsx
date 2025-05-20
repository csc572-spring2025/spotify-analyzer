"use client"
import { useSession } from "next-auth/react" // useSession extracts the Session object
import { useEffect, useState } from "react"

// the following Typescript interfaces define the shape (properties and types) of different data structures
interface SpotifyProfile {
  display_name: string
  images: { url: string }[]
  followers: { total: number }
  country: string
  product: string
}

interface Track {
  duration_ms: number
  played_at?: string
}

interface SpotifySession {
  token: {
    access_token: string
  }
}

type TimeRange = "short_term" | "medium_term" | "long_term"

// exports a component UserProfile() with user data
export default function UserProfile() {
  const { data: session, status } = useSession() as { data: SpotifySession | null, status: string }  // get user data through useSession
  const [profile, setProfile] = useState<SpotifyProfile | null>(null) // store Spotify profile info
  const [loading, setLoading] = useState(true)  // is data still be fetched?
  const [error, setError] = useState<string | null>(null) // stores error messages
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term") // track selected time range for listening data
  const [listeningStats, setListeningStats] = useState({  // stores listening stats
    totalMinutes: 0,
    uniqueTracks: 0,
    averageTrackLength: 0,
  })

  // fetch data from Spotify
  useEffect(() => {
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
          throw new Error(`Profile fetch failed: ${profileResponse.status}`)
        }

        const profileData = await profileResponse.json()
        setProfile(profileData)

        // Fetch top tracks for the selected time range
        const topTracksResponse = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
          {
            headers: {
              Authorization: `Bearer ${session.token.access_token}`,
            },
          }
        )

        if (!topTracksResponse.ok) {
          throw new Error(`Top tracks fetch failed: ${topTracksResponse.status}`)
        }

        const topTracksData = await topTracksResponse.json()

        if (!topTracksData.items || !Array.isArray(topTracksData.items)) {
          throw new Error("Invalid tracks data received")
        }

        // Calculate statistics
        const tracks = topTracksData.items as Track[]
        const totalDuration = tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0)
        const averageTrackLength = tracks.length > 0 ? totalDuration / tracks.length : 0

        // Estimate total listening time based on track popularity and frequency
        const estimatedTotalMinutes = Math.round((totalDuration / 1000 / 60) * 2)

        setListeningStats({
          totalMinutes: estimatedTotalMinutes,
          uniqueTracks: tracks.length,
          averageTrackLength: Math.round(averageTrackLength / 1000 / 60),
        })
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
  }, [session, timeRange, status])

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
          <img
            src={profile.images[0].url}
            alt="Profile"
            className="w-24 h-24 rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">{profile.display_name}</h2>
          <p className="text-gray-300">Followers: {profile.followers?.total || 0}</p>
          <p className="text-gray-300">Country: {profile.country || "Unknown"}</p>
          <p className="text-gray-300">Account Type: {formatAccountType(profile.product)}</p>
        </div>
      </div>

      {/* Listening Stats Section */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Listening Statistics</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("short_term")}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === "short_term"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              4 Weeks
            </button>
            <button
              onClick={() => setTimeRange("medium_term")}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === "medium_term"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeRange("long_term")}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === "long_term"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              All Time
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {listeningStats.totalMinutes} min
            </p>
            <p className="text-gray-300 text-sm">Estimated listening time</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {listeningStats.uniqueTracks}
            </p>
            <p className="text-gray-300 text-sm">Top tracks</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {listeningStats.averageTrackLength} min
            </p>
            <p className="text-gray-300 text-sm">Average track length</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-2">
          * Estimates based on your top tracks and their durations
        </p>
      </div>
    </div>
  )
} 