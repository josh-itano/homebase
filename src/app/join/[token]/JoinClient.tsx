'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Loader2 } from 'lucide-react'

interface Invite {
  id: string
  household_id: string
  role: string
  expires_at: string
  used_at: string | null
}

interface Household {
  id: string
  name: string
}

export default function JoinClient({ token }: { token: string }) {
  const router = useRouter()
  const [invite, setInvite] = useState<Invite | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'joining' | 'done' | 'error'>('loading')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInvite() {
      const supabase = createClient()

      const { data: inviteData } = await supabase
        .from('household_invites')
        .select('*')
        .eq('token', token)
        .single()

      if (!inviteData || inviteData.used_at || new Date(inviteData.expires_at) < new Date()) {
        setStatus('invalid')
        return
      }

      const { data: householdData } = await supabase
        .from('households')
        .select('id, name')
        .eq('id', (inviteData as Invite).household_id)
        .single()

      setInvite(inviteData as Invite)
      setHousehold(householdData as Household)
      setStatus('ready')
    }

    loadInvite()
  }, [token])

  async function handleJoin() {
    if (!invite || !displayName.trim()) return
    setStatus('joining')
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not logged in — use OAuth so we return to this page with a session
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/join/${token}` },
      })
      return
    }

    // Check they're not already a member
    const { data: existing } = await supabase
      .from('household_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('household_id', invite.household_id)
      .limit(1)

    if (existing && existing.length > 0) {
      // Already a member — just go to dashboard
      router.push('/')
      return
    }

    // Add to household
    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: invite.household_id,
      user_id: user.id,
      role: invite.role,
      display_name: displayName.trim(),
    })

    if (memberError) {
      setError(memberError.message)
      setStatus('ready')
      return
    }

    // Mark invite as used
    await supabase
      .from('household_invites')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)

    router.push('/')
  }

  async function handleSignIn(provider: 'google') {
    const supabase = createClient()
    sessionStorage.setItem('pendingInviteToken', token)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/join/${token}` },
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-stone-800 rounded-2xl mb-4">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Invite not found</h1>
          <p className="text-stone-500 text-sm">This invite link has expired, already been used, or doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-stone-800 rounded-2xl mb-4">
            <Home className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">You&apos;re invited</h1>
          <p className="text-stone-500 text-sm mt-1">
            Join <span className="font-medium text-stone-700">{household?.name}</span> as {invite?.role === 'owner' ? 'an owner' : 'a house manager'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maria"
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={status === 'joining' || !displayName.trim()}
            className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'joining' && <Loader2 className="w-4 h-4 animate-spin" />}
            Accept invite
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-stone-400">not signed in? sign in with</span>
            </div>
          </div>

          <button
            onClick={() => handleSignIn('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-stone-200 rounded-xl text-stone-700 font-medium hover:bg-stone-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
