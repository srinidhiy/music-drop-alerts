import { NextResponse } from 'next/server'

export async function GET(request) {
  // Redirect to the actual API callback route
  const url = new URL(request.url)
  const apiCallbackUrl = new URL('/api/spotify/callback', request.url)
  
  // Copy all search params to the API route
  url.searchParams.forEach((value, key) => {
    apiCallbackUrl.searchParams.set(key, value)
  })
  
  return NextResponse.redirect(apiCallbackUrl)
} 