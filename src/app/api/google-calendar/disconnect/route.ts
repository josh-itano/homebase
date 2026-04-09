import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('google_calendar_tokens').delete().eq('user_id', authData.user.id)

  return NextResponse.json({ ok: true })
}
