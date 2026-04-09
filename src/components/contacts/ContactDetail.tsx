'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Phone, Mail, MapPin, Globe, Star, Lock, ChevronLeft,
  Pencil, Plus, Trash2, Calendar,
} from 'lucide-react'
import type { Contact, ServiceHistory, ContactRole } from '@/types/app'

const ROLE_LABELS: Record<ContactRole, string> = {
  pediatrician: 'Pediatrician', dentist: 'Dentist', veterinarian: 'Veterinarian',
  plumber: 'Plumber', electrician: 'Electrician', hvac: 'HVAC',
  landscaper: 'Landscaper', housekeeper: 'Housekeeper', school: 'School',
  extracurricular: 'Extracurricular', insurance: 'Insurance', financial: 'Financial',
  emergency: 'Emergency', family: 'Family', friend: 'Friend', other: 'Other',
}

interface Props {
  contact: Contact
  history: ServiceHistory[]
  isOwner: boolean
  userId: string
}

export default function ContactDetail({ contact: initial, history: initialHistory, isOwner }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [contact, setContact] = useState(initial)
  const [history, setHistory] = useState(initialHistory)
  const [showAddService, setShowAddService] = useState(false)
  const [serviceDate, setServiceDate] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceNext, setServiceNext] = useState('')
  const [savingService, setSavingService] = useState(false)

  async function toggleFavorite() {
    const { error } = await supabase
      .from('contacts')
      .update({ is_favorite: !contact.is_favorite })
      .eq('id', contact.id)
    if (!error) setContact((c) => ({ ...c, is_favorite: !c.is_favorite }))
  }

  async function deleteContact() {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await supabase.from('contacts').delete().eq('id', contact.id)
    router.push('/contacts')
  }

  async function addServiceHistory() {
    if (!serviceDate || !serviceDesc.trim()) return
    setSavingService(true)
    const { data, error } = await supabase
      .from('service_history')
      .insert({
        contact_id: contact.id,
        date: serviceDate,
        description: serviceDesc.trim(),
        cost: serviceCost ? parseFloat(serviceCost) : null,
        next_visit: serviceNext || null,
      })
      .select()
      .single()

    if (!error && data) {
      setHistory((h) => [data as ServiceHistory, ...h])
      setShowAddService(false)
      setServiceDate(''); setServiceDesc(''); setServiceCost(''); setServiceNext('')
    }
    setSavingService(false)
  }

  async function deleteServiceEntry(id: string) {
    await supabase.from('service_history').delete().eq('id', id)
    setHistory((h) => h.filter((e) => e.id !== id))
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" /> Contacts
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleFavorite} className="text-stone-400 hover:text-amber-400 transition-colors">
            <Star className={`w-5 h-5 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          {isOwner && (
            <>
              <button onClick={() => router.push(`/contacts/${contact.id}/edit`)} className="text-stone-400 hover:text-stone-700 transition-colors">
                <Pencil className="w-5 h-5" />
              </button>
              <button onClick={deleteContact} className="text-stone-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-stone-600">{contact.name[0].toUpperCase()}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-stone-900">{contact.name}</h1>
            {contact.owner_only && <Lock className="w-4 h-4 text-stone-400" aria-label="Owner only" />}
          </div>
          <p className="text-stone-500 text-sm">
            {ROLE_LABELS[contact.role_type]}{contact.company ? ` · ${contact.company}` : ''}
          </p>
        </div>
      </div>

      {/* Contact actions */}
      {(contact.phone || contact.email) && (
        <div className="flex gap-3">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
            >
              <Phone className="w-4 h-4" /> {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-stone-200 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {[
          contact.address && { icon: MapPin, label: 'Address', value: contact.address },
          contact.website && { icon: Globe, label: 'Website', value: contact.website, href: contact.website },
          contact.availability && { icon: null, label: 'Availability', value: contact.availability },
          isOwner && contact.account_number && { icon: null, label: 'Account #', value: contact.account_number },
          contact.notes && { icon: null, label: 'Notes', value: contact.notes },
        ].filter(Boolean).map((item, i, arr) => {
          const row = item as { icon: React.ElementType | null; label: string; value: string; href?: string }
          return (
            <div key={i} className={`flex gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-stone-100' : ''}`}>
              {row.icon && <row.icon className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />}
              {!row.icon && <div className="w-4" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400 mb-0.5">{row.label}</p>
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                    {row.value}
                  </a>
                ) : (
                  <p className="text-sm text-stone-800 whitespace-pre-wrap">{row.value}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Service history */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Service History</h2>
          <button
            onClick={() => setShowAddService(!showAddService)}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add entry
          </button>
        </div>

        {showAddService && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Date *</label>
                <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Cost</label>
                <input type="number" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)}
                  placeholder="$0.00" className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Description *</label>
              <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} rows={2}
                placeholder="What was done?"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Next scheduled visit</label>
              <input type="date" value={serviceNext} onChange={(e) => setServiceNext(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddService(false)} className="flex-1 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={addServiceHistory} disabled={savingService || !serviceDate || !serviceDesc.trim()}
                className="flex-1 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
                {savingService ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-4">No service history yet</p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span className="text-xs text-stone-500">{entry.date}</span>
                      {isOwner && entry.cost != null && (
                        <span className="text-xs text-stone-500">${Number(entry.cost).toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-sm text-stone-800">{entry.description}</p>
                    {entry.next_visit && (
                      <p className="text-xs text-stone-400 mt-1">Next visit: {entry.next_visit}</p>
                    )}
                  </div>
                  <button onClick={() => deleteServiceEntry(entry.id)} className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
