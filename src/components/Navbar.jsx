import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  ClockIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }
    return currentTime.toLocaleDateString('es-ES', optionsDate)
  }

  const formatTime = () => {
    const optionsTime = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    }
    return currentTime.toLocaleTimeString('es-ES', optionsTime)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/inventario', label: 'Inventario' },
    { path: '/ordenes', label: 'Órdenes' },
  ]

  return (
    <>
      <nav className="navbar sticky top-0 z-40">
        <div className="container-responsive">
          {/* Primera fila: Logo, menú móvil y usuario */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              {/* Botón menú móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Menú"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-base">SM</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                    System-Pro
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sistema de Gestión de Inventario
                  </p>
                </div>
              </Link>
            </div>

            {/* Fecha y hora - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span className="font-mono">{formatTime()}</span>
              </div>
            </div>

            {/* Usuario y controles */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Fecha y hora - Móvil */}
                <div className="md:hidden flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Botón modo oscuro */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {darkMode ? (
                    <span className="w-5 h-5 block">☀️</span>
                  ) : (
                    <span className="w-5 h-5 block">🌙</span>
                  )}
                </button>

                {/* Información usuario - Desktop */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Administrador
                  </p>
                </div>

                {/* Botón cerrar sesión */}
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  <span className="hidden sm:inline">Cerrar sesión</span>
                  <span className="sm:hidden">Salir</span>
                </button>
              </div>
            )}
          </div>

          {/* Segunda fila: Navegación - Desktop */}
          <div className="hidden md:flex items-center pb-2">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 shadow-xl animate-slide-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">SM</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 dark:text-white">System-pro</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Menú</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Información usuario móvil */}
              {user && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                    {user.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Administrador</p>
                </div>
              )}
            </div>

            {/* Navegación móvil */}
            <div className="p-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Información adicional móvil */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatDate()}</span>
                  <span className="font-mono">{formatTime()}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full btn-secondary py-3"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar