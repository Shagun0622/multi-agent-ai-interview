
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Scorer from './pages/Scorer'
import ResumeBuilder from './pages/ResumeBuilder'
import InterviewStart from './pages/InterviewStart'
import InterviewPage from './pages/InterviewPage'
import InterviewReport from './pages/InterviewReport'
import Roadmap from './pages/Roadmap'
import Billing from './pages/Billing'

import { getCurrentUser } from './apis/user.api'
import { getResume } from './apis/resume.api'
import { setResume } from './redux/resumeSlice'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startupError, setStartupError] = useState(false)

  const dispatch = useDispatch()

  useEffect(() => {
    let cancelled = false

    const wait = (ms) =>
      new Promise(resolve => setTimeout(resolve, ms))

    

const warmupServices = async () => {
  const maxAttempts = 12

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 180000)

      let response

      try {
        response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/warmup`,
          {
            credentials: 'include',
            signal: controller.signal
          }
        )
      } finally {
        clearTimeout(timeout)
      }

      const result = await response.json()

      console.log(`Warmup attempt ${attempt}:`, result.services)

      if (result.ready && response.ok) {
        return true
      }
    } catch (error) {
      console.log(`Warmup attempt ${attempt}:`, error.message)
    }

    if (attempt < maxAttempts) {
      await wait(10000)
    }
  }

  return false
}



    const initializeApp = async () => {
      try {
        const ready = await warmupServices()

        if (!ready) {
          if (!cancelled) setStartupError(true)
          return
        }

        const data = await getCurrentUser()

        if (cancelled) return

        const currentUser = data?.user || null
        setUser(currentUser)

        if (currentUser) {
          try {
            const result = await getResume()
            if (!cancelled) {
              dispatch(setResume(result?.data))
            }
          } catch (error) {
            console.error('Resume loading failed:', error)
          }
        }
      } catch (error) {
        console.error('App initialization failed:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initializeApp()

    return () => {
      cancelled = true
    }
  }, [dispatch])

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-1 bg-black animate-pulse w-full fixed top-0" />
        <p className="text-sm text-gray-600">
          Waking up services... Please wait.
        </p>
      </div>
    )
  }

  if (startupError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Our servers are taking longer than expected to start.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Home setUser={setUser} />
        }
      />

      <Route
        path="/dashboard"
        element={
          user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/scorer"
        element={
          user ? <Scorer user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/resume"
        element={
          user ? <ResumeBuilder user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/interview"
        element={
          user ? <InterviewStart user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/interview/:id"
        element={
          user ? <InterviewPage user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/interview/:id/report"
        element={
          user ? <InterviewReport user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/roadmap"
        element={
          user ? <Roadmap user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />

      <Route
        path="/billing"
        element={
          user ? <Billing user={user} setUser={setUser} /> : <Navigate to="/" replace />
        }
      />
    </Routes>
  )
}

export default App
