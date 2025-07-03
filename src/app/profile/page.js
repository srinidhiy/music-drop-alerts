"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, User, Bell, Settings, LogOut, Edit, Save, X } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { 
  getCurrentUser, 
  getUserArtists, 
  getUserPreferences, 
  updateUserPreferences,
  removeUserArtist,
  signOut 
} from "@/lib/supabase"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [artists, setArtists] = useState([])
  const [preferences, setPreferences] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editPreferences, setEditPreferences] = useState({})

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/')
        return
      }

      setUser(currentUser)

      // Load user artists
      const userArtists = await getUserArtists(currentUser.id)
      setArtists(userArtists)

      // Load user preferences
      const userPrefs = await getUserPreferences(currentUser.id)
      setPreferences(userPrefs || {})
      setEditPreferences(userPrefs || {})

    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updateUserPreferences(user.id, editPreferences)
      setPreferences(editPreferences)
      setIsEditing(false)
      toast.success('Preferences updated successfully!')
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    }
  }

  const handleRemoveArtist = async (artistId) => {
    try {
      await removeUserArtist(user.id, artistId)
      setArtists(artists.filter(a => a.artist_id !== artistId))
      toast.success('Artist removed successfully!')
    } catch (error) {
      console.error('Error removing artist:', error)
      toast.error('Failed to remove artist')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      toast.success('Signed out successfully!')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-2">
                <Music className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">TuneLert</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/artists')}
              className="text-white/60 hover:text-white transition-colors"
            >
              Manage Artists
            </button>
            <button 
              onClick={handleSignOut}
              className="text-white/60 hover:text-white transition-colors flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
            <p className="text-white/80">
              Phone: {user.phone}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Preferences Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Preferences</span>
                  </CardTitle>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Notification Time
                      </label>
                      <select
                        value={editPreferences.notification_time || '12:15'}
                        onChange={(e) => setEditPreferences({
                          ...editPreferences,
                          notification_time: e.target.value
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="12:15">12:15 AM EST</option>
                        <option value="09:00">9:00 AM EST</option>
                        <option value="18:00">6:00 PM EST</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm mb-2">
                        Notification Frequency
                      </label>
                      <select
                        value={editPreferences.frequency || 'weekly'}
                        onChange={(e) => setEditPreferences({
                          ...editPreferences,
                          frequency: e.target.value
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="weekly">Weekly (Friday)</option>
                        <option value="daily">Daily</option>
                        <option value="instant">Instant</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleSavePreferences}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 text-white/80">
                    <p><strong>Notification Time:</strong> {preferences.notification_time || '12:15 AM EST'}</p>
                    <p><strong>Frequency:</strong> {preferences.frequency || 'Weekly (Friday)'}</p>
                    <p><strong>Status:</strong> <span className="text-green-400">Active</span></p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Artists Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Music className="h-5 w-5" />
                  <span>Your Artists ({artists.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {artists.length === 0 ? (
                  <p className="text-white/60 text-center py-4">
                    No artists added yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {artists.slice(0, 5).map((artist) => (
                      <div
                        key={artist.artist_id}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                      >
                        <span className="text-white font-medium">{artist.artist_name}</span>
                        <button
                          onClick={() => handleRemoveArtist(artist.artist_id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {artists.length > 5 && (
                      <p className="text-white/60 text-sm text-center">
                        +{artists.length - 5} more artists
                      </p>
                    )}
                  </div>
                )}
                <Button
                  onClick={() => router.push('/artists')}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Manage Artists
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Account Actions */}
          <Card className="mt-6 bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Account Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => router.push('/artists')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Add More Artists
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 