import { NextResponse } from 'next/server'
import { serialize } from 'cookie'

export async function POST(request) {
  try {
    const { user } = await request.json()
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 })
    }

    // Set session cookie
    const cookie = serialize('session', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    const response = NextResponse.json({ success: true })
    response.headers.append('Set-Cookie', cookie)
    
    return response
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
} 