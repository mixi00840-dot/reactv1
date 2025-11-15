"use client"
import { useEffect, useState } from 'react'
import Button from '@/components/ui/button'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'))

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
      {theme === 'dark' ? '🌙' : '☀️'}
    </Button>
  )
}
