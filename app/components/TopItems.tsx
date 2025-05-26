/*
  This is the file for getting the top songs and artists from the API and styling them (Tailwind CSS).
*/
"use client"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useEffect, useState } from "react"

const track_limit = 6
const artist_limit = 8

/* interfaces: for type checking and don't exist at runtime
define shape/structure of an object
no implementation details

i.e. an Artist must have a name property that is a string
*/

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

interface SpotifySession {
  token: {
    access_token: string
  }
}

interface SpotifyArtistItem {
  id: string
  name: string
}

// Three ranges that Spotify has data for: 4 weeks, 6 months, All Time
type TimeRange = "short_term" | "medium_term" | "long_term"

export default function TopItems() {
  // initial variables and setter functions
  const { data: session, status } = useSession() as {
    data: SpotifySession | null
    status: string
  }
  const [topItems, setTopItems] = useState<TopItems>({
    artists: [],
    tracks: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term")
  const [error, setError] = useState<string | null>(null)

  // React useEffect hook
  // effect update whenever session, timeRange changes
  useEffect(() => {
    // Reset state when session changes
    if (status === "unauthenticated") {
      setTopItems({ artists: [], tracks: [] })
      setLoading(false)
      setError(null)
      return
    }

    // fetching top items from spotify
    const fetchTopItems = async (range: TimeRange) => {
      // check valid spotify access token
      if (session?.token?.access_token) {
        try {
          // show loading state
          setLoading(true)
          setError(null)
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

          // handling error messages
          if (!artistsResponse.ok) {
            if (artistsResponse.status === 429) {
              setError(
                "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
              )
              setLoading(false)
              return
            } else if (artistsResponse.status === 401) {
              setError(
                "Your session has expired. Please sign out and sign in again."
              )
              setLoading(false)
              return
            }
            throw new Error(
              `Failed to fetch artists: ${artistsResponse.status}`
            )
          }

          const artistsData = await artistsResponse.json()
          console.log("Artists response:", artistsData)

          // API error handling
          if (artistsData.error) {
            console.error("Spotify API error:", artistsData.error)
            setError(
              `Spotify is temporarily unavailable. Please try again in a moment.`
            )
            setLoading(false)
            return
          }

          // Fetch complete artist details including genres
          const artistsWithDetails = await Promise.all(
            artistsData.items.map(async (artist: SpotifyArtistItem) => {
              console.log(
                "Fetching details for artist:",
                artist.name,
                "ID:",
                artist.id
              )
              const artistResponse = await fetch(
                `https://api.spotify.com/v1/artists/${artist.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${session.token.access_token}`,
                  },
                }
              )

              // rate limit/failure error handling
              if (!artistResponse.ok) {
                if (artistResponse.status === 429) {
                  console.warn(
                    `Rate limited for artist ${artist.name}, skipping...`
                  )
                  return null
                }
                console.warn(
                  `Failed to fetch details for artist ${artist.name}`
                )
                return null
              }

              const artistDetails = await artistResponse.json()
              console.log("Artist details response:", artistDetails)
              return artistDetails
            })
          )

          // Filter out null values from rate-limited requests
          const validArtists = artistsWithDetails.filter(
            (artist) => artist !== null
          )

          // Fetch top tracks
          const tracksResponse = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?limit=${track_limit}&time_range=${range}`,
            {
              headers: {
                Authorization: `Bearer ${session.token.access_token}`,
              },
            }
          )

          // top tracks error handling
          if (!tracksResponse.ok) {
            if (tracksResponse.status === 429) {
              setError(
                "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
              )
              setLoading(false)
              return
            } else if (tracksResponse.status === 401) {
              setError(
                "Your session has expired. Please sign out and sign in again."
              )
              setLoading(false)
              return
            }
            throw new Error(`Failed to fetch tracks: ${tracksResponse.status}`)
          }

          const tracksData = await tracksResponse.json()
          console.log("Tracks response:", tracksData)

          if (tracksData.error) {
            console.error("Spotify API error:", tracksData.error)
            setError(
              `Spotify is temporarily unavailable. Please try again in a moment.`
            )
            setLoading(false)
            return
          }

          setTopItems({
            artists: validArtists || [],
            tracks: tracksData.items || [],
          })
        } catch (error) {
          console.error("Error fetching top items:", error)
          setError(
            error instanceof Error ? error.message : "Failed to fetch top items"
          )
        } finally {
          setLoading(false)
        }
      } else {
        console.log("No session token available")
        setLoading(false)
      }
    }

    if (status === "authenticated" && session?.token?.access_token) {
      console.log("Session changed:", session)
      fetchTopItems(timeRange)
    }
  }, [session, timeRange, status])

  // loading and other error messages
  if (status === "loading" || loading) {
    return <div className="text-white">Loading top items...</div>
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-white">Please sign in to view your top items</div>
    )
  }

  // runs if there is an error, creates retry button
  if (error) {
    return (
      <div className="text-white">
        <div className="text-red-400 mb-4">Error: {error}</div>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      {/* Last 4 Weeks */}
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
        {/* Last 6 Weeks */}
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
        {/* All Time */}
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

      {/*
          Create one large div for the top artists and tracks
          which allows for display flex to be used
      */}
      <div className="flex justify-between">
        {/* Top Artists - created using a list*/}
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
                    <Image
                      src={artist.images[0].url}
                      alt={artist.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {artist.name}
                    </h3>
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

        {/* Top Tracks - created using a grid */}
        <div className="bg-gray-800 rounded-lg p-6 ml-3">
          <h2 className="text-2xl font-bold text-white mb-4">Top Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topItems.tracks && topItems.tracks.length > 0 ? (
              topItems.tracks.map((track, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  {track.album?.images?.[0] && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.name}
                      width={256}
                      height={256}
                      className="object-cover rounded-lg mb-2 m-auto"
                    />
                  )}
                  <h3 className="text-l font-semibold text-white mt-5">
                    {track.name}
                  </h3>
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
