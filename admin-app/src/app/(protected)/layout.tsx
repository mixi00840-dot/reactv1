"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import NotificationsBell from '@/components/NotificationsBell';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
        <div className="min-h-screen">
          <header data-cy="header" className="border-b bg-card">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <div className="font-semibold">Mixillo Admin</div>
              <nav className="flex items-center gap-4 text-sm">
                <Link data-cy="nav-dashboard" href="/dashboard" className="hover:underline">Dashboard</Link>
                <Link data-cy="nav-users" href="/users" className="hover:underline">Users</Link>
                <Link data-cy="nav-stores" href="/stores" className="hover:underline">Stores</Link>
                <Link data-cy="nav-products" href="/products" className="hover:underline">Products</Link>
                <Link data-cy="nav-orders" href="/orders" className="hover:underline">Orders</Link>
                <Link data-cy="nav-payments" href="/payments" className="hover:underline">Payments</Link>
                <Link data-cy="nav-wallets" href="/wallets" className="hover:underline">Wallets</Link>
                <Link data-cy="nav-coin-packages" href="/coin-packages" className="hover:underline">Coin Packages</Link>
                <Link data-cy="nav-levels" href="/levels" className="hover:underline">Levels</Link>
                <Link data-cy="nav-banners" href="/banners" className="hover:underline">Banners</Link>
                <Link data-cy="nav-content" href="/content" className="hover:underline">Content</Link>
                <Link data-cy="nav-comments" href="/comments" className="hover:underline">Comments</Link>
                <Link data-cy="nav-featured" href="/featured" className="hover:underline">Featured</Link>
                <Link data-cy="nav-tags" href="/tags" className="hover:underline">Tags</Link>
                <Link data-cy="nav-sounds" href="/sounds" className="hover:underline">Sounds</Link>
                <Link data-cy="nav-analytics" href="/analytics" className="hover:underline">Analytics</Link>
                <Link data-cy="nav-system" href="/system" className="hover:underline">System</Link>
              </nav>
              <div className="flex items-center gap-2">
                <NotificationsBell />
                <ThemeToggle />
              </div>
            </div>
          </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
