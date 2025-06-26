import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI

export async function createCookie(state) {
    const cookieStore = await cookies()
    cookieStore.set('spotify_state', state)
}

export async function createArtistCountCookie(artistCount) {
    const cookieStore = await cookies()
    cookieStore.set('spotify_artist_count', artistCount.toString())
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const artistCount = searchParams.get('artistCount') || '10'
    
    // Validate artist count
    const validCounts = [5, 10, 15, 20, 25, 50]
    const count = validCounts.includes(Number(artistCount)) ? Number(artistCount) : 10

    // Generate random state for security
    const state = Math.random().toString(36).substring(7)

    // Store state and artist count in cookies for verification
    const cookieStore = await cookies()
    cookieStore.set('spotify_state', state)
    cookieStore.set('spotify_artist_count', count.toString())
    
    // Spotify OAuth URL
    const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize')
    spotifyAuthUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
    spotifyAuthUrl.searchParams.append('response_type', 'code')
    spotifyAuthUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI)
    spotifyAuthUrl.searchParams.append('state', state)
    spotifyAuthUrl.searchParams.append('scope', 'user-top-read user-read-private user-read-email user-library-modify user-library-read')
    
    return NextResponse.json({
      authUrl: spotifyAuthUrl.toString(),
      state: state,
      artistCount: count
    })
    
  } catch (error) {
    console.error('Spotify auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Spotify auth URL' },
      { status: 500 }
    )
  }
} 