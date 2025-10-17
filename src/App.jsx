import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase, getCurrentUser } from './services/supabase'
import { ThemeProvider } from './context/ThemeContext.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import SetupEmpresa from './pages/SetupEmpresa.jsx'
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
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkUser()
      } else {
        setUser(null)
        setUserData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (currentUser) {
        // Obtener datos adicionales del usuario
        const { data, error } = await supabase
          .from('usuarios')
          .select('empresa_id, rol_sistema, primer_login')
          .eq('id', currentUser.id)
          .single()

        if (!error && data) {
          setUserData(data)
        }
      }
    } catch (err) {
      console.error('Error getting user:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="spinner"></div>
      </div>
    )
  }

  // Componente para proteger rutas que requieren empresa configurada
  const RequireEmpresa = ({ children }) => {
    if (!user) return <Navigate to="/login" />
    
    // Super admin no necesita empresa
    if (userData?.rol_sistema === 'super_admin') {
      return children
    }

    // Si no tiene empresa configurada, redirigir a setup
    if (!userData?.empresa_id) {
      return <Navigate to="/setup" />
    }

    return children
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Ruta de configuración de empresa */}
          <Route 
            path="/setup" 
            element={
              user && !userData?.empresa_id && userData?.rol_sistema !== 'super_admin' 
                ? <SetupEmpresa /> 
                : <Navigate to="/" />
            } 
          />
          
          {/* Rutas privadas */}
          <Route element={<RequireEmpresa><Layout /></RequireEmpresa>}>
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
    </ThemeProvider>
  )
}

export default App
```


