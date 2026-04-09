import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', authData.user.id)
    .limit(1)
    .single()

  if (!memberData) return NextResponse.json({ error: 'No household' }, { status: 400 })

  const state = Buffer.from(JSON.stringify({
    userId: authData.user.id,
    householdId: memberData.household_id,
  })).toString('base64url')

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/google-calendar/callback`

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
