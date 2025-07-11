import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, phone_number')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's recent releases
    const { data: userReleases, error: releasesError } = await supabaseAdmin
      .from('user_releases')
      .select('*')
      .eq('user_id', userId)
      .order('release_date', { ascending: false })

    if (releasesError) {
      return NextResponse.json({ error: 'Failed to fetch user releases' }, { status: 500 })
    }

    // Format releases for the frontend
    const formattedReleases = userReleases?.map(release => ({
      artistId: release.artist_id,
      artistName: release.artist_name,
      albumImage: release.album_image,
      albumName: release.album_name,
      releaseDate: release.release_date,
      spotifyUrl: release.spotify_url,
      albumType: release.album_type
    })) || []

    return NextResponse.json({
      releases: formattedReleases,
      user: { id: user.id },
      message: formattedReleases.length > 0 ? 'Releases found' : 'No recent releases found'
    })

  } catch (error) {
    console.error('Error fetching releases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 