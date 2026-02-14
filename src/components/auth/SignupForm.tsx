import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

interface SignupFormProps {
  onSuccess: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [loading, setLoading] = useState(false)
  const usernameCheckTimer = useRef<NodeJS.Timeout | null>(null)

  const checkUsernameAvailability = useCallback(async (value: string) => {
    setCheckingUsername(true)
    try {
      const { data, error } = await supabase.rpc('check_username_available', {
        username_to_check: value,
      })

      if (error) {
        console.error('Username check error:', error)
        return
      }

      // data is true if available, false if taken
      if (data === false) {
        setUsernameError('Username is already taken')
      }
    } finally {
      setCheckingUsername(false)
    }
  }, [])

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setUsernameError('')

    if (usernameCheckTimer.current) {
      clearTimeout(usernameCheckTimer.current)
    }

    // Basic validation first
    if (value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value)) {
      usernameCheckTimer.current = setTimeout(() => {
        checkUsernameAvailability(value)
      }, 500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    if (usernameError) {
      setError(usernameError)
      return
    }

    // Final availability check right before submit (prevents race condition)
    if (usernameCheckTimer.current) {
      clearTimeout(usernameCheckTimer.current)
    }
    setLoading(true)

    const { data: isAvailable, error: rpcError } = await supabase.rpc('check_username_available', {
      username_to_check: username,
    })

    if (rpcError || isAvailable === false) {
      setUsernameError('Username is already taken')
      setError('Username is already taken. Please choose a different one.')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, username)
      onSuccess()
      // Force full page reload to pick up the new profile
      window.location.reload()
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('duplicate') || err.message?.includes('already taken')) {
        setError('Username is already taken. Please choose a different one.')
      } else {
        setError(err.message || 'Failed to create account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          required
          className={`w-full px-3 py-2 bg-white border rounded-lg text-slate-800 focus:outline-none focus:ring-2 ${
            usernameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          placeholder="Choose a username"
        />
        {checkingUsername && <p className="text-xs text-slate-400 mt-1">Checking availability...</p>}
        {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="Re-enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !!usernameError || checkingUsername}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
