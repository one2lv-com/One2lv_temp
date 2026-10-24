import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  Bot,
  Gamepad2,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/cosmic', icon: Sparkles, label: 'Cosmic View' },
  { path: '/coach', icon: Bot, label: 'AI Coach' },
  { path: '/fighter', icon: Gamepad2, label: 'AI Fighter' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-black/80 backdrop-blur-sm border border-cyan-500/30 lg:hidden"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 min-h-screen
          backdrop-blur-xl bg-black/80 border-r border-cyan-500/20
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center cosmic-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold cosmic-text">LUMENIS</h1>
              <p className="text-xs text-cyan-400/70">Cosmic Gaming</p>
            </div>
          </div>

          {/* User info */}
          <div className="mb-8 p-4 rounded-lg holo-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                <span className="text-lg font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'G'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.username || 'Guest'}</p>
                <p className="text-xs text-cyan-400/70">
                  {user?.is_guest ? 'Guest Player' : 'Authenticated'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <button
            onClick={signOut}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg
              text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-auto relative z-10">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
