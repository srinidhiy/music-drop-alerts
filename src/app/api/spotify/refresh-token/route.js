import { NextResponse } from 'next/server';

export async function GET(request) {
    console.log("Refreshing Spotify token")
    console.log(process.env.SPOTIFY_CLIENT_ID)
  const { searchParams } = new URL(request.url);
  const refresh_token = searchParams.get('refresh_token');

  if (!refresh_token) {
    return NextResponse.json({ error: 'Missing refresh_token' }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Missing Spotify client credentials' }, { status: 500 });
  }

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
  console.log("Refreshed token data", data)

  if (!response.ok) {
    console.log("Failed to refresh token", data)
    return NextResponse.json({ error: data.error_description || 'Failed to refresh token' }, { status: 500 });
  }

  return NextResponse.json(data);
}