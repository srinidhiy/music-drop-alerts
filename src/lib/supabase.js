import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database utility functions
export async function createUser(phoneNumber) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ phone_number: phoneNumber }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserByPhone(phoneNumber) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateUserVerification(userId, verified = true) {
  const { data, error } = await supabase
    .from('users')
    .update({ phone_verified: verified })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveUserArtists(userId, artists) {
  const artistData = artists.map(artist => ({
    user_id: userId,
    artist_id: artist.id,
    artist_name: artist.name,
    source: 'spotify'
  }))

  const { data, error } = await supabase
    .from('user_artists')
    .insert(artistData)
    .select()

  if (error) throw error
  return data
}

export async function saveSpotifyTokens(userId, tokens) {
  const { data, error } = await supabase
    .from('spotify_tokens')
    .upsert([{
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000)
    }])
    .select()
    .single()

  if (error) throw error
  return data
} 