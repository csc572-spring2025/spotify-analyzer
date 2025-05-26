/*
This file contains the code for the Discover Artist feature: 
- Get recommended a random new artist based on your top 5 listening genres (you select one)
*/

"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Image from "next/image"

// Define basic data structure for Artist object (returned by Spotify)
interface Artist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  popularity: number
}

// Extends Artist object with extra discovery info
interface DiscoveryArtist extends Artist {
  reason: string
  relatedTo?: string
  genres: string[]
}

// Session object from NextAuth with access token used to authenticate Spotify API requests
interface SpotifySession {
  token: {
    access_token: string
  }
}

// Raw Artist item (structure returned by search/top artists function in Spotify)
interface SpotifyArtistItem {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  popularity: number
}

/* 
Main component for the ArtistDiscovery feature
- Fetches top 25 artists, extracts top 5 genres from these artists
- Lets users select one of these top 5 genres
- Displays a random new artist in the selected genre
*/
export default function ArtistDiscovery() {
  // Get spotify access token from Session
  const { data: session, status } = useSession() as {
    data: SpotifySession | null
    status: string
  }
  // Component state
  const [loading, setLoading] = useState(false) // tracks if app is currently fetching a new artist
  const [initialLoading, setInitialLoading] = useState(true) // tracks if app is still loading
  const [error, setError] = useState<string | null>(null) // stores any error message
  const [discoveredArtist, setDiscoveredArtist] =
    useState<DiscoveryArtist | null>(null) // store most recently discovered artist or null
  const [userTopGenres, setUserTopGenres] = useState<string[]>([]) // array of user's top genres
  const [userTopArtists, setUserTopArtists] = useState<Artist[]>([]) // array of user's top artists
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null) // genre user selects to discover new artists in

  // What to do based on the authentication status
  useEffect(() => {
    // Reset state when session changes
    if (status === "unauthenticated") {
      setDiscoveredArtist(null)
      setUserTopGenres([])
      setUserTopArtists([])
      setSelectedGenre(null)
      setInitialLoading(false)
      setError(null)
      return
    }

    // Fetch user's top artists and their genres
    const fetchUserTopArtists = async () => {
      // Check if there is a valid access token
      if (!session?.token?.access_token) {
        setError("No session token available")
        setInitialLoading(false)
        return
      }

      try {
        setError(null) // Reset any previous errors
        // Get top artists
        const response = await fetch(
          "https://api.spotify.com/v1/me/top/artists?limit=25&time_range=medium_term",
          {
            headers: {
              Authorization: `Bearer ${session.token.access_token}`,
            },
          }
        )

        // Error handling and error messages
        if (!response.ok) {
          if (response.status === 429) {
            setError(
              "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
            )
            setInitialLoading(false)
            return
          } else if (response.status === 401) {
            setError(
              "Your session has expired. Please sign out and sign in again."
            )
            setInitialLoading(false)
            return
          }
          throw new Error(`Failed to fetch top artists: ${response.status}`)
        }

        const data = await response.json()

        // More error work: if Spotify returns an error object as a response
        if (data.error) {
          setError(
            `Spotify is temporarily unavailable. Please try again in a moment.`
          )
          setInitialLoading(false)
          return
        }

        // More error work: no data returned (or not enough listening data collected for the user)
        if (!data.items || data.items.length === 0) {
          setError("No top artists found")
          setInitialLoading(false)
          return
        }

        // Get complete artist details including genres with rate limiting protection
        const artistsWithDetails = await Promise.all(
          data.items.map(async (artist: SpotifyArtistItem) => {
            try {
              const artistResponse = await fetch(
                `https://api.spotify.com/v1/artists/${artist.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${session.token.access_token}`,
                  },
                }
              )
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
              return await artistResponse.json()
            } catch (error) {
              console.warn(
                `Failed to fetch details for artist ${artist.name}:`,
                error
              )
              return null
            }
          })
        )

        // Filter out null values from rate-limited or failed requests
        const validArtists = artistsWithDetails.filter(
          (artist) => artist !== null
        )

        if (validArtists.length === 0) {
          setError(
            "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
          )
          setInitialLoading(false)
          return
        }

        setUserTopArtists(validArtists) // Save top artists to state

        // Extract and count genres
        const genreMap = new Map<string, number>()
        validArtists.forEach((artist: Artist) => {
          artist.genres.forEach((genre) => {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1)
          })
        })

        // Get top 5 genres
        const topGenres = Array.from(genreMap.entries())
          .sort((a, b) => b[1] - a[1]) // Sort by frequency
          .slice(0, 5) // Take top 5
          .map(([genre]) => genre) // Extract genre names from top 5

        setUserTopGenres(topGenres) // Save to state
        setError(null)
      } catch (error) {
        console.error("Error fetching top artists:", error)
        setError(
          error instanceof Error ? error.message : "Failed to fetch top artists"
        )
      } finally {
        setInitialLoading(false) // Mark loading as done
      }
    }

    if (status === "authenticated" && session?.token?.access_token) {
      fetchUserTopArtists()
    }
  }, [session, status])

  // Get a random artist from the selected genre
  const getRandomArtistFromGenre = async (genre: string) => {
    // Check if there is a valid access token
    if (!session?.token?.access_token) {
      setError("No session token available")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSelectedGenre(genre) // Save selected genre to state

      // Search for artists in the selected genre, building a query
      const searchUrl = new URL("https://api.spotify.com/v1/search")
      searchUrl.searchParams.append("q", `genre:"${genre}"`)
      searchUrl.searchParams.append("type", "artist")
      searchUrl.searchParams.append("limit", "50") // max 50 results
      searchUrl.searchParams.append("market", "US") // in the US market

      console.log("Searching artists with URL:", searchUrl.toString())

      const response = await fetch(searchUrl.toString(), {
        headers: {
          Authorization: `Bearer ${session.token.access_token}`,
          "Content-Type": "application/json",
        },
      })

      // Error handling 
      if (!response.ok) {
        if (response.status === 429) {
          setError(
            "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
          )
          setLoading(false)
          return
        } else if (response.status === 401) {
          setError(
            "Your session has expired. Please sign out and sign in again."
          )
          setLoading(false)
          return
        }
        const errorText = await response.text()
        console.error("Search API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: searchUrl.toString(),
        })
        setError(`Failed to search for artists in genre ${genre}`)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("Search response:", data)

      if (data.error) {
        setError(
          `Spotify is temporarily unavailable. Please try again in a moment.`
        )
        setLoading(false)
        return
      }

      if (
        !data.artists ||
        !data.artists.items ||
        data.artists.items.length === 0
      ) {
        throw new Error(`No artists found in genre ${genre}`)
      }

      // Filter out artists that are in user's top artists
      const newArtists = data.artists.items.filter(
        (artist: Artist) =>
          artist &&
          artist.id &&
          !userTopArtists.some((top) => top.id === artist.id)
      )

      if (newArtists.length === 0) {
        throw new Error(`No new artists found in genre ${genre}`)
      }

      // Pick a random artist from the search results
      const randomArtist =
        newArtists[Math.floor(Math.random() * newArtists.length)]

      if (!randomArtist.id) {
        throw new Error("Invalid artist data received")
      }

      console.log(
        "Selected random artist from search:",
        randomArtist.name,
        "ID:",
        randomArtist.id
      )

      // Get complete artist details
      const artistDetailsUrl = `https://api.spotify.com/v1/artists/${encodeURIComponent(
        randomArtist.id
      )}`
      console.log("Fetching artist details from:", artistDetailsUrl)

      const artistResponse = await fetch(artistDetailsUrl, {
        headers: {
          Authorization: `Bearer ${session.token.access_token}`,
          "Content-Type": "application/json",
        },
      })

      // More error handling: rate limit and session expiration
      if (!artistResponse.ok) {
        if (artistResponse.status === 429) {
          setError(
            "Please wait a moment - we're getting your data too quickly. Try again in a few seconds."
          )
          setLoading(false)
          return
        } else if (artistResponse.status === 401) {
          setError(
            "Your session has expired. Please sign out and sign in again."
          )
          setLoading(false)
          return
        }
        setError(`Failed to get details for ${randomArtist.name}`)
        setLoading(false)
        return
      }

      const fullArtistDetails = await artistResponse.json()
      console.log("Artist details response:", fullArtistDetails)

      if (!fullArtistDetails || !fullArtistDetails.id) { // if response is invalid
        setError("Invalid artist data received")
        setLoading(false)
        return
      }

      if (fullArtistDetails.error) {
        setError(
          `Spotify is temporarily unavailable. Please try again in a moment.`
        )
        setLoading(false)
        return
      }

      // Find common genres between new artist's genres and user's genres
      const commonGenres = fullArtistDetails.genres.filter((g: string) =>
        userTopGenres.includes(g)
      )

      // Save discovered artist to state
      setDiscoveredArtist({
        ...fullArtistDetails,
        reason:
          commonGenres.length > 0
            ? `Shares genres with your favorites: ${commonGenres.join(", ")}`
            : `Discovered in your selected genre: ${genre}`,
      })
    } catch (error) {
      console.error("Error in getRandomArtistFromGenre:", error)
      setError(
        error instanceof Error ? error.message : "Failed to fetch artist"
      )
    } finally {
      setLoading(false) // Set loading state to done
    }
  }

  // Handles retries by clearing errors and triggering the fetching
  const handleRetry = () => {
    setError(null)
    setInitialLoading(true)
    // The useEffect will handle the actual fetching by reacting to the setInitialLoading state
  }

  // Display loading state
  if (status === "loading" || initialLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
        <div className="text-white">Loading your top artists...</div>
      </div>
    )
  }

  // Display prompt for user to sign in if not signed in
  if (status === "unauthenticated") {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
        <div className="text-white">Please sign in to discover new artists</div>
      </div>
    )
  }

  // Show error message and retry button if request fails
  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // The main interface for Arist Discovery display and genre selection
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>

      { /* Genre selection menu */ }
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          Select a Genre
        </h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedGenre || ""}
            onChange={(e) => setSelectedGenre(e.target.value)} 
            className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          >
            <option value="">Choose a genre...</option>
            {userTopGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              selectedGenre && getRandomArtistFromGenre(selectedGenre)
            }
            disabled={loading || !selectedGenre}
            className={`px-6 py-2 bg-green-500 text-white rounded-lg transition-colors ${
              loading || !selectedGenre
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-green-600"
            }`}
          >
            {loading ? "Finding..." : "Discover New Artist"}
          </button>
        </div>
      </div>

      { /* If loading, show loading message, otherwise display new artist info */ }
      {loading ? (
        <div className="text-white">Finding new artists...</div> 
      ) : discoveredArtist ? (
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            {discoveredArtist.images?.[0] && (
              <Image
                src={discoveredArtist.images[0].url}
                alt={discoveredArtist.name}
                width={128}
                height={128}
                className="rounded-lg"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold text-white">
                {discoveredArtist.name}
              </h3>
              <p className="text-gray-300 mt-2">{discoveredArtist.reason}</p>
              {discoveredArtist.genres.length > 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  Genres: {discoveredArtist.genres.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-300">
          Select a genre and click &quot;Discover New Artist&quot; to find new
          music!
        </p>
      )}
    </div>
  )
}
