"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface TrackAnalysis {
  tempo: number
  key: number
  mode: number
  time_signature: number
}

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  analysis?: TrackAnalysis
}

interface MoodData {
  mood: string
  percentage: number
  tracks: Track[]
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to fetch with retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10)
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`)
        await delay(retryAfter * 1000)
        continue
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await delay(delayMs * Math.pow(2, i))
    }
  }
  throw new Error('Max retries reached')
}

export default function MoodTrends() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moodData, setMoodData] = useState<MoodData[]>([])
  const [timeRange, setTimeRange] = useState<"short_term" | "medium_term" | "long_term">("medium_term")
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" })

  const getMoodFromAnalysis = (analysis: TrackAnalysis): string => {
    const { tempo, key, mode } = analysis

    // Fast & Major: Upbeat and happy
    if (tempo > 120 && mode === 1) return "Fast & Major"
    
    // Fast & Minor: Energetic but darker
    if (tempo > 120 && mode === 0) return "Fast & Minor"
    
    // Slow & Major: Relaxed and happy
    if (tempo < 100 && mode === 1) return "Slow & Major"
    
    // Slow & Minor: Melancholic
    if (tempo < 100 && mode === 0) return "Slow & Minor"
    
    // Medium & Major: Balanced and positive
    if (mode === 1) return "Medium & Major"
    
    // Medium & Minor: Balanced and introspective
    return "Medium & Minor"
  }

  const fetchMoodData = async () => {
    if (!session?.token?.access_token) {
      setError("No session token available")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setProgress({ current: 0, total: 0, message: "Fetching top tracks..." })

      // Fetch top tracks
      const tracksResponse = await fetchWithRetry(
        `https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${session.token.access_token}`,
          },
        }
      )

      const tracksData = await tracksResponse.json()
      const tracks: Track[] = tracksData.items

      // Get analysis for all tracks
      const trackIds = tracks.map(track => track.id)
      setProgress({ current: 0, total: trackIds.length, message: "Analyzing tracks..." })
      
      // Process tracks in chunks of 5 to avoid rate limits
      const chunkSize = 5
      const tracksWithAnalysis: Track[] = []
      
      for (let i = 0; i < trackIds.length; i += chunkSize) {
        const chunk = trackIds.slice(i, i + chunkSize)
        setProgress(prev => ({ 
          ...prev, 
          current: i + chunk.length,
          message: `Analyzing tracks ${i + 1}-${Math.min(i + chunkSize, trackIds.length)} of ${trackIds.length}...`
        }))

        try {
          const analysisResponse = await fetchWithRetry(
            `https://api.spotify.com/v1/audio-analysis/${chunk.join(',')}`,
            {
              headers: {
                Authorization: `Bearer ${session.token.access_token}`,
              },
            }
          )

          const analysisData = await analysisResponse.json()
          
          // Combine tracks with their analysis
          chunk.forEach((trackId, index) => {
            const track = tracks.find(t => t.id === trackId)
            if (track && analysisData[index]) {
              tracksWithAnalysis.push({
                ...track,
                analysis: analysisData[index]
              })
            }
          })

          // Add delay between chunks
          await delay(1000)
        } catch (error) {
          console.error(`Failed to fetch analysis for chunk starting at ${i}:`, error)
        }
      }

      if (tracksWithAnalysis.length === 0) {
        throw new Error("No tracks with analysis found")
      }

      setProgress(prev => ({ ...prev, message: "Processing mood data..." }))

      // Group tracks by mood
      const moodMap = new Map<string, Track[]>()
      tracksWithAnalysis.forEach(track => {
        if (track.analysis) {
          const mood = getMoodFromAnalysis(track.analysis)
          const tracks = moodMap.get(mood) || []
          tracks.push(track)
          moodMap.set(mood, tracks)
        }
      })

      // Convert to array and calculate percentages
      const totalTracks = tracksWithAnalysis.length
      const moodDataArray = Array.from(moodMap.entries()).map(([mood, tracks]) => ({
        mood,
        percentage: (tracks.length / totalTracks) * 100,
        tracks,
      }))

      // Sort by percentage
      moodDataArray.sort((a, b) => b.percentage - a.percentage)

      setMoodData(moodDataArray)
    } catch (error) {
      console.error("Error fetching mood data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch mood data")
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0, message: "" })
    }
  }

  useEffect(() => {
    if (session?.token?.access_token) {
      fetchMoodData()
    }
  }, [session, timeRange])

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Mood Trends</h2>
        <div className="text-white mb-4">{progress.message}</div>
        {progress.total > 0 && (
          <div className="w-full bg-gray-600 rounded-full h-2 mb-4">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Mood Trends</h2>
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchMoodData}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Mood Trends</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="short_term">Last 4 Weeks</option>
          <option value="medium_term">Last 6 Months</option>
          <option value="long_term">All Time</option>
        </select>
      </div>

      <div className="space-y-4">
        {moodData.map(({ mood, percentage, tracks }) => (
          <div key={mood} className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">{mood}</h3>
              <span className="text-gray-300">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-3 text-sm text-gray-400">
              Top tracks: {tracks.slice(0, 3).map(track => track.name).join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 