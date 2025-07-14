"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Search, Plus, X, Music2Icon, ChevronDown } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, getSpotifyToken, signOut, supabase } from "@/lib/supabase"

function ArtistsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedArtists, setSelectedArtists] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSpotifyOptions, setShowSpotifyOptions] = useState(false)
  const [spotifyArtistCount, setSpotifyArtistCount] = useState(10)
  const [user, setUser] = useState(null)
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [smsConsent, setSmsConsent] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser()
        setUser(user)
        await loadSpotifyArtists(user.id)
        const spotifyToken = await getSpotifyToken(user.id)
        setSpotifyToken(spotifyToken)
      } catch (error) {
        console.log("No user session found")
      }
    }
    
    if (user === null) {
      checkUser()
    }
  }, [])

  const loadSpotifyArtists = async (userId) => {
    try {
      const { data: userArtists, error } = await supabase
        .from('user_artists')
        .select(`
          artist_id,
          artists (
            id,
            name,
            image_url,
            spotify_uri,
            popularity,
            genres,
            followers_count
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user artists:', error)
        toast.error('Failed to load artists from Spotify')
        return
      }

      if (userArtists && userArtists.length > 0) {
        const artists = userArtists.map(ua => ua.artists).filter(Boolean)
        setSelectedArtists(prev => {
          // Merge with existing artists, avoiding duplicates
          const existingIds = new Set(prev.map(a => a.id))
          const newArtists = artists.filter(artist => !existingIds.has(artist.id))
          return [...prev, ...newArtists]
        })
        console.log('Loaded artists:', artists)
      } else {
        console.log('No artists found for user', userArtists)
      }
    } catch (error) {
      console.error('Error loading Spotify artists:', error)
      toast.error('Failed to load artists from Spotify')
    }
  }

  // Handle URL parameters for Spotify OAuth results
  useEffect(() => {
    const error = searchParams.get('error')

    if (error) {
      const errorMessages = {
        'spotify_auth_failed': 'Spotify authentication failed. Please try again.',
        'no_auth_code': 'No authorization code received from Spotify.',
        'no_state': 'Security verification failed. Please try again.',
        'invalid_state': 'Security verification failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'artists_fetch_failed': 'Failed to fetch your top artists. Please try again.',
        'user_preferences_insert_failed': 'Failed to save your artist preferences. Please try again.',
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

    if (!spotifyToken) {
      toast.error("Please connect your Spotify account first")
      return
    }

    console.log("Token:", spotifyToken)
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.error("401 Unauthorized - Token is invalid or expired")
          toast.info("Token expired, attempting to refresh...")
          
          // Try to refresh the token
          const newToken = await refreshSpotifyToken()
          if (newToken) {
            setSpotifyToken(newToken)
            toast.success("Token refreshed! Try searching again.")
          } else {
            toast.error("Failed to refresh token. Please reconnect your Spotify account.")
            setSpotifyToken(null)
          }
        } else {
          console.error(`Spotify API error: ${response.status}`)
          toast.error(`Spotify API error: ${response.status}`)
        }
        setSearchResults([])
        return
      }

      const data = await response.json()
      console.log("Spotify response:", data)
      
      if (!data.artists || !data.artists.items) {
        console.error('Unexpected response format:', data)
        toast.error("Unexpected response from Spotify")
        setSearchResults([])
        return
      }

      setSearchResults(data.artists.items)
    } catch (error) {
      console.error('Search error:', error)
      toast.error("Failed to search artists")
      setSearchResults([])
    }
  }

  const refreshSpotifyToken = async () => {
    if (!user) return null

    try {
      // Get the refresh token from the database
      const { data: tokenData, error } = await supabase
        .from('spotify_tokens')
        .select('refresh_token')
        .eq('user_id', user.id)
        .single()

      if (error || !tokenData?.refresh_token) {
        console.error('No refresh token found:', error)
        return null
      }

      // Call our refresh endpoint
      const response = await fetch(`/api/spotify/refresh-token?refresh_token=${tokenData.refresh_token}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Token refresh failed:', data)
        return null
      }

      // Update the token in the database
      const { error: updateError } = await supabase
        .from('spotify_tokens')
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token || tokenData.refresh_token,
          expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000)
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating refreshed token:', updateError)
        return null
      }

      console.log('Token refreshed successfully')
      return data.access_token
    } catch (error) {
      console.error('Error refreshing token:', error)
      return null
    }
  }

  const addArtist = (artist) => {
    if (selectedArtists.find(a => a.id === artist.id)) {
      toast.error("Artist already added!")
      return
    }
    const newArtist = {
        id: artist.id,
        name: artist.name,
        image_url: artist.images[0]?.url,
        spotify_uri: artist.uri,
        followers_count: artist.followers.total,
        popularity: artist.popularity,
        genres: artist.genres
    }
    setSelectedArtists([...selectedArtists, newArtist])
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
      // delete all user_artists for this user
      const { error: userPreferencesDeleteError } = await supabase.from('user_artists').delete().eq('user_id', user.id)
      if (userPreferencesDeleteError) {
        console.error('Delete error:', userPreferencesDeleteError)
        toast.error("Failed to delete artists")
        return
      }
      
      // insert new artists
      console.log('Inserting artists:', selectedArtists)
      const artistsToInsert = selectedArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url,
        spotify_uri: artist.spotify_uri,
        popularity: artist.popularity,
        genres: artist.genres,
        followers_count: artist.followers_count
      }))
      console.log('Artists data to insert:', artistsToInsert)
      
      const { error: artistsInsertError } = await supabase.from('artists').upsert(artistsToInsert, {
        onConflict: 'id'
      })

      if (artistsInsertError) {
        console.error('Artists insert error:', artistsInsertError)
        toast.error("Failed to save artists")
        return
      }

      // insert user_artists relationships
      const userArtistsToInsert = selectedArtists.map(artist => ({
        user_id: user.id,
        artist_id: artist.id
      }))

      const { error: userArtistsInsertError } = await supabase.from('user_artists').insert(userArtistsToInsert)

      if (userArtistsInsertError) {
        console.error('User artists insert error:', userArtistsInsertError)
        toast.error("Failed to save artist preferences")
        return
      }

      toast.success("Artists saved successfully!")
      router.push(`/confirmation`)
    } catch (error) {
      console.error('Error:', error)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
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
            <Link href="/"> 
              <span className="text-white font-bold text-xl">TuneLert</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-md">
              <button onClick={handleSignOut}>Sign Out</button>
            </span>        
          </div>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10 text-gray-400" />
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
                        src={artist.images[0]?.url}
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
                        src={artist.image_url || artist.images[0]?.url}
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

          {/* SMS Consent Checkbox */}
          {selectedArtists.length > 0 && (
            <div className="mb-6">
              <div className="flex items-start space-x-3 p-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg">
                <input
                  type="checkbox"
                  id="sms-consent"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/30 rounded bg-white/10"
                />
                <label htmlFor="sms-consent" className="text-white/90 text-sm leading-relaxed">
                  I consent to receive weekly SMS notifications about new releases from my selected artists. 
                  Message and data rates may apply. You can opt out at any time by replying "STOP".
                </label>
              </div>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isLoading || selectedArtists.length === 0 || !smsConsent}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : `Continue with ${selectedArtists.length} Artist${selectedArtists.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function ArtistsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArtistsPageContent />
    </Suspense>
  )
} 