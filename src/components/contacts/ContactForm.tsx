'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactRole } from '@/types/app'

const ROLES: ContactRole[] = [
  'pediatrician', 'dentist', 'veterinarian', 'plumber', 'electrician',
  'hvac', 'landscaper', 'housekeeper', 'school', 'extracurricular',
  'insurance', 'financial', 'emergency', 'family', 'friend', 'other',
]

const ROLE_LABELS: Record<ContactRole, string> = {
  pediatrician: 'Pediatrician', dentist: 'Dentist', veterinarian: 'Veterinarian',
  plumber: 'Plumber', electrician: 'Electrician', hvac: 'HVAC',
  landscaper: 'Landscaper', housekeeper: 'Housekeeper', school: 'School',
  extracurricular: 'Extracurricular', insurance: 'Insurance', financial: 'Financial',
  emergency: 'Emergency', family: 'Family', friend: 'Friend', other: 'Other',
}

interface Props {
  householdId: string
  userId: string
  isOwner: boolean
  contact?: Contact
}

export default function ContactForm({ householdId, userId, isOwner, contact }: Props) {
  const router = useRouter()
  const editing = !!contact

  const [name, setName] = useState(contact?.name ?? '')
  const [roleType, setRoleType] = useState<ContactRole>(contact?.role_type ?? 'other')
  const [company, setCompany] = useState(contact?.company ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [address, setAddress] = useState(contact?.address ?? '')
  const [website, setWebsite] = useState(contact?.website ?? '')
  const [accountNumber, setAccountNumber] = useState(contact?.account_number ?? '')
  const [availability, setAvailability] = useState(contact?.availability ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [isFavorite, setIsFavorite] = useState(contact?.is_favorite ?? false)
  const [ownerOnly, setOwnerOnly] = useState(contact?.owner_only ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      household_id: householdId,
      name: name.trim(),
      role_type: roleType,
      company: company.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      website: website.trim() || null,
      account_number: accountNumber.trim() || null,
      availability: availability.trim() || null,
      notes: notes.trim() || null,
      is_favorite: isFavorite,
      owner_only: ownerOnly,
    }

    if (editing) {
      const { error: err } = await supabase.from('contacts').update(payload).eq('id', contact!.id)
      if (err) { setError(err.message); setLoading(false); return }
      router.push(`/contacts/${contact!.id}`)
    } else {
      const { error: err } = await supabase.from('contacts').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
      router.push('/contacts')
    }
  }

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      {el}
    </div>
  )

  const input = (value: string, onChange: (v: string) => void, placeholder = '', type = 'text') => (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
    />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field('Name *', input(name, setName, 'Full name'))}

      {field('Role / Type',
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value as ContactRole)}
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      )}

      <div className="grid grid-cols-2 gap-4">
        {field('Company', input(company, setCompany, 'Optional'))}
        {field('Phone', input(phone, setPhone, '(555) 000-0000', 'tel'))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('Email', input(email, setEmail, 'email@example.com', 'email'))}
        {field('Website', input(website, setWebsite, 'https://'))}
      </div>

      {field('Address', input(address, setAddress, 'Street, City, State'))}
      {field('Availability', input(availability, setAvailability, 'e.g. Mon–Fri 8am–5pm'))}

      {isOwner && field('Account / Reference #', input(accountNumber, setAccountNumber, 'Policy number, account ID, etc.'))}

      {field('Notes',
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional notes..."
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
        />
      )}

      {/* Toggles */}
      <div className="space-y-3 pt-1">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-stone-700">Pin to top (favorite)</span>
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`relative w-10 h-6 rounded-full transition-colors ${isFavorite ? 'bg-stone-800' : 'bg-stone-200'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isFavorite ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </label>

        {isOwner && (
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-stone-700">Owner only</span>
              <p className="text-xs text-stone-400">Hidden from house manager</p>
            </div>
            <button
              type="button"
              onClick={() => setOwnerOnly(!ownerOnly)}
              className={`relative w-10 h-6 rounded-full transition-colors ${ownerOnly ? 'bg-stone-800' : 'bg-stone-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ownerOnly ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading || !name.trim()} className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : editing ? 'Save changes' : 'Add contact'}
        </button>
      </div>
    </form>
  )
}
