"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Search, Plus, X, Music2Icon, ChevronDown } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ArtistsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedArtists, setSelectedArtists] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showSpotifyOptions, setShowSpotifyOptions] = useState(false)
  const [spotifyArtistCount, setSpotifyArtistCount] = useState(10)

  // Handle URL parameters for Spotify OAuth results
  useEffect(() => {
    const spotifyConnected = searchParams.get('spotify_connected')
    const artistCount = searchParams.get('artist_count')
    const error = searchParams.get('error')

    if (spotifyConnected === 'true') {
      toast.success(`Successfully connected to Spotify! Imported ${artistCount} artists.`)
      // TODO: Load the imported artists from the backend
    } else if (error) {
      const errorMessages = {
        'spotify_auth_failed': 'Spotify authentication failed. Please try again.',
        'no_auth_code': 'No authorization code received from Spotify.',
        'no_state': 'Security verification failed. Please try again.',
        'invalid_state': 'Security verification failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'artists_fetch_failed': 'Failed to fetch your top artists. Please try again.',
        'callback_failed': 'Something went wrong during the authentication process.'
      }
      toast.error(errorMessages[error] || 'An error occurred during Spotify authentication.')
    }
  }, [searchParams])

  const artistCountOptions = [5, 10, 15, 20, 25, 50]

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    
    // TODO: Replace with actual Spotify API search
    // For now, show empty results
    setTimeout(() => {
      setSearchResults([])
      setIsSearching(false)
    }, 500)
  }

  const addArtist = (artist) => {
    if (selectedArtists.find(a => a.id === artist.id)) {
      toast.error("Artist already added!")
      return
    }
    
    setSelectedArtists([...selectedArtists, artist])
    setSearchQuery("")
    setSearchResults([])
    toast.success(`${artist.name} added!`)
  }

  const removeArtist = (artistId) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId))
  }

  const connectSpotify = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/spotify/auth?artistCount=${spotifyArtistCount}`)
      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Spotify OAuth
        window.location.href = data.authUrl
      } else {
        toast.error("Failed to connect Spotify")
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = async () => {
    if (selectedArtists.length === 0) {
      toast.error("Please select at least one artist")
      return
    }

    setIsLoading(true)
    
    try {
      // TODO: Save selected artists to database
      toast.success("Artists saved successfully!")
      router.push("/confirmation")
    } catch (error) {
      console.error('Error:', error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-2">
              <Music className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">TuneLert</span>
          </div>
          <span className="text-white font-bold text-md">
            <Link href="/profile">Profile</Link>
          </span>        
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Artists
            </h1>
            <p className="text-white/80 text-lg">
              Search for your favorite artists or connect your Spotify account to automatically import your top artists.
            </p>
          </div>

          {/* Spotify Connect Section */}
          <div className="mb-8">
            {!showSpotifyOptions ? (
              <Button
                onClick={() => setShowSpotifyOptions(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 flex items-center justify-center space-x-2"
              >
                <Music2Icon className="h-5 w-5" />
                <span>Connect with Spotify</span>
              </Button>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-white font-semibold mb-2">Import from Spotify</h3>
                      <p className="text-white/60 text-sm">Select how many of your top artists to import</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-white/80 text-sm font-medium">
                        Number of artists to import:
                      </label>
                      <div className="relative">
                        <select
                          value={spotifyArtistCount}
                          onChange={(e) => setSpotifyArtistCount(Number(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:ring-green-400 appearance-none"
                        >
                          {artistCountOptions.map((count) => (
                            <option key={count} value={count} className="bg-gray-800 text-white">
                              {count} artists
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={connectSpotify}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 flex items-center justify-center space-x-2"
                      >
                        <Music2Icon className="h-4 w-4" />
                        <span>Import {spotifyArtistCount} Artists</span>
                      </Button>
                      <Button
                        onClick={() => setShowSpotifyOptions(false)}
                        variant="outline"
                        className="border-white/20 text-black hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center mb-8">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="px-4 text-white/60 text-sm">or search manually</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="mb-6 bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-0">
                {searchResults.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => addArtist(artist)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <span className="text-white font-medium">{artist.name}</span>
                    </div>
                    <Plus className="h-5 w-5 text-white/60" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Selected Artists */}
          {selectedArtists.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-4">
                Selected Artists ({selectedArtists.length})
              </h3>
              <div className="space-y-2">
                {selectedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="text-white font-medium">{artist.name}</span>
                    </div>
                    <button
                      onClick={() => removeArtist(artist.id)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isLoading || selectedArtists.length === 0}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : `Continue with ${selectedArtists.length} Artist${selectedArtists.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </main>
    </div>
  )
} 