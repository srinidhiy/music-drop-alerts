import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

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

    // get user id from session cookie
    const sessionCookie = (await cookies()).get('session')?.value
    if (!sessionCookie) {
      console.error('No session cookie found')
      return NextResponse.redirect(new URL('/auth?error=no_session', request.url))
    }

    let user
    try {
      user = JSON.parse(sessionCookie)
      console.log('Session data parsed successfully')
    } catch (error) {
      console.error('Invalid session cookie:', error)
      return NextResponse.redirect(new URL('/auth?error=invalid_session', request.url))
    }

    if (!user || !user.id) {
      console.error('No user or user.id in session data')
      return NextResponse.redirect(new URL('/auth?error=no_user_id', request.url))
    }

    console.log('Using userId:', user.id)

    // store artists in artists table
    const { error: insertError } = await supabase.from('artists').upsert(artistsData.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        image_url: artist.images[0]?.url,
        spotify_uri: artist.uri,
        followers_count: artist.followers.total,
        popularity: artist.popularity,
        genres: artist.genres
    })))

    if (insertError) {
        console.error('Artists insert error:', insertError)
        return NextResponse.redirect(new URL('/artists?error=artists_insert_failed', request.url))
    }

    // store spotify tokens in spotify_tokens table
    const { error: spotifyTokensInsertError } = await supabase.from('spotify_tokens').upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in
    })

    if (spotifyTokensInsertError) {
        console.error('Spotify tokens insert error:', spotifyTokensInsertError)
        return NextResponse.redirect(new URL('/artists?error=spotify_tokens_insert_failed', request.url))
    }

    // store user preferences in user_artists table
    const { error: userPreferencesInsertError } = await supabase.from('user_artists').upsert(artistsData.items.map(artist => ({
        user_id: user.id,
        artist_id: artist.id
    })))

    if (userPreferencesInsertError) {
        console.error('User preferences insert error:', userPreferencesInsertError)
        return NextResponse.redirect(new URL('/artists?error=user_preferences_insert_failed', request.url))
    }

    // Redirect back to artists page with success and artist count
    return NextResponse.redirect(new URL(`/artists?spotify_connected=true&artist_count=${artistCount}`, request.url))

  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(new URL('/artists?error=callback_failed', request.url))
  }
} 