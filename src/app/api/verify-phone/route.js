import { NextResponse } from 'next/server'

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove non-digits)
    const cleanedPhone = phoneNumber.replace(/\D/g, '')
    
    // Validate phone number format
    if (cleanedPhone.length !== 10 && !(cleanedPhone.length === 11 && cleanedPhone.startsWith('1'))) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Format phone number for Twilio (add +1 if needed)
    const formattedPhone = cleanedPhone.length === 10 ? `+1${cleanedPhone}` : `+${cleanedPhone}`

    // Send verification code via Twilio
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Channel: 'sms'
      })
    })

    const result = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: formattedPhone
      })
    } else {
      console.error('Twilio error:', result)
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 