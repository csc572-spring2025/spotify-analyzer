"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

let track_limit = 6
let artist_limit = 8

interface Artist {
  name: string
  images: { url: string }[]
  genres: string[]
}

interface Track {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
}

interface TopItems {
  artists: Artist[]
  tracks: Track[]
}

// Three ranges that Spotify has data for: 4 weeks, 6 months, All Time
type TimeRange = "short_term" | "medium_term" | "long_term"

export default function TopItems() {
  const { data: session } = useSession()
  const [topItems, setTopItems] = useState<TopItems>({ artists: [], tracks: [] })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term")

  const fetchTopItems = async (range: TimeRange) => {
    if (session?.token?.access_token) {
      try {
        setLoading(true)
        console.log("Fetching with token:", session.token.access_token)

        // Fetch top artists
        const artistsResponse = await fetch(
          `https://api.spotify.com/v1/me/top/artists?limit=${artist_limit}&time_range=${range}`,
          {
            headers: {
              Authorization: `Bearer ${session.token.access_token}`,
            },
          }
        )
        const artistsData = await artistsResponse.json()
        console.log("Artists response:", artistsData)

        // Fetch top tracks
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/me/top/tracks?limit=${track_limit}&time_range=${range}`,
          {
            headers: {
              Authorization: `Bearer ${session.token.access_token}`,
            },
          }
        )
        const tracksData = await tracksResponse.json()
        console.log("Tracks response:", tracksData)

        if (artistsData.error) {
          console.error("Spotify API error:", artistsData.error)
          return
        }

        if (tracksData.error) {
          console.error("Spotify API error:", tracksData.error)
          return
        }

        setTopItems({
          artists: artistsData.items || [],
          tracks: tracksData.items || [],
        })
      } catch (error) {
        console.error("Error fetching top items:", error)
      } finally {
        setLoading(false)
      }
    } else {
      console.log("No session token available")
    }
  }

  useEffect(() => {
    console.log("Session changed:", session)
    fetchTopItems(timeRange)
  }, [session, timeRange])

  if (loading) {
    return <div className="text-white">Loading top items...</div>
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => setTimeRange("short_term")}
          className={`px-4 py-2 rounded-lg ${
            timeRange === "short_term"
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Last 4 Weeks
        </button>
        <button
          onClick={() => setTimeRange("medium_term")}
          className={`px-4 py-2 rounded-lg ${
            timeRange === "medium_term"
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Last 6 Months
        </button>
        <button
          onClick={() => setTimeRange("long_term")}
          className={`px-4 py-2 rounded-lg ${
            timeRange === "long_term"
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          All Time
        </button>
      </div>

      <div className="flex justify-between">
        {/* Top Artists */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Top Artists</h2>
          {topItems.artists && topItems.artists.length > 0 ? (
            <ul className="space-y-3">
              {topItems.artists.map((artist, index) => (
                <li
                  key={index}
                  className="flex items-center space-x-4 bg-gray-700 rounded-lg p-3 w-100"
                >
                  {artist.images?.[0] && (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{artist.name}</h3>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-gray-300 text-sm">
                        {artist.genres.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-300">No artists found</p>
          )}
        </div>

        {/* Top Tracks */}
        <div className="bg-gray-800 rounded-lg p-6 ml-3">
          <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topItems.tracks && topItems.tracks.length > 0 ? (
              topItems.tracks.map((track, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  {track.album?.images?.[0] && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.name}
                      className="w-64 h-64 object-cover rounded-lg mb-2 m-auto"
                    />
                  )}
                  <h3 className="text-l font-semibold text-white mt-5">{track.name}</h3>
                  <p className="text-gray-300">
                    {track.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <p className="text-gray-400 text-xs">{track.album.name}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-300">No tracks found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
