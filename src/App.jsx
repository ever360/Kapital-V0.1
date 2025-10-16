import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from './services/supabase'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import POS from './pages/POS.jsx'
import Inventory from './pages/Inventory.jsx'
import Purchases from './pages/Purchases.jsx'
import Sales from './pages/Sales.jsx'
import Customers from './pages/Customers.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

import Layout from './components/layout/Layout.jsx'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(user => setUser(user))
      .catch(err => console.error('Error getting user:', err))
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
