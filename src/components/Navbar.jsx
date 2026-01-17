import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  ClockIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Formatear fecha y hora
  const formatDate = () => {
    const optionsDate = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }
    return currentTime.toLocaleDateString('es-ES', optionsDate)
  }

  const formatTime = () => {
    const optionsTime = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }
    return currentTime.toLocaleTimeString('es-ES', optionsTime)
  }

  // Capitalizar primera letra
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        {/* Primera fila: Logo y usuario */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">SM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  Servi-Moto
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Taller mecánico especializado
                </p>
              </div>
            </Link>
          </div>

          {/* Información del usuario */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrador
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {darkMode ? (
                    <span className="w-5 h-5 block">☀️</span>
                  ) : (
                    <span className="w-5 h-5 block">🌙</span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Segunda fila: Navegación y fecha/hora */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          {/* Navegación */}
          {user && (
            <div className="flex items-center space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Panel 
              </Link>
              <Link 
                to="/inventario" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/inventario') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Inventario
              </Link>
              <Link 
                to="/ordenes" 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/ordenes') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Órdenes
              </Link>
            </div>
          )}

          {/* Fecha y hora */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-4 h-4" />
              <span>{capitalize(formatDate())}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="w-4 h-4" />
              <span className="font-mono font-medium">{formatTime()}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar