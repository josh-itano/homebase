import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EventForm from '@/components/calendar/EventForm'
import type { CalendarEvent } from '@/types/app'

interface Props { params: Promise<{ id: string }> }

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect('/auth/login')

  const { data: eventRaw } = await supabase.from('events').select('*').eq('id', id).limit(1)
  const event = eventRaw?.[0] as CalendarEvent | undefined
  if (!event) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Edit Event</h1>
      <EventForm item={event} />
    </div>
  )
}
