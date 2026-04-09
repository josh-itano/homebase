'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  CalendarDays,
  Package,
  ClipboardList,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import type { Task, CalendarEvent, InventoryItem, DailyLog } from '@/types/app'

type Member = { user_id: string; display_name: string | null; role: string }

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-stone-600',
  low: 'text-stone-400',
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-stone-400',
  low: 'bg-stone-300',
}

interface Props {
  greeting: string
  displayName: string
  formattedDate: string
  role: 'owner' | 'manager'
  householdId: string
  userId: string
  todayTasks: Task[]
  overdueTasks: Task[]
  todayEvents: CalendarEvent[]
  lowStockItems: InventoryItem[]
  todayLog: DailyLog | null
  members: Member[]
}

export default function DashboardClient({
  greeting,
  displayName,
  formattedDate,
  role,
  userId,
  todayTasks,
  overdueTasks,
  todayEvents,
  lowStockItems,
  todayLog,
  members,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(todayTasks)
  const [overdue, setOverdue] = useState<Task[]>(overdueTasks)
  const [completing, setCompleting] = useState<string | null>(null)

  function getMemberName(uid: string | null) {
    if (!uid) return null
    return members.find((m) => m.user_id === uid)?.display_name ?? null
  }

  async function toggleTask(taskId: string, currentStatus: string, isOverdue = false) {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    setCompleting(taskId)

    const update = {
      status: newStatus as Task['status'],
      completed_by: newStatus === 'done' ? userId : null,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('tasks').update(update).eq('id', taskId)

    if (!error) {
      if (isOverdue) {
        setOverdue((prev) => prev.filter((t) => t.id !== taskId))
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...update } : t))
        )
      }
    }

    setCompleting(null)
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">
          {greeting}, {displayName}
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">{formattedDate}</p>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Today&apos;s progress</span>
            <span className="text-sm text-stone-500">{completedCount} / {totalCount}</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-800 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Overdue tasks */}
      {overdue.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">Overdue</h2>
          </div>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                completing={completing}
                memberName={getMemberName(task.assigned_to)}
                onToggle={() => toggleTask(task.id, task.status, true)}
                overdue
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Today&apos;s Tasks</h2>
          </div>
          <button
            onClick={() => router.push('/tasks/new')}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
            <p className="text-stone-400 text-sm">No tasks scheduled for today</p>
            <button
              onClick={() => router.push('/tasks/new')}
              className="mt-3 text-sm text-stone-700 font-medium hover:underline"
            >
              Add a task
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                completing={completing}
                memberName={getMemberName(task.assigned_to)}
                onToggle={() => toggleTask(task.id, task.status)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-stone-500" />
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Today&apos;s Events</h2>
          </div>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-1.5 h-8 bg-blue-400 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{event.title}</p>
                  {!event.all_day && event.start_time && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatTime(event.start_time)}
                      {event.end_time && ` – ${formatTime(event.end_time)}`}
                    </p>
                  )}
                </div>
                <span className="text-xs text-stone-400 capitalize flex-shrink-0">{event.category}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Low stock alerts */}
      {lowStockItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Low Stock</h2>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
            {lowStockItems.slice(0, 5).map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between px-4 py-3',
                  i < lowStockItems.length - 1 && 'border-b border-stone-100'
                )}
              >
                <p className="text-sm text-stone-800">{item.name}</p>
                <span className="text-xs text-amber-600 font-medium">
                  {item.qty} {item.unit} left
                </span>
              </div>
            ))}
            {lowStockItems.length > 5 && (
              <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={() => router.push('/inventory')}
                  className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                >
                  +{lowStockItems.length - 5} more <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Daily log */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-stone-500" />
          <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Daily Log</h2>
        </div>
        {todayLog ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            {todayLog.summary && (
              <p className="text-sm text-stone-700 line-clamp-3">{todayLog.summary}</p>
            )}
            <button
              onClick={() => router.push('/log')}
              className="mt-3 text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
            >
              View full log <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            {role === 'manager' ? (
              <>
                <p className="text-sm text-stone-500">No daily log yet — fill in today&apos;s update.</p>
                <button
                  onClick={() => router.push('/log/new')}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-stone-800 hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Write today&apos;s log
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-400">No log posted for today yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function TaskRow({
  task,
  completing,
  memberName,
  onToggle,
  overdue = false,
}: {
  task: Task
  completing: string | null
  memberName: string | null
  onToggle: () => void
  overdue?: boolean
}) {
  const done = task.status === 'done'
  const isCompleting = completing === task.id

  return (
    <div
      className={cn(
        'bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-opacity',
        overdue ? 'border-red-200' : 'border-stone-200',
        done && 'opacity-60'
      )}
    >
      <button
        onClick={onToggle}
        disabled={isCompleting}
        className="flex-shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
      >
        {isCompleting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : done ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', done ? 'line-through text-stone-400' : 'text-stone-900')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-xs capitalize', PRIORITY_COLORS[task.priority])}>
            {task.priority}
          </span>
          {memberName && (
            <span className="text-xs text-stone-400">→ {memberName}</span>
          )}
          {task.category !== 'other' && (
            <span className="text-xs text-stone-400 capitalize">{task.category}</span>
          )}
        </div>
      </div>

      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[task.priority])} />
    </div>
  )
}
