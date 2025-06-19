"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Bell, Smartphone, Users, Zap, Heart } from "lucide-react"
import { toast } from "react-toastify"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

export default function MusicNotifyLanding() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isValid, setIsValid] = useState(true)

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return true
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return true
    }
    return false
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    setPhoneNumber(value)
    
    // Only validate if user has entered something
    if (value.trim()) {
      setIsValid(validatePhoneNumber(value))
    } else {
      setIsValid(true) // Reset validation state when empty
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number")
      return
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number")
      setIsValid(false)
      return
    }
    
    setIsSubmitted(true)
    toast.success("Phone number submitted successfully!")
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

          {/* Phone Number Input Form */}
          <div className="max-w-md mx-auto mb-12">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className={`pl-12 h-14 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400 ${
                      !isValid && phoneNumber.trim() ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''
                    }`}
                    required
                  />
                </div>
                {!isValid && phoneNumber.trim() && (
                  <p className="text-red-400 text-sm text-center">Please enter a valid 10-digit phone number</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start Getting Notifications
                </Button>
                <p className="text-white/60 text-sm">Free to start • No spam • Unsubscribe anytime</p>
              </form>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="bg-blue-500 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Verify Your Number</h3>
                  <p className="text-white/80 text-sm">
                    We've sent a 6-digit code to <span className="font-semibold">{phoneNumber}</span>
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-white/90 text-sm font-medium mb-3 text-center">
                    Enter verification code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={6}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400 rounded-l-md" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400 rounded-r-md" />
                        <InputOTPSeparator className="text-white/40" />
                        <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400 rounded-l-md" />
                        <InputOTPSlot index={4} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400" />
                        <InputOTPSlot index={5} className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400 rounded-r-md" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
                  >
                    Verify & Complete Setup
                  </Button>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <button className="text-white/60 hover:text-white transition-colors">
                      Didn't receive code?
                    </button>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Resend
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    ← Back to phone number
                  </button>
                </div>
              </div>
            )}
          </div>

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
