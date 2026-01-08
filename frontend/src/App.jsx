import React, { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check for hash-based routing
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove #
      const route = hash.split('/')[1] || 'login'
      setCurrentPage(route)
    }

    // Check initial route
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    setIsChecking(false)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // If checking initial state or loading, show loading
  if (isChecking) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-dark-50">Loading...</div>
      </div>
    )
  }

  // Route to different pages
  if (currentPage === 'login' || !localStorage.getItem('token')) {
    return <LoginPage />
  }

  if (currentPage === 'dashboard') {
    return <DashboardPage />
  }

  // Default to dashboard if authenticated, otherwise login
  return <DashboardPage />
}
