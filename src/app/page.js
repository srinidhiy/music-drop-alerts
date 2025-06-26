"use client"

import { Button } from "@/components/ui/button"
import { Music, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/supabase"

export default function MusicNotifyLanding() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser()
        console.log(user)
        if (user) {
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.log("No user session found")
        setIsLoggedIn(false)
      }
    }
    checkUser()
  }, [])

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
            {isLoggedIn ? <Link href="/profile">Profile</Link> : <Link href="/auth">Sign In</Link>}
          </span>        
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-6">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Bell className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-white/90 text-sm">Never miss a drop again</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Get Notified When Your
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {" "}
                Favorite Artists{" "}
              </span>
              Drop New Music
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Stay ahead of the curve with weekly SMS notifications. Be the first to discover new releases from the
              artists you love most.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            onClick={() => router.push("/auth")}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Start Getting Notifications
          </Button>

          {/* Trust Indicators */}
          {/* <div className="flex flex-wrap justify-center items-center gap-8 text-white/60 text-sm">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>50K+ music lovers</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              <span>Instant notifications</span>
            </div>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              <span>1M+ songs tracked</span>
            </div>
          </div> */}
        </div>
      </main>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-white/80 text-lg">Simple setup, powerful results</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
              1
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Sign Up</h3>
            <p className="text-white/80">Enter your phone number and create your free account in seconds.</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
              2
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Add Artists</h3>
            <p className="text-white/80">Search and follow your favorite artists to start tracking their releases - or link via Spotify.</p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
              3
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">Get Notified</h3>
            <p className="text-white/80">Receive weekly notifications when new music drops from your artists.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-2">
              <Music className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">TuneLert</span>
          </div>
        </div>
        <div className="text-center text-white/60 text-sm mt-8">© 2024 TuneLert. All rights reserved.</div>
      </footer>
    </div>
  )
}
