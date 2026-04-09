'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Phone, Mail, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Contact, ContactRole } from '@/types/app'

const ROLE_LABELS: Record<ContactRole, string> = {
  pediatrician: 'Pediatrician', dentist: 'Dentist', veterinarian: 'Vet',
  plumber: 'Plumber', electrician: 'Electrician', hvac: 'HVAC',
  landscaper: 'Landscaper', housekeeper: 'Housekeeper', school: 'School',
  extracurricular: 'Extracurricular', insurance: 'Insurance', financial: 'Financial',
  emergency: 'Emergency', family: 'Family', friend: 'Friend', other: 'Other',
}

const ROLE_GROUPS: { label: string; roles: ContactRole[] }[] = [
  { label: 'Medical', roles: ['pediatrician', 'dentist', 'veterinarian'] },
  { label: 'Home Services', roles: ['plumber', 'electrician', 'hvac', 'landscaper', 'housekeeper'] },
  { label: 'School & Activities', roles: ['school', 'extracurricular'] },
  { label: 'Financial & Legal', roles: ['insurance', 'financial'] },
  { label: 'Personal', roles: ['family', 'friend', 'emergency'] },
  { label: 'Other', roles: ['other'] },
]

interface Props {
  contacts: Contact[]
  role: 'owner' | 'manager'
}

export default function ContactsClient({ contacts, role }: Props) {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<ContactRole | 'all'>('all')

  const visible = contacts.filter((c) => {
    if (role === 'manager' && c.owner_only) return false
    if (filterRole !== 'all' && c.role_type !== filterRole) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.role_type.toLowerCase().includes(q)
      )
    }
    return true
  })

  const favorites = visible.filter((c) => c.is_favorite)
  const rest = visible.filter((c) => !c.is_favorite)

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400 text-sm">No contacts yet</p>
        <Link href="/contacts/new" className="mt-2 inline-block text-sm text-stone-700 font-medium hover:underline">
          Add your first contact
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent bg-white"
        />
      </div>

      {/* Role filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => setFilterRole('all')}
          className={cn('flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
            filterRole === 'all' ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600')}
        >
          All
        </button>
        {ROLE_GROUPS.map((g) => (
          <button
            key={g.label}
            onClick={() => setFilterRole(filterRole === g.roles[0] ? 'all' : g.roles[0])}
            className={cn('flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              g.roles.includes(filterRole as ContactRole) ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600')}
          >
            {g.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-8">No contacts match your search</p>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">Pinned</p>
          <div className="space-y-2">
            {favorites.map((c) => <ContactRow key={c.id} contact={c} />)}
          </div>
        </section>
      )}

      {/* Rest — grouped alphabetically */}
      {rest.length > 0 && (
        <section>
          {favorites.length > 0 && (
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 px-1">All contacts</p>
          )}
          <div className="space-y-2">
            {rest.map((c) => <ContactRow key={c.id} contact={c} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ContactRow({ contact: c }: { contact: Contact }) {
  return (
    <Link
      href={`/contacts/${c.id}`}
      className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3 hover:bg-stone-50 transition-colors"
    >
      <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-stone-600">{c.name[0].toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-stone-900 truncate">{c.name}</p>
          {c.is_favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-stone-400 truncate">
          {ROLE_LABELS[c.role_type]}{c.company ? ` · ${c.company}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {c.phone && (
          <a
            href={`tel:${c.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        {c.email && (
          <a
            href={`mailto:${c.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    </Link>
  )
}
