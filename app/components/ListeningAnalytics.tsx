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
    id: string
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

interface HourlyListeningData {
  [hour: string]: number
}

interface MoodData {
  date: string
  valence: number
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
  const [hourlyListening, setHourlyListening] = useState<HourlyListeningData>({})

  // Fetch recently played tracks with pagination to get more comprehensive data
  const fetchListeningData = async () => {
    if (!session?.token?.access_token) return

    try {
      setLoading(true)
      setError(null)

      const dailyData: DailyListeningData = {}
      const genreData: GenreListeningData = {}
      const hourlyData: HourlyListeningData = {}

      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const date = format(startOfDay(subDays(new Date(), i)), 'yyyy-MM-dd')
        dailyData[date] = 0
      }

      // Initialize 24 hours with 0
      for (let i = 0; i < 24; i++) {
        hourlyData[i.toString().padStart(2, '0')] = 0
      }

      // Fetch recently played tracks with pagination (no time filter)
      let allTracks: Track[] = []
      let nextUrl: string | null = `https://api.spotify.com/v1/me/player/recently-played?limit=50`
      let requestCount = 0
      const maxRequests = 5

      while (nextUrl && requestCount < maxRequests) {
        const response: Response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 429) {
            setError("Rate limited. Please try again in a few seconds.")
            return
          } else if (response.status === 401) {
            setError("Session expired. Please sign out and sign in again.")
            return
          }
          throw new Error(`Failed to fetch recently played: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          setError("Spotify is temporarily unavailable. Please try again.")
          return
        }

        if (data.items) {
          allTracks = [...allTracks, ...data.items]
        }

        nextUrl = data.next
        requestCount++
        
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Filter tracks to last 7 days and remove duplicates
      const sevenDaysAgo = subDays(new Date(), 7)
      const uniqueTracks = new Map()
      
      allTracks.forEach((item: Track) => {
        const playedAt = new Date(item.played_at)
        if (playedAt >= sevenDaysAgo) {
          const key = `${item.played_at}-${item.track.name}`
          if (!uniqueTracks.has(key)) {
            uniqueTracks.set(key, item)
          }
        }
      })

      const filteredTracks = Array.from(uniqueTracks.values())

      // Get unique track IDs for audio features
      const trackIds = [...new Set(filteredTracks.map((item: Track) => item.track.id))]
      
      // Fetch audio features for tracks (batch request)
      let audioFeatures: { [trackId: string]: any } = {}
      
      if (trackIds.length > 0) {
        console.log(`Fetching audio features for ${trackIds.length} tracks`)
        
        // Spotify allows up to 100 track IDs per request
        const batchSize = 100
        for (let i = 0; i < trackIds.length; i += batchSize) {
          const batch = trackIds.slice(i, i + batchSize)
          const featuresResponse = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${batch.join(',')}`,
            {
              headers: {
                Authorization: `Bearer ${session.token.access_token}`,
              },
            }
          )

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json()
            console.log(`Audio features response:`, featuresData)
            
            featuresData.audio_features?.forEach((feature: any) => {
              if (feature && feature.id) {
                audioFeatures[feature.id] = feature
                console.log(`Track ${feature.id} valence: ${feature.valence}`)
              }
            })
          } else {
            console.error(`Failed to fetch audio features: ${featuresResponse.status}`)
          }

          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`Total audio features collected: ${Object.keys(audioFeatures).length}`)

      // Get artist genre data (existing code)
      const artistNames = new Set<string>()
      filteredTracks.forEach((item: Track) => {
        item.track.artists.forEach(artist => {
          if (artist.name) {
            artistNames.add(artist.name)
          }
        })
      })

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
        topArtistsData.items?.forEach((artist: any) => {
          artistGenreMap[artist.name] = artist.genres || []
        })
      }

      // Process all tracks
      filteredTracks.forEach((item: Track) => {
        const playedAt = new Date(item.played_at)
        const playedDate = format(playedAt, 'yyyy-MM-dd')
        const playedHour = format(playedAt, 'HH')
        const durationMinutes = item.track.duration_ms / (1000 * 60)

        // Daily listening data
        if (dailyData.hasOwnProperty(playedDate)) {
          dailyData[playedDate] += durationMinutes
        }

        // Hourly listening data
        if (hourlyData.hasOwnProperty(playedHour)) {
          hourlyData[playedHour] += durationMinutes
        }

        // Genre data (existing code)
        item.track.artists.forEach(artist => {
          const genres = artistGenreMap[artist.name] || ['Unknown']
          genres.forEach(genre => {
            if (!genreData[genre]) {
              genreData[genre] = 0
            }
            genreData[genre] += durationMinutes / genres.length
          })
        })
      })

      console.log(`Processed ${filteredTracks.length} tracks from the last 7 days`)
      setDailyListening(dailyData)
      setGenreListening(genreData)
      setHourlyListening(hourlyData)

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
      setHourlyListening({})
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

  // Prepare data for hourly listening bar chart
  const hourlyChartData = {
    labels: Object.keys(hourlyListening).map(hour => `${hour}:00`),
    datasets: [
      {
        label: 'Listening Time (minutes)',
        data: Object.values(hourlyListening),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
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
          <h3 className="text-xl font-semibold text-white mb-4">Daily Listening Time (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Hourly Listening Time Chart */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">Listening Time by Hour of Day</h3>
          <div className="h-64">
            <Bar data={hourlyChartData} options={chartOptions} />
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