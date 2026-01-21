import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  ClockIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Cargar notificaciones
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    // Simular notificaciones (en producción, esto vendría de la API)
    const mockNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Stock bajo: Filtro de aceite',
        message: 'Quedan solo 2 unidades en inventario',
        time: 'Hace 5 minutos',
        read: false
      },
      {
        id: 2,
        type: 'info',
        title: 'Orden completada',
        message: 'Orden #ORD-00123 ha sido finalizada',
        time: 'Hace 30 minutos',
        read: true
      },
      {
        id: 3,
        type: 'urgent',
        title: 'Cliente espera repuesto',
        message: 'Juan Pérez espera la llegada de la cadena',
        time: 'Hace 1 hora',
        read: false
      }
    ]
    
    setNotifications(mockNotifications)
    setUnreadNotifications(mockNotifications.filter(n => !n.read).length)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
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
      hour12: false
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
  { path: '/calendario', label: 'Calendario' },
]
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm)}`)
      setSearchTerm('')
      setShowSearch(false)
    }
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    setUnreadNotifications(0)
  }

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
                className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                    Servi-Stock
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
              
                  </p>
                </div>
              </Link>
            </div>

            {/* Barra de búsqueda (desktop) */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar órdenes, productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field pl-9 sm:pl-10 py-1.5 text-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </form>
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

            {/* Controles de usuario */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Botón de búsqueda móvil */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Buscar"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>

                {/* Botón de notificaciones */}
                <div className="relative">
                  <button
                    onClick={() => navigate('/notificaciones')}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                    aria-label="Notificaciones"
                  >
                    <BellIcon className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                </div>

                {/* Botón modo oscuro */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <MoonIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Menú de usuario */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                        {user.email?.split('@')[0] || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Administrador
                      </p>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Menú desplegable del usuario */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {user.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email || 'admin@servimoto.cl'}
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => navigate('/perfil')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Mi perfil</span>
                        </button>
                        
                        <button
                          onClick={() => navigate('/configuracion')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          <span>Configuración</span>
                        </button>
                        
                        <button
                          onClick={() => navigate('/ayuda')}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <QuestionMarkCircleIcon className="w-4 h-4" />
                          <span>Ayuda y soporte</span>
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Barra de búsqueda móvil */}
          {showSearch && (
            <div className="md:hidden mt-3">
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar órdenes, productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field pl-9 sm:pl-10 py-1.5 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Segunda fila: Navegación - Desktop */}
          <div className="hidden md:flex items-center pb-2">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                  {item.path === '/inventario' && unreadNotifications > 0 && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                  )}
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
                    <h2 className="font-bold text-gray-800 dark:text-white">Servi-Stock</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Menú de navegación</p>
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
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {user.email?.split('@')[0] || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email || 'admin@servimoto.cl'}
                      </p>
                    </div>
                  </div>
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
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.path === '/' && <Cog6ToothIcon className="w-5 h-5" />}
                    {item.path === '/inventario' && <ExclamationTriangleIcon className="w-5 h-5" />}
                    {item.path === '/ordenes' && <BellIcon className="w-5 h-5" />}
                    <span className="font-medium">{item.label}</span>
                    {item.path === '/inventario' && unreadNotifications > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Notificaciones móvil */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notificaciones</h3>
                {unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-800/50' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                    }`}
                    onClick={() => {
                      navigate('/notificaciones')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`p-1 rounded ${
                        notification.type === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                        notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <BellIcon className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información adicional móvil */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formatDate()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="font-mono">{formatTime()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={toggleDarkMode}
                    className="flex-1 btn-secondary py-2 text-sm"
                  >
                    {darkMode ? 'Modo claro' : 'Modo oscuro'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 btn-primary py-2 text-sm"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menús */}
      {(mobileMenuOpen || userMenuOpen) && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => {
            setMobileMenuOpen(false)
            setUserMenuOpen(false)
          }}
        />
      )}
    </>
  )
}

export default Navbar