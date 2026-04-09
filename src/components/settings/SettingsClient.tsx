'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, UserPlus, Trash2, Crown, User, ChevronDown } from 'lucide-react'
import type { HouseholdInvite } from '@/types/app'

interface Member {
  id: string
  user_id: string
  display_name: string | null
  role: string
  joined_at: string
}

interface Props {
  household: { id: string; name: string }
  members: Member[]
  invites: HouseholdInvite[]
  currentUserId: string
  householdId: string
}

export default function SettingsClient({ household, members: initialMembers, invites, currentUserId, householdId }: Props) {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [activeInvites, setActiveInvites] = useState<HouseholdInvite[]>(invites)
  const [newRole, setNewRole] = useState<'owner' | 'manager'>('manager')
  const [creating, setCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  async function changeRole(member: Member, newMemberRole: 'owner' | 'manager') {
    setRoleMenuOpen(null)
    const { error: err } = await supabase
      .from('household_members')
      .update({ role: newMemberRole })
      .eq('id', member.id)

    if (!err) {
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newMemberRole } : m))
    }
  }

  async function removeMember(member: Member) {
    if (!confirm(`Remove ${member.display_name ?? 'this member'} from the household?`)) return
    setRemoving(member.id)
    await supabase.from('household_members').delete().eq('id', member.id)
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    setRemoving(null)
  }

  async function createInvite() {
    setCreating(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('household_invites')
      .insert({ household_id: householdId, role: newRole, created_by: currentUserId })
      .select()
      .single()

    if (err) {
      setError(err.message)
    } else if (data) {
      setActiveInvites((prev) => [data as HouseholdInvite, ...prev])
    }
    setCreating(false)
  }

  async function revokeInvite(id: string) {
    await supabase.from('household_invites').delete().eq('id', id)
    setActiveInvites((prev) => prev.filter((i) => i.id !== id))
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/join/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  function formatExpiry(expiresAt: string) {
    const d = new Date(expiresAt)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-8" onClick={() => setRoleMenuOpen(null)}>
      {/* Household name */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Household</h2>
        <div className="bg-white rounded-2xl border border-stone-200 px-4 py-3">
          <p className="text-stone-900 font-medium">{household.name}</p>
        </div>
      </section>

      {/* Members */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Members</h2>
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {members.map((m, i) => {
            const isSelf = m.user_id === currentUserId
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < members.length - 1 ? 'border-b border-stone-100' : ''}`}
              >
                <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-stone-600">
                    {(m.display_name ?? '?')[0].toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">
                    {m.display_name ?? 'Unknown'}
                    {isSelf && <span className="text-stone-400 font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-stone-400 capitalize">{m.role}</p>
                </div>

                {isSelf ? (
                  /* Can't modify yourself */
                  m.role === 'owner'
                    ? <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    : <User className="w-4 h-4 text-stone-300 flex-shrink-0" />
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Role picker */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setRoleMenuOpen(roleMenuOpen === m.id ? null : m.id)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors capitalize"
                      >
                        {m.role === 'owner' ? <Crown className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3" />}
                        {m.role}
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>
                      {roleMenuOpen === m.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[130px]">
                          {(['owner', 'manager'] as const).filter((r) => r !== m.role).map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(m, r)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors capitalize"
                            >
                              {r === 'owner' ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-stone-400" />}
                              Make {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeMember(m)}
                      disabled={removing === m.id}
                      className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-30"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Invite link generator */}
      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Invite Someone</h2>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Role for new member</label>
            <div className="flex rounded-lg border border-stone-200 p-1 gap-1">
              <button
                onClick={() => setNewRole('manager')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                  newRole === 'manager' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                House Manager
              </button>
              <button
                onClick={() => setNewRole('owner')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-colors ${
                  newRole === 'owner' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Owner
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={createInvite}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {creating ? 'Generating...' : 'Generate invite link'}
          </button>
        </div>
      </section>

      {/* Active invite links */}
      {activeInvites.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Active Invite Links</h2>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {activeInvites.map((invite, i) => (
              <div
                key={invite.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < activeInvites.length - 1 ? 'border-b border-stone-100' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 capitalize">{invite.role} invite</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Expires {formatExpiry(invite.expires_at)}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(invite.token)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors flex-shrink-0"
                >
                  {copiedToken === invite.token
                    ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy link</>
                  }
                </button>
                <button
                  onClick={() => revokeInvite(invite.id)}
                  className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Revoke invite"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-2 px-1">
            Share these links with the people you want to invite. Each link can only be used once.
          </p>
        </section>
      )}
    </div>
  )
}
