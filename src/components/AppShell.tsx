'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  Users,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/manual', label: 'Manual', icon: BookOpen },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/log', label: 'Daily Log', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface Props {
  member: { household_id: string; role: string; display_name: string | null }
  userEmail: string
  children: React.ReactNode
}

export default function AppShell({ member, userEmail, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const displayName = member.display_name ?? userEmail.split('@')[0]

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-200 fixed inset-y-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-stone-100">
          <div className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-stone-900 text-sm">Home Base</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-stone-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 bg-stone-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-stone-600">
                {displayName[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-800 truncate">{displayName}</p>
              <p className="text-xs text-stone-400 capitalize">{member.role}</p>
            </div>
            <button
              onClick={signOut}
              className="text-stone-400 hover:text-stone-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-stone-200 flex items-center px-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-stone-600 mr-3"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-stone-800 rounded-md flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-stone-900 text-sm">Home Base</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-56 bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-stone-100">
              <span className="font-semibold text-stone-900">Menu</span>
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-stone-100 p-3">
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
