'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [householdName, setHouseholdName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'owner' | 'manager'>('owner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!householdName.trim() || !displayName.trim()) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Create household
    const { data: household, error: hError } = await supabase
      .from('households')
      .insert({ name: householdName.trim(), created_by: user.id })
      .select()
      .single()

    if (hError || !household) {
      setError(hError?.message ?? 'Failed to create household')
      setLoading(false)
      return
    }

    // Add member
    const { error: mError } = await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role,
      display_name: displayName.trim(),
    })

    if (mError) {
      setError(mError.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-stone-800 rounded-2xl mb-4">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">Welcome to Home Base</h1>
          <p className="text-stone-500 text-sm mt-1">Let's set up your household</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Household name</label>
            <input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. The Itano Home"
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Josh"
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Your role</label>
            <div className="flex rounded-lg border border-stone-200 p-1 gap-1">
              <button
                onClick={() => setRole('owner')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                  role === 'owner' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Owner / Family
              </button>
              <button
                onClick={() => setRole('manager')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                  role === 'manager' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                House Manager
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              {role === 'owner'
                ? 'Owners see all content including sensitive items.'
                : 'Managers see all operational content.'}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !householdName.trim() || !displayName.trim()}
            className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Create household'}
          </button>
        </div>
      </div>
    </div>
  )
}
