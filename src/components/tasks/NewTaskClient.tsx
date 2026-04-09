'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { TaskCategory, TaskPriority, RecurringRule } from '@/types/app'

const CATEGORIES: TaskCategory[] = ['errands', 'household', 'kids', 'dog', 'groceries', 'maintenance', 'admin', 'other']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const RECURRING: RecurringRule[] = ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually']

interface Props {
  householdId: string
  userId: string
  members: { user_id: string; display_name: string | null }[]
}

export default function NewTaskClient({ householdId, userId, members }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TaskCategory>('household')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assignedTo, setAssignedTo] = useState(userId)
  const [dueDate, setDueDate] = useState('')
  const [recurring, setRecurring] = useState<RecurringRule>('none')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('tasks').insert({
      household_id: householdId,
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      recurring_rule: recurring,
      created_by: userId,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/tasks')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional details..."
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Assign to</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.display_name ?? 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Recurring</label>
        <select
          value={recurring}
          onChange={(e) => setRecurring(e.target.value as RecurringRule)}
          className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
        >
          {RECURRING.map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create task'}
        </button>
      </div>
    </form>
  )
}
