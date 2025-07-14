import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const refresh_token = searchParams.get('refresh_token');

  if (!refresh_token) {
    console.error('Missing refresh_token parameter');
    return NextResponse.json({ error: 'Missing refresh_token' }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Spotify client credentials');
    return NextResponse.json({ error: 'Missing Spotify client credentials' }, { status: 500 });
  }

  console.log('Attempting to refresh token...');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      })
    });

    const data = await response.json();
    console.log('Spotify refresh response status:', response.status);

    if (!response.ok) {
      console.error('Spotify refresh failed:', data);
      return NextResponse.json({ 
        error: data.error_description || 'Failed to refresh token',
        details: data 
      }, { status: response.status });
    }

    console.log('Token refresh successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error during token refresh:', error);
    return NextResponse.json({ error: 'Internal server error during token refresh' }, { status: 500 });
  }
}