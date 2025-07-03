import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth functions
export async function signInWithPhone(phoneNumber) {
  console.log("signInWithPhone", phoneNumber)
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
    options: {
      shouldCreateUser: true, // Creates user if they don't exist
    }
  })

  if (error) throw error
  return data
}

export async function verifyOTP(phoneNumber, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: token,
    type: 'sms'
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// User profile functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function updateUserProfile(updates) {
  const { data, error } = await supabase.auth.updateUser(updates)
  if (error) throw error
  return data
}

// User preferences functions
export async function getUserPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateUserPreferences(userId, preferences) {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert([{
      user_id: userId,
      ...preferences
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Artist management functions
export async function getUserArtists(userId) {
  const { data, error } = await supabase
    .from('user_artists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addUserArtist(userId, artist) {
  const { data, error } = await supabase
    .from('user_artists')
    .insert([{
      user_id: userId,
      artist_id: artist.id,
      artist_name: artist.name,
      source: 'manual'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function removeUserArtist(userId, artistId) {
  const { error } = await supabase
    .from('user_artists')
    .delete()
    .eq('user_id', userId)
    .eq('artist_id', artistId)

  if (error) throw error
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

export async function getSpotifyToken(userId) {
  const { data, error } = await supabase
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error

  if (Date.now() > Date.parse(data.expires_at)) {
    const refreshedToken = await fetch(`/api/spotify/refresh-token?refresh_token=${data.refresh_token}`)
    const refreshedTokenData = await refreshedToken.json()
    const { error: updateError } = await supabase
      .from('spotify_tokens')
      .update({
        access_token: refreshedTokenData.access_token,
        refresh_token: refreshedTokenData.refresh_token,
        expires_at: new Date(Date.now() + refreshedTokenData.expires_in * 1000)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError
    return refreshedTokenData.access_token
  }

  return data.access_token
}

