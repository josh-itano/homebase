'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { InventoryItem, InventoryCategory } from '@/types/app'

const CATEGORIES: { value: InventoryCategory; label: string }[] = [
  { value: 'pantry', label: 'Pantry' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'kids', label: 'Kids' },
  { value: 'dog', label: 'Dog' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
]

const UNITS = ['count', 'rolls', 'bottles', 'boxes', 'bags', 'cans', 'jars', 'packs', 'lbs', 'oz', 'gallons', 'liters']

interface Props {
  householdId: string
  userId: string
  item?: InventoryItem
}

export default function InventoryForm({ householdId, userId, item }: Props) {
  const router = useRouter()
  const editing = !!item

  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? 'other')
  const [qty, setQty] = useState(String(item?.qty ?? '0'))
  const [unit, setUnit] = useState(item?.unit ?? 'count')
  const [minQty, setMinQty] = useState(String(item?.min_qty ?? '1'))
  const [brand, setBrand] = useState(item?.preferred_brand ?? '')
  const [whereToBuy, setWhereToBuy] = useState(item?.where_to_buy ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
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
      category,
      qty: parseFloat(qty) || 0,
      unit,
      min_qty: parseFloat(minQty) || 1,
      preferred_brand: brand.trim() || null,
      where_to_buy: whereToBuy.trim() || null,
      notes: notes.trim() || null,
    }

    if (editing) {
      const { error: err } = await supabase.from('inventory_items').update(payload).eq('id', item!.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('inventory_items').insert(payload)
      if (err) { setError(err.message); setLoading(false); return }
    }

    router.push('/inventory')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item?.name}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('inventory_items').delete().eq('id', item!.id)
    router.push('/inventory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Paper towels"
          required
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as InventoryCategory)}
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Quantity</label>
          <input
            type="number"
            min="0"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Min qty</label>
          <input
            type="number"
            min="0"
            step="1"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
        </div>
      </div>
      <p className="text-xs text-stone-400 -mt-3">You'll get a low-stock alert when quantity drops to or below the minimum.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Preferred brand</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Where to buy</label>
          <input
            value={whereToBuy}
            onChange={(e) => setWhereToBuy(e.target.value)}
            placeholder="e.g. Costco, Amazon"
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any additional notes..."
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading || !name.trim()} className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : editing ? 'Save changes' : 'Add item'}
        </button>
      </div>

      {editing && (
        <button type="button" onClick={handleDelete} className="w-full py-3 text-red-500 text-sm hover:text-red-700 transition-colors">
          Delete item
        </button>
      )}
    </form>
  )
}
