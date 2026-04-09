import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventForm from '@/components/calendar/EventForm'

interface Props { searchParams: Promise<{ date?: string }> }

export default async function NewEventPage({ searchParams }: Props) {
  const { date } = await searchParams
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) redirect('/auth/login')

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Add Event</h1>
      <EventForm defaultDate={date} />
    </div>
  )
}
