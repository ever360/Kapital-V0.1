import { Menu, Bell, User, LogOut, Sun, Moon } from 'lucide-react'
import { signOut } from '../../services/supabase'
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'

export default function Navbar({ onMenuClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    // Obtener datos del usuario
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar datos adicionales en la tabla usuarios
        const { data: userProfile } = await supabase
          .from('usuarios')
          .select('nombre, apellido, email')
          .eq('id', user.id)
          .single()

        setUserData({
          nombre: userProfile?.nombre || user.user_metadata?.nombre || 'Usuario',
          apellido: userProfile?.apellido || user.user_metadata?.apellido || '',
          email: user.email,
        })
      }
    }

    getUserData()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Obtener iniciales
  const getInitials = () => {
    if (!userData) return 'U'
    const firstInitial = userData.nombre?.charAt(0) || ''
    const lastInitial = userData.apellido?.charAt(0) || ''
    return (firstInitial + lastInitial).toUpperCase()
  }

  // Nombre completo
  const getFullName = () => {
    if (!userData) return 'Usuario'
    return `${userData.nombre} ${userData.apellido}`.trim()
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Kapital POS</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Avatar con iniciales */}
              <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                {getInitials()}
              </div>
              
              {/* Nombre completo - solo visible en pantallas medianas+ */}
              <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200">
                {getFullName()}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                {/* Información del usuario */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold">
                      {getInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getFullName()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userData?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opciones */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
