import React, { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const handleAuth = async (endpoint) => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (res.ok) {
        if (endpoint === '/register') {
          setError('')
          setUsername('')
          setPassword('')
          setIsRegister(false)
          alert('✓ Registered! Please login.')
        } else {
          // Login successful
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', data.username)
          window.location.href = '/#/dashboard'
        }
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Server error. Is Node running on port 3000?')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 to-dark-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8 shadow-lg border border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8 text-dark-50">
          Attendance
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              onKeyPress={(e) => e.key === 'Enter' && handleAuth(isRegister ? '/register' : '/login')}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyPress={(e) => e.key === 'Enter' && handleAuth(isRegister ? '/register' : '/login')}
              className="w-full"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => handleAuth(isRegister ? '/register' : '/login')}
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? '...' : (isRegister ? 'Register' : 'Login')}
          </button>

          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
            }}
            className="btn-secondary w-full"
          >
            {isRegister ? 'Back to Login' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          {isRegister
            ? 'Register a new account to get started'
            : 'Login with your credentials'}
        </p>
      </div>
    </div>
  )
}
