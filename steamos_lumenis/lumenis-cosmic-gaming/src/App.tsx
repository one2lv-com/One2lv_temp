import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import SupabaseProvider from './components/SupabaseProvider'
import Layout from './components/Layout'
import CosmicCanvas from './components/CosmicCanvas'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CoachPage from './pages/CoachPage'
import FighterPage from './pages/FighterPage'
import LeaderboardPage from './pages/LeaderboardPage'
import SettingsPage from './pages/SettingsPage'
import LoadingScreen from './components/LoadingScreen'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Initializing Lumenis Core..." />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
      />
      <Route
        path="/"
        element={user ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="cosmic" element={<CosmicCanvas />} />
        <Route path="coach" element={<CoachPage />} />
        <Route path="fighter" element={<FighterPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseProvider>
          <AuthProvider>
            <div className="min-h-screen bg-black text-white overflow-hidden">
              <CosmicBackground />
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
            </div>
          </AuthProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function CosmicBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <Suspense fallback={null}>
        <CosmicCanvas embedded />
      </Suspense>
    </div>
  )
}
