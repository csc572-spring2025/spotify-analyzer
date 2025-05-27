
/*
This file is used to display some graphs of the general listening analytics for the user.
*/

"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { format, subDays, startOfDay } from 'date-fns'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Track {
  played_at: string
  track: {
    duration_ms: number
    artists: { name: string }[]
    name: string
  }
}

interface GenreListeningData {
  [genre: string]: number
}

interface DailyListeningData {
  [date: string]: number
}

interface SpotifySession {
  token: {
    access_token: string
  }
}

export default function ListeningAnalytics() {
  const { data: session, status } = useSession() as {
    data: SpotifySession | null
    status: string
  }
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyListening, setDailyListening] = useState<DailyListeningData>({})
  const [genreListening, setGenreListening] = useState<GenreListeningData>({})

  // Fetch recently played tracks and calculate listening time
  const fetchListeningData = async () => {
    if (!session?.token?.access_token) return

    try {
      setLoading(true)
      setError(null)

      // Get recently played tracks (last 50)
      const recentlyPlayedResponse = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        }
      )

      if (!recentlyPlayedResponse.ok) {
        if (recentlyPlayedResponse.status === 429) {
          setError("Rate limited. Please try again in a few seconds.")
          return
        } else if (recentlyPlayedResponse.status === 401) {
          setError("Session expired. Please sign out and sign in again.")
          return
        }
        throw new Error(`Failed to fetch recently played: ${recentlyPlayedResponse.status}`)
      }

      const recentlyPlayedData = await recentlyPlayedResponse.json()

      if (recentlyPlayedData.error) {
        setError("Spotify is temporarily unavailable. Please try again.")
        return
      }

      // Process daily listening data
      const dailyData: DailyListeningData = {}
      const genreData: GenreListeningData = {}

      // Initialize last 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const date = format(startOfDay(subDays(new Date(), i)), 'yyyy-MM-dd')
        dailyData[date] = 0
      }

      // Get artist details for genre information
      const artistIds = new Set<string>()
      recentlyPlayedData.items?.forEach((item: Track) => {
        item.track.artists.forEach(artist => {
          if (artist.name) {
            artistIds.add(artist.name)
          }
        })
      })

      // Fetch top artists to get genre data (as a proxy for genre listening)
      const topArtistsResponse = await fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term",
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        }
      )

      let artistGenreMap: { [artistName: string]: string[] } = {}
      
      if (topArtistsResponse.ok) {
        const topArtistsData = await topArtistsResponse.json()
        
        // Create a map of artist names to their genres
        topArtistsData.items?.forEach((artist: any) => {
          artistGenreMap[artist.name] = artist.genres || []
        })
      }

      // Process the recently played tracks
      recentlyPlayedData.items?.forEach((item: Track) => {
        const playedDate = format(new Date(item.played_at), 'yyyy-MM-dd')
        const durationMinutes = item.track.duration_ms / (1000 * 60) // Convert to minutes

        // Add to daily listening data
        if (dailyData.hasOwnProperty(playedDate)) {
          dailyData[playedDate] += durationMinutes
        }

        // Add to genre listening data
        item.track.artists.forEach(artist => {
          const genres = artistGenreMap[artist.name] || ['Unknown']
          genres.forEach(genre => {
            if (!genreData[genre]) {
              genreData[genre] = 0
            }
            genreData[genre] += durationMinutes
          })
        })
      })

      setDailyListening(dailyData)
      setGenreListening(genreData)

    } catch (error) {
      console.error("Error fetching listening data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch listening data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      setDailyListening({})
      setGenreListening({})
      setLoading(false)
      setError(null)
      return
    }

    if (status === "authenticated" && session?.token?.access_token) {
      fetchListeningData()
    }
  }, [session, status])

  // Prepare data for daily listening line chart
  const dailyChartData = {
    labels: Object.keys(dailyListening).map(date => format(new Date(date), 'MMM dd')),
    datasets: [
      {
        label: 'Listening Time (minutes)',
        data: Object.values(dailyListening),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  }

  // Prepare data for genre listening bar chart
  const sortedGenres = Object.entries(genreListening)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Top 10 genres

  const genreChartData = {
    labels: sortedGenres.map(([genre]) => genre),
    datasets: [
      {
        label: 'Listening Time (minutes)',
        data: sortedGenres.map(([, time]) => time),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(20, 184, 166)',
          'rgb(251, 146, 60)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
      title: {
        color: 'white',
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  }

  if (status === "loading" || loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Listening Analytics</h2>
        <div className="text-white">Loading your listening data...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Listening Analytics</h2>
        <div className="text-white">Please sign in to view your listening analytics</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Listening Analytics</h2>
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={() => {
            setError(null)
            fetchListeningData()
          }}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Listening Analytics</h2>
      
      <div className="space-y-8">
        {/* Daily Listening Time Chart */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">Daily Listening Time (Last 30 Days)</h3>
          <div className="h-64">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Genre Listening Time Chart */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">Listening Time by Genre</h3>
          <div className="h-64">
            <Bar data={genreChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
} 