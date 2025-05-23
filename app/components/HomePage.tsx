"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { SpotifyLogo } from "./SpotifyLogo"

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SpotifyLogo className="h-8 w-8" />
          <span className="text-xl font-bold">Spotify Analyzer</span>
        </div>
        <nav className="hidden md:flex gap-6 items-center">
          <Link
            href="#features"
            className="text-sm font-medium text-gray-300 hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-gray-300 hover:text-white"
          >
            How It Works
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-gray-300 hover:text-white"
          >
            FAQ
          </Link>
        </nav>
      </header>
      <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-4 pb-32 pt-56 text-center max-w-4xl">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Analyze Your Spotify Data
          </h1>
          <p className="mx-auto max-w-5xl text-gray-400 md:text-xl">
            Discover patterns and visualize your listening history.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row">
          <button
            onClick={() => signIn("spotify")}
            className="bg-green-500 hover:bg-green-600 text-black font-bold px-8 py-4 text-lg rounded-full"
          >
            Connect with Spotify
          </button>
        </div>
      </section>
      <section id="features" className="container mx-auto px-4 pt-2 md:pb-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-green-500"
              >
                <path d="M12 20v-6M6 20V10M18 20V4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Detailed Statistics</h3>
            <p className="text-gray-400">
              Discover your top artists, tracks, and genres with comprehensive
              listening statistics.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-green-500"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Interactive Visualizations</h3>
            <p className="text-gray-400">
              Explore your music taste through beautiful, interactive charts and
              graphs.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-green-500"
              >
                <path d="M12 2v8M4.93 10.93l1.41 1.41M20.07 10.93l-1.41 1.41M12 18v2M4.93 19.07l1.41-1.41M20.07 19.07l-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Listening Patterns</h3>
            <p className="text-gray-400">
              Understand when and how you listen to music with time-based
              analysis.
            </p>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="bg-zinc-900 py-16 md:py-24">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold">Connect Your Account</h3>
              <p className="text-gray-400">
                Securely connect your Spotify account with just a few clicks.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold">Analyze Your Data</h3>
              <p className="text-gray-400">
                We process your listening history to generate personalized
                insights.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold">Explore Your Music Taste</h3>
              <p className="text-gray-400">
                Dive into interactive visualizations and discover your unique
                music profile.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="faq" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border border-zinc-800 p-6">
            <h3 className="text-xl font-bold">Is this service free?</h3>
            <p className="mt-2 text-gray-400">
              Yes, Spotify Analyzer is completely free to use. We don&apos;t
              collect any payment information.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-6">
            <h3 className="text-xl font-bold">Is my data secure?</h3>
            <p className="mt-2 text-gray-400">
              We only access the data necessary for analysis and never store
              your Spotify credentials. Your privacy is our priority.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-6">
            <h3 className="text-xl font-bold">
              How far back does the analysis go?
            </h3>
            <p className="mt-2 text-gray-400">
              Our analysis covers your recent listening history (approximately
              the last 6 months) as provided by the Spotify API.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
