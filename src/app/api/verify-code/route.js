import { NextResponse } from 'next/server'

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

export async function POST(request) {
  try {
    const { phoneNumber, code } = await request.json()

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      )
    }

    // Format phone number for Twilio
    const cleanedPhone = phoneNumber.replace(/\D/g, '')
    const formattedPhone = cleanedPhone.length === 10 ? `+1${cleanedPhone}` : `+${cleanedPhone}`

    // Verify the code with Twilio
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Code: code
      })
    })

    const result = await response.json()

    if (response.ok && result.status === 'approved') {
      // TODO: Save verified user to database
      return NextResponse.json({
        success: true,
        message: 'Phone number verified successfully',
        phoneNumber: formattedPhone
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Verification check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 