"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface Artist {
  id: string
  name: string
  images: { url: string }[]
  genres: string[]
  popularity: number
}

interface DiscoveryArtist extends Artist {
  reason: string
  relatedTo?: string
  genres: string[]
}

export default function ArtistDiscovery() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discoveredArtist, setDiscoveredArtist] = useState<DiscoveryArtist | null>(null)
  const [userTopGenres, setUserTopGenres] = useState<string[]>([])
  const [userTopArtists, setUserTopArtists] = useState<Artist[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

  // Fetch user's top artists and their genres
  const fetchUserTopArtists = async () => {
    if (!session?.token?.access_token) {
      setError("No session token available")
      setInitialLoading(false)
      return
    }

    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=25&time_range=medium_term",
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch top artists: ${response.status}`)
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        setError("No top artists found")
        setInitialLoading(false)
        return
      }

      // Get complete artist details including genres
      const artistsWithDetails = await Promise.all(
        data.items.map(async (artist: any) => {
          const artistResponse = await fetch(
            `https://api.spotify.com/v1/artists/${artist.id}`,
            {
              headers: {
                Authorization: `Bearer ${session.token.access_token}`,
              },
            }
          )
          if (!artistResponse.ok) {
            throw new Error(`Failed to fetch artist details: ${artistResponse.status}`)
          }
          return await artistResponse.json()
        })
      )

      setUserTopArtists(artistsWithDetails)

      // Extract and count genres
      const genreMap = new Map<string, number>()
      artistsWithDetails.forEach((artist: Artist) => {
        artist.genres.forEach((genre) => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1)
        })
      })

      // Get top 5 genres
      const topGenres = Array.from(genreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre)

      setUserTopGenres(topGenres)
      setError(null)
    } catch (error) {
      console.error("Error fetching top artists:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch top artists")
    } finally {
      setInitialLoading(false)
    }
  }

  // Get a random artist from the selected genre
  const getRandomArtistFromGenre = async (genre: string) => {
    if (!session?.token?.access_token) {
      setError("No session token available")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSelectedGenre(genre)

      // Search for artists in the selected genre
      const searchUrl = new URL('https://api.spotify.com/v1/search')
      searchUrl.searchParams.append('q', `genre:"${genre}"`)
      searchUrl.searchParams.append('type', 'artist')
      searchUrl.searchParams.append('limit', '50') // Increased limit for more variety
      searchUrl.searchParams.append('market', 'US')

      console.log("Searching artists with URL:", searchUrl.toString())
      
      const response = await fetch(
        searchUrl.toString(),
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
            'Content-Type': 'application/json',
            },
          }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Search API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: searchUrl.toString()
        })
        throw new Error(`Failed to search for artists in genre ${genre}`)
      }

      const data = await response.json()
      console.log("Search response:", data)

      if (!data.artists || !data.artists.items || data.artists.items.length === 0) {
        throw new Error(`No artists found in genre ${genre}`)
      }

      // Filter out artists that are in user's top artists
      const newArtists = data.artists.items.filter(
        (artist: Artist) => artist && artist.id && !userTopArtists.some((top) => top.id === artist.id)
      )

      if (newArtists.length === 0) {
        throw new Error(`No new artists found in genre ${genre}`)
      }

      // Pick a random artist from the search results
      const randomArtist = newArtists[Math.floor(Math.random() * newArtists.length)]
      
      if (!randomArtist.id) {
        throw new Error("Invalid artist data received")
      }

      console.log("Selected random artist from search:", randomArtist.name, "ID:", randomArtist.id)
      
      // Get complete artist details
      const artistDetailsUrl = `https://api.spotify.com/v1/artists/${encodeURIComponent(randomArtist.id)}`
      console.log("Fetching artist details from:", artistDetailsUrl)
      
      const artistResponse = await fetch(
        artistDetailsUrl,
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
            'Content-Type': 'application/json',
            },
          }
      )

      if (!artistResponse.ok) {
        throw new Error(`Failed to get details for ${randomArtist.name}`)
      }

      const fullArtistDetails = await artistResponse.json()
      console.log("Artist details response:", fullArtistDetails)

      if (!fullArtistDetails || !fullArtistDetails.id) {
        throw new Error("Invalid artist details received")
      }

      // Find common genres
      const commonGenres = fullArtistDetails.genres.filter((g: string) =>
        userTopGenres.includes(g)
      )

      setDiscoveredArtist({
        ...fullArtistDetails,
        reason: commonGenres.length > 0
          ? `Shares genres with your favorites: ${commonGenres.join(", ")}`
          : `Discovered in your selected genre: ${genre}`,
      })

    } catch (error) {
      console.error("Error in getRandomArtistFromGenre:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch artist")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.token?.access_token) {
      fetchUserTopArtists()
    }
  }, [session])

  if (initialLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
        <div className="text-white">Loading your top artists...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchUserTopArtists}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Artist Discovery</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Select a Genre</h3>
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
            onClick={() => selectedGenre && getRandomArtistFromGenre(selectedGenre)}
            disabled={loading || !selectedGenre}
            className={`px-6 py-2 bg-green-500 text-white rounded-lg transition-colors ${
              (loading || !selectedGenre) ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
            }`}
          >
            {loading ? "Finding..." : "Discover New Artist"}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-white">Finding new artists...</div>
      ) : discoveredArtist ? (
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            {discoveredArtist.images?.[0] && (
              <img
                src={discoveredArtist.images[0].url}
                alt={discoveredArtist.name}
                className="w-32 h-32 rounded-lg"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold text-white">{discoveredArtist.name}</h3>
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
        <p className="text-gray-300">Select a genre and click "Discover New Artist" to find new music!</p>
      )}
    </div>
  )
} 