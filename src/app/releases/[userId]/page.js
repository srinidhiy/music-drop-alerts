'use client'

import { useState, useEffect } from 'react'
import { Music, ExternalLink, Calendar, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function UserReleasesPage({ params }) {
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const getUserId = async () => {
      const { userId: id } = await params
      setUserId(id)
    }
    getUserId()
  }, [params])

  useEffect(() => {
    if (!userId) return

    const fetchReleases = async () => {
      try {
        const response = await fetch(`/api/releases/${userId}`)
        const data = await response.json()
        
        if (response.ok) {
          setReleases(data.releases || [])
          setUser(data.user)
        } else {
          setError(data.error || 'Failed to load releases')
        }
      } catch (err) {
        setError('Failed to load releases')
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your new releases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Oops! Something went wrong</p>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/artists">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Back to Artists
            </Button>
          </Link>
        </div>
      </div>
    )
  }

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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Your New Releases
            </h1>
            <p className="text-white/80 text-lg">
              {releases.length > 0 
                ? `Discover ${releases.length} new release${releases.length !== 1 ? 's' : ''} from your favorite artists this week!`
                : "No new releases from your artists this week. Check back next Friday!"
              }
            </p>
          </div>

          {/* Releases Grid */}
          {releases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release, index) => (
                <Card key={`${release.artistId}-${release.albumName}`} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-6">
                    {/* Album Image - Larger and more prominent */}
                    <div className="mb-4">
                      <img
                        src={release.albumImage || '/default-album.png'}
                        alt={release.albumName}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                        onError={(e) => {
                          e.target.src = '/default-album.png'
                        }}
                      />
                    </div>

                    {/* Album Info - Stacked together */}
                    <div className="mb-4">
                      <h4 className="text-white font-bold text-lg mb-1">{release.albumName}</h4>
                      <p className="text-white/80 font-medium mb-1">{release.artistName}</p>
                      <p className="text-white/60 text-sm mb-3 capitalize">{release.albumType}</p>
                      <div className="flex items-center text-white/60 text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Released {new Date(release.releaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Single Action Button */}
                    <Button
                      onClick={() => window.open(release.spotifyUrl, '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Listen on Spotify
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-12 text-center">
                <Music className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-white text-xl font-semibold mb-2">No New Releases</h3>
                <p className="text-white/60 mb-6">
                  Your favorite artists haven't released anything new this week. 
                  Check back next Friday for fresh music!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-white/60 text-sm">
              You can opt out of SMS notifications anytime by replying "STOP"
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 