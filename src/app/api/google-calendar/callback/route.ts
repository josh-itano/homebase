import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?gcal=error`)
  }

  let userId: string
  let householdId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
    householdId = decoded.householdId
  } catch {
    return NextResponse.redirect(`${origin}/settings?gcal=error`)
  }

  const redirectUri = `${origin}/api/google-calendar/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${origin}/settings?gcal=error`)
  }

  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const supabase = await createClient()
  await supabase.from('google_calendar_tokens').upsert({
    user_id: userId,
    household_id: householdId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: tokenExpiry,
    calendar_id: 'primary',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${origin}/settings?gcal=connected`)
}
