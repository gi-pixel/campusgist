'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Flag, Megaphone } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Posts', icon: FileText, exact: false },
  { href: '/admin/reports', label: 'Reports', icon: Flag, exact: false },
  { href: '/admin/post', label: 'Announce', icon: Megaphone, exact: false },
]

function useIsActive() {
  const pathname = usePathname() ?? ''
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

// Desktop: centered in the top bar
export function AdminTopNav({ reportCount }: { reportCount: number }) {
  const isActive = useIsActive()
  return (
    <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors ${
              active
                ? 'bg-[#1e1e1e] text-white'
                : 'text-[#6b6b6b] hover:bg-[#181818] hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
            {href === '/admin/reports' && reportCount > 0 && (
              <span className="rounded-full bg-[#ff3040] px-1.5 text-[11px] font-semibold leading-[18px] text-white">
                {reportCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// Phones and tablets: fixed to the bottom
export function AdminBottomNav({ reportCount }: { reportCount: number }) {
  const isActive = useIsActive()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#2a2a2a] bg-[#101010]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              active ? 'text-white' : 'text-[#6b6b6b] hover:text-white'
            }`}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
              {href === '/admin/reports' && reportCount > 0 && (
                <span className="absolute -right-2 -top-1.5 min-w-[16px] rounded-full bg-[#ff3040] px-1 text-center text-[10px] font-semibold leading-4 text-white">
                  {reportCount > 99 ? '99+' : reportCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}