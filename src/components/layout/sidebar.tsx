'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Activity,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trades', label: 'Trades', icon: ArrowLeftRight },
  { href: '/signals', label: 'Signals', icon: Activity },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-16 flex-col items-center border-r border-border bg-[#0a0a0f]">
      <nav className="flex flex-1 flex-col items-center gap-1 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-md transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-primary" />
              )}
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <div className="pb-4">
        <span className="text-xs font-bold tracking-widest text-muted-foreground">
          TV
        </span>
      </div>
    </aside>
  );
}
