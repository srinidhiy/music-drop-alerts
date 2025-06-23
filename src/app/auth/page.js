"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Music, ArrowLeft } from "lucide-react"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Auth() {
  const router = useRouter()
  const [mode, setMode] = useState("signin") // or "signup"
  // Shared
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // Sign up only
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email)

  

  // --- SIGN UP FLOW ---
  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (!validatePhoneNumber(phone)) {
      toast.error("Please enter a valid phone number")
      return
    }
    setIsLoading(true)
    try {
      // 1. Send OTP to phone (mocked, replace with Twilio/Supabase call)
      const response = await fetch('/api/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      })

      const result = await response.json()
      
      console.log('API result:', result)
      if (response.ok) {
        setShowOTP(true)
        toast.success("Verification code sent!")
      } else {
        toast.error(result.error || "Failed to send verification code")
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error("Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTPAndCreateUser = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code")
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone, code: otp }),
      })

      const result = await response.json()

      console.log('API result:', result)
      if (response.ok) {
        // Create user with phone number in metadata
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password
        })
        if (error) throw error
        
        // Also create a record in the users table
        if (data.user) {
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              phone_number: phone,
              phone_verified: true,
              created_at: new Date().toISOString()
            })
          
          if (userError) {
            console.error('Error creating user record:', userError)
          }
        }
        
        toast.success("Account created!")
        router.push("/artists")
      } else {
        toast.error(result.error || "Failed to create account")
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error("Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  // --- SIGN IN FLOW ---
  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success("Signed in")
      router.push("/profile")
    } catch (error) {
      toast.error("Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </button>
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Music className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TuneLert</h1>
          <p className="text-white/80 text-lg">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">
              {mode === "signin" ? "Sign In" : showOTP ? "Verify Phone" : "Sign Up"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  autoComplete="email"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : showOTP ? (
              <form onSubmit={handleVerifyOTPAndCreateUser} className="space-y-4">
                <div className="text-white/80 text-center">Enter the 6-digit code sent to {phone}</div>
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="w-12 h-12 text-lg font-semibold bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:ring-blue-400 rounded-md"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify & Complete Signup"}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-white/60 hover:text-white text-sm transition-colors"
                    onClick={() => setShowOTP(false)}
                  >
                    ← Back to sign up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  autoComplete="tel"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  autoComplete="email"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending code..." : "Sign Up"}
                </Button>
              </form>
            )}
            <div className="text-center mt-4">
              {mode === "signin" ? (
                <>
                  <span className="text-white/60">Don't have an account? </span>
                  <button
                    className="text-blue-400 hover:underline"
                    onClick={() => { setMode("signup"); setShowOTP(false); }}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <span className="text-white/60">Already have an account? </span>
                  <button
                    className="text-blue-400 hover:underline"
                    onClick={() => { setMode("signin"); setShowOTP(false); }}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}