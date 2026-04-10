'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskCategory, TaskPriority, TaskStatus, RecurringRule } from '@/types/app'

const CATEGORIES: TaskCategory[] = ['errands', 'household', 'kids', 'dog', 'groceries', 'maintenance', 'admin', 'other']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]
const RECURRING: RecurringRule[] = ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually']

interface Props {
  task: Task
  members: { user_id: string; display_name: string | null }[]
  userId: string
}

export default function TaskEditClient({ task, members, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [category, setCategory] = useState<TaskCategory>(task.category)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? '')
  const [startDate, setStartDate] = useState(task.start_date ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [recurring, setRecurring] = useState<RecurringRule>(task.recurring_rule)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    const isDone = status === 'done'
    const wasNotDone = task.status !== 'done'

    const { error: err } = await supabase.from('tasks').update({
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      status,
      assigned_to: assignedTo || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      recurring_rule: recurring,
      completed_by: isDone && wasNotDone ? userId : isDone ? task.completed_by : null,
      completed_at: isDone && wasNotDone ? new Date().toISOString() : isDone ? task.completed_at : null,
    }).eq('id', task.id)

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/tasks')
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    setDeleting(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    router.push('/tasks')
    router.refresh()
  }

  const inputCls = 'w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800'

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional details..."
            className={cn(inputCls, 'resize-none')}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Status</label>
          <div className="flex rounded-xl border border-stone-200 overflow-hidden">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  status === s.value ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Assign to</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputCls}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.display_name ?? 'Unknown'}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Start date <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (dueDate && e.target.value > dueDate) setDueDate(e.target.value)
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Due date <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              min={startDate || undefined}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Recurring</label>
          <select value={recurring} onChange={(e) => setRecurring(e.target.value as RecurringRule)} className={inputCls}>
            {RECURRING.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

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
            disabled={saving || !title.trim()}
            className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-2.5 text-sm text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Delete task
        </button>
      </form>
    </div>
  )
}
