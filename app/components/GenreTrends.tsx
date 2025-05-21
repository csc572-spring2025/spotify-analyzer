"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface Artist {
  name: string
  genres: string[]
}

interface GenreStats {
  genre: string
  count: number
  artists: string[]
}

type TimeRange = "short_term" | "medium_term" | "long_term"

export default function GenreTrends() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [genreStats, setGenreStats] = useState<{
    [key in TimeRange]: GenreStats[]
  }>({
    short_term: [],
    medium_term: [],
    long_term: [],
  })

  const fetchArtists = async (range: TimeRange) => {
    if (!session?.token?.access_token) return

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        }
      )
      const data = await response.json()

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
          return await artistResponse.json()
        })
      )

      // Process genres, skipping artists with no genres
      const genreMap = new Map<string, { count: number; artists: string[] }>()
      
      artistsWithDetails.forEach((artist: Artist) => {
        if (artist.genres && artist.genres.length > 0) {
          artist.genres.forEach((genre) => {
            if (!genreMap.has(genre)) {
              genreMap.set(genre, { count: 0, artists: [] })
            }
            const current = genreMap.get(genre)!
            current.count++
            current.artists.push(artist.name)
          })
        }
      })

      // Convert to array and sort by count
      const stats = Array.from(genreMap.entries())
        .map(([genre, data]) => ({
          genre,
          count: data.count,
          artists: data.artists,
        }))
        .sort((a, b) => b.count - a.count)

      setGenreStats((prev) => ({
        ...prev,
        [range]: stats,
      }))
    } catch (error) {
      console.error(`Error fetching ${range} artists:`, error)
    }
  }

  useEffect(() => {
    if (session?.token?.access_token) {
      setLoading(true)
      Promise.all([
        fetchArtists("short_term"),
        fetchArtists("medium_term"),
        fetchArtists("long_term"),
      ]).finally(() => setLoading(false))
    }
  }, [session])

  if (loading) {
    return <div className="text-white">Loading genre trends...</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-4">Genre Trends</h2>
      
      {/* Last 4 Weeks */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Last 4 Weeks</h3>
        <div className="space-y-4">
          {genreStats.short_term.map((stat, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">{stat.genre}</h4>
                <span className="text-gray-300">{stat.count} artists</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Top artists: {stat.artists.slice(0, 3).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Last 6 Months */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Last 6 Months</h3>
        <div className="space-y-4">
          {genreStats.medium_term.map((stat, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">{stat.genre}</h4>
                <span className="text-gray-300">{stat.count} artists</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Top artists: {stat.artists.slice(0, 3).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All Time */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">All Time</h3>
        <div className="space-y-4">
          {genreStats.long_term.map((stat, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">{stat.genre}</h4>
                <span className="text-gray-300">{stat.count} artists</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Top artists: {stat.artists.slice(0, 3).join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 