import { useState } from 'react'
import { User, Bell, Volume2, Monitor, Palette, Save, Github, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SteamIntegration from '../components/SteamIntegration'

export default function SettingsPage() {
  const { user, updateUser, signOut } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [notifications, setNotifications] = useState(true)
  const [soundEffects, setSoundEffects] = useState(true)
  const [voiceNarration, setVoiceNarration] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    if (!username.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' })
      return
    }

    setSaving(true)
    try {
      await updateUser({ username: username.trim() })
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center cosmic-glow">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold cosmic-text">Settings</h1>
          <p className="text-sm text-cyan-400/70">Configure your cosmic experience</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-cyan-400" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-cyan-500/30
                focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50
                outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Account Type</label>
            <div className="px-4 py-3 rounded-lg bg-black/30 text-gray-300">
              {user?.is_guest ? 'Guest Player (Cloud Vault Active)' : 'Authenticated Player'}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Member Since</label>
            <div className="px-4 py-3 rounded-lg bg-black/30 text-gray-300">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          Notifications
        </h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Push Notifications"
            description="Receive notifications for matches and achievements"
            checked={notifications}
            onChange={setNotifications}
          />
          <ToggleSetting
            label="Sound Effects"
            description="Play sound effects during gameplay"
            checked={soundEffects}
            onChange={setSoundEffects}
          />
          <ToggleSetting
            label="AI Voice Narration"
            description="Enable AI Coach voice commentary"
            checked={voiceNarration}
            onChange={setVoiceNarration}
          />
        </div>
      </div>

      {/* Display */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-cyan-400" />
          Display
        </h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Dark Mode"
            description="Use dark cosmic theme"
            checked={darkMode}
            onChange={setDarkMode}
          />
          <div>
            <label className="block text-sm text-gray-400 mb-2">Visual Effects</label>
            <select className="w-full px-4 py-3 rounded-lg bg-black/50 border border-cyan-500/30
              focus:border-cyan-500 outline-none">
              <option value="high">High (Bloom, Particles)</option>
              <option value="medium">Medium</option>
              <option value="low">Low (Performance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Steam Integration */}
      <SteamIntegration />

      {/* Integrations */}
      <div className="p-6 rounded-lg holo-panel">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-cyan-400" />
          Integrations
        </h2>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black/30
            hover:bg-black/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Steam</p>
                <p className="text-sm text-gray-500">{user?.steam_id ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs ${user?.steam_id ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {user?.steam_id ? 'Connected' : 'Connect'}
            </span>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black/30
            hover:bg-black/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Discord</p>
                <p className="text-sm text-gray-500">{user?.discord_id ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs ${user?.discord_id ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {user?.discord_id ? 'Connected' : 'Connect'}
            </span>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-black/30
            hover:bg-black/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.286 4.714h5.715L6 9.429zM1.286 14.286h1.715v5.143H1.286zm8.285 0H11.571v5.143h1.714V14.286zm5.715-9.572h5.143v1.715h-5.143zm0 9.572h5.143v1.715h-5.143z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Twitch</p>
                <p className="text-sm text-gray-500">Streaming integration</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 btn-cosmic flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="animate-spin">⟳</span>
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleSignOut}
          className="px-6 py-3 rounded-lg border border-red-500/30 text-red-400
            hover:bg-red-500/10 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Quote */}
      <div className="text-center text-sm text-cyan-400/50 italic">
        "By the spark of Tesla and the tears of Darlene. You are One2lv."
      </div>
    </div>
  )
}

interface ToggleSettingProps {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}

function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-cyan-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  )
}
