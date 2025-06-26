import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/artists?error=spotify_auth_failed', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/artists?error=no_auth_code', request.url))
    }

    // Verify state parameter for security
    const cookieStore = await cookies()
    const storedState = cookieStore.get('spotify_state')?.value
    const artistCount = cookieStore.get('spotify_artist_count')?.value || '10'
    
    if (!storedState) {
      return NextResponse.redirect(new URL('/artists?error=no_state', request.url))
    }

    if (storedState !== state) {
      return NextResponse.redirect(new URL('/artists?error=invalid_state', request.url))
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.redirect(new URL('/artists?error=token_exchange_failed', request.url))
    }

    // Get user's top artists with the selected count
    const artistsResponse = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${artistCount}&time_range=medium_term`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const artistsData = await artistsResponse.json()

    if (!artistsResponse.ok) {
      console.error('Artists fetch error:', artistsData)
      return NextResponse.redirect(new URL('/artists?error=artists_fetch_failed', request.url))
    }

    // TODO: Save user data and tokens to database
    // TODO: Store artists in user's preferences

    // Redirect back to artists page with success and artist count
    return NextResponse.redirect(new URL(`/artists?spotify_connected=true&artist_count=${artistCount}`, request.url))

  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(new URL('/artists?error=callback_failed', request.url))
  }
} 