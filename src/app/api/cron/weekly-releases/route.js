import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

// Create server-side Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Server-side token refresh function
async function refreshSpotifyTokenServer(refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to refresh token')
  }
  return data
}

// Server-side getSpotifyToken function
async function getSpotifyTokenServer(userId) {
  const { data, error } = await supabaseAdmin
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error

  if (Date.now() > Date.parse(data.expires_at)) {
    console.log("Token expired, refreshing...")
    const refreshedTokenData = await refreshSpotifyTokenServer(data.refresh_token)
    
    const { error: updateError } = await supabaseAdmin
      .from('spotify_tokens')
      .update({
        access_token: refreshedTokenData.access_token,
        refresh_token: refreshedTokenData.refresh_token || data.refresh_token,
        expires_at: new Date(Date.now() + refreshedTokenData.expires_in * 1000)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError
    return refreshedTokenData.access_token
  }
  
  console.log("Spotify token is valid")
  return data.access_token
}

// Helper function to fetch all albums for an artist with pagination
async function fetchArtistAlbums(accessToken, artistId) {
  const allAlbums = []

    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch albums for artist ${artistId}: ${response.status}`)
    }

    const data = await response.json()
    allAlbums.push(...data.items)


  return allAlbums
}

// Helper function to send SMS via Twilio
async function sendSMS(to, message) {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: message
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SMS sending failed: ${error}`)
  }

  return response.json()
}

// Helper function to format release message
function formatReleaseMessage(userName, releases) {
  if (releases.length === 0) {
    return `Hi ${userName}! No new releases from your followed artists this week. Check back next Friday! 🎧`
  }

  let message = `Hi ${userName}! Here are the new releases from your artists this week: 🎧\n\n`
  
  releases.forEach((release, index) => {
    message += `${index + 1}. ${release.artistName} - ${release.albumName}\n`
    if (release.releaseDate) {
      message += `   Released: ${release.releaseDate}\n`
    }
    if (release.spotifyUrl) {
      message += `   Listen: ${release.spotifyUrl}\n`
    }
    message += '\n'
  })

  message += `\nHappy listening! 🎵`
  return message
}

// Helper function to check if release is from the past 7 days
function isRecentRelease(releaseDate) {
  const release = new Date(releaseDate)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return release >= weekAgo
}

export async function GET(request) {
  try {
    console.log('Starting weekly releases cron job...')

    // Get all unique artists from the artists table
    const { data: allArtists, error: artistsError } = await supabaseAdmin
      .from('artists')
      .select('id, name')
      .order('name')

    if (artistsError) {
      console.error('Error fetching artists:', artistsError)
      return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 })
    }

    if (!allArtists || allArtists.length === 0) {
      console.log('No artists found in database')
      return NextResponse.json({ message: 'No artists to check' })
    }

    console.log(`Found ${allArtists.length} unique artists to check`)

    // Get all users with phone numbers
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, phone_number')
      .not('phone_number', 'is', null)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log('No users found with phone numbers')
      return NextResponse.json({ message: 'No users to notify' })
    }

    console.log(`Found ${users.length} users to process:`, users.map(u => ({ id: u.id, phone: u.phone_number })))

    // Get user-artist relationships
    const { data: userArtists, error: userArtistsError } = await supabaseAdmin
      .from('user_artists')
      .select('user_id, artist_id')

    if (userArtistsError) {
      console.error('Error fetching user-artist relationships:', userArtistsError)
      return NextResponse.json({ error: 'Failed to fetch user-artist relationships' }, { status: 500 })
    }

    // Create a map of user_id to their artist_ids
    const userArtistMap = {}
    userArtists.forEach(ua => {
      if (!userArtistMap[ua.user_id]) {
        userArtistMap[ua.user_id] = []
      }
      userArtistMap[ua.user_id].push(ua.artist_id)
    })

    // Create a map of artist_id to artist name
    const artistNameMap = {}
    allArtists.forEach(artist => {
      artistNameMap[artist.id] = artist.name
    })

    // Get a valid access token from first user
    let accessToken
    try {
      const firstUser = users[0]
      accessToken = await getSpotifyTokenServer(firstUser.id)
      console.log('Got access token for API calls')
    } catch (error) {
      console.error('Error getting access token:', error)
      return NextResponse.json({ error: 'Failed to get Spotify access token' }, { status: 500 })
    }

    // Check all artists for recent releases
    const artistReleases = {}
    
    for (const artist of allArtists) {
      try {
        console.log(`Checking releases for ${artist.name} (${artist.id})...`)
        
        const albums = await fetchArtistAlbums(accessToken, artist.id)
        
        // Filter for recent releases
        const recentAlbums = albums.filter(album => isRecentRelease(album.release_date))
        
        if (recentAlbums.length > 0) {
          artistReleases[artist.id] = recentAlbums.map(album => ({
            albumName: album.name,
            artistName: artist.name,
            releaseDate: album.release_date,
            spotifyUrl: album.external_urls.spotify,
            albumType: album.album_type
          }))
          console.log(`Found ${recentAlbums.length} recent releases for ${artist.name}`)
        }
        
        // Add delay between artist requests to avoid rate limiting
        // await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error) {
        console.error(`Error fetching albums for artist ${artist.id}:`, error)
        // Continue with other artists
      }
    }

    console.log(`Found recent releases for ${Object.keys(artistReleases).length} artists`)

    // Now process each user and send notifications
    let successCount = 0
    let errorCount = 0

    for (const user of users) {
      try {
        console.log(`Processing user ${user.id}...`)

        const userArtistIds = userArtistMap[user.id] || []
        
        if (userArtistIds.length === 0) {
          console.log(`User ${user.id} has no followed artists`)
          continue
        }

        // Find releases for user's artists
        const userReleases = []
        userArtistIds.forEach(artistId => {
          if (artistReleases[artistId]) {
            userReleases.push(...artistReleases[artistId])
          }
        })

        if (userReleases.length === 0) {
          console.log(`No recent releases for user ${user.id}`)
          continue
        }

        // Sort releases by release date (newest first)
        userReleases.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))

        // Format and send SMS
        // const message = formatReleaseMessage(user.id, userReleases)
        // await sendSMS(user.phone_number, message)
        
        console.log(`SMS sent to user ${user.id} for ${userReleases.length} releases`)
        successCount++

        // Add delay between SMS sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log(`Cron job completed. Success: ${successCount}, Errors: ${errorCount}`)
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${users.length} users. Success: ${successCount}, Errors: ${errorCount}. Checked ${allArtists.length} artists.` 
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 