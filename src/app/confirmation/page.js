"use client"

import { Button } from "@/components/ui/button"
import { Music, Bell, CheckCircle, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ConfirmationPage() {
  const router = useRouter()

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
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="bg-green-500 rounded-full p-6 w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              You're All Set! 🎧
            </h1>
            <p className="text-white/80 text-lg mb-8">
              Your music drop alerts are now active. You'll receive weekly notifications every Friday when your favorite artists release new music.
            </p>
          </div>

          {/* What to Expect */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 mb-8">
            <h2 className="text-white text-xl font-semibold mb-6">What to Expect</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500 rounded-full p-2 mt-1">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium mb-1">Weekly Updates</h3>
                  <p className="text-white/70 text-sm">
                    Every Friday at 12:15 AM EST, we'll check for new releases from your artists and send you a summary.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-500 rounded-full p-2 mt-1">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium mb-1">SMS Notifications</h3>
                  <p className="text-white/70 text-sm">
                    Receive concise SMS alerts with artist names, album/single titles, and release dates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-500 rounded-full p-2 mt-1">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-medium mb-1">Easy Management</h3>
                  <p className="text-white/70 text-sm">
                    Reply "STOP" to any message to unsubscribe, or "ARTISTS" to manage your artist list.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sample Message Preview */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Sample Message Preview</h3>
            <div className="bg-gray-800 rounded-lg p-4 text-left">
              <p className="text-white/90 text-sm">
                🎧 New Music Alert!<br/>
                Drake: "For All The Dogs" (Album)<br/>
                The Weeknd: "Popular" (Single)<br/>
                Reply STOP to unsubscribe
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3"
            >
              Back to Home
            </Button>
            
            <p className="text-white/60 text-sm">
              Questions? Contact us at support@tunelert.com
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 