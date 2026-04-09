'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Loader2, AlertTriangle } from 'lucide-react'
import { cn, isPast, todayISO } from '@/lib/utils'
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types/app'

type Member = { user_id: string; display_name: string | null }

const CATEGORIES: TaskCategory[] = ['errands', 'household', 'kids', 'dog', 'groceries', 'maintenance', 'admin', 'other']
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600 bg-red-50',
  high: 'text-orange-500 bg-orange-50',
  medium: 'text-stone-600 bg-stone-100',
  low: 'text-stone-400 bg-stone-50',
}

interface Props {
  initialTasks: Task[]
  members: Member[]
  userId: string
  householdId: string
}

export default function TasksClient({ initialTasks, members, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [completing, setCompleting] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  function getMemberName(uid: string | null) {
    if (!uid) return null
    return members.find((m) => m.user_id === uid)?.display_name ?? null
  }

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    setCompleting(taskId)

    const update = {
      status: newStatus,
      completed_by: newStatus === 'done' ? userId : null,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('tasks').update(update).eq('id', taskId)
    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...update } as Task : t)))
    }
    setCompleting(null)
  }

  const filtered = tasks.filter((t) => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterAssignee !== 'all' && t.assigned_to !== filterAssignee) return false
    return true
  })

  const today = todayISO()

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 flex-shrink-0"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TaskCategory | 'all')}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 flex-shrink-0"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 flex-shrink-0"
        >
          <option value="all">Anyone</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name ?? 'Unknown'}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <p className="text-sm">No tasks found</p>
          <button
            onClick={() => router.push('/tasks/new')}
            className="mt-2 text-sm text-stone-700 font-medium hover:underline"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue = task.due_date && isPast(task.due_date) && task.status !== 'done'
            const isToday = task.due_date === today
            const done = task.status === 'done'

            return (
              <div
                key={task.id}
                className={cn(
                  'bg-white rounded-xl border px-4 py-3 flex items-start gap-3',
                  isOverdue ? 'border-red-200' : 'border-stone-200',
                  done && 'opacity-60'
                )}
              >
                <button
                  onClick={() => toggleTask(task.id, task.status)}
                  disabled={completing === task.id}
                  className="flex-shrink-0 mt-0.5 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {completing === task.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <p className={cn(
                    'text-sm font-medium',
                    done ? 'line-through text-stone-400' : 'text-stone-900'
                  )}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize font-medium', PRIORITY_COLORS[task.priority])}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-stone-400 capitalize">{task.category}</span>
                    {getMemberName(task.assigned_to) && (
                      <span className="text-xs text-stone-400">→ {getMemberName(task.assigned_to)}</span>
                    )}
                    {task.due_date && (
                      <span className={cn(
                        'text-xs',
                        isOverdue ? 'text-red-500 font-medium' : isToday ? 'text-blue-500' : 'text-stone-400'
                      )}>
                        {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                        {task.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
