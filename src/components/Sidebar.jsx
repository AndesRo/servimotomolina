import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ArrowRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const { supabase } = useAppContext()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({
    stockBajo: 0,
    ordenesActivas: 0
  })
  const [loading, setLoading] = useState(true)

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Dashboard' },
    { path: '/inventario', icon: CubeIcon, label: 'Inventario' },
    { path: '/ordenes', icon: ClipboardDocumentListIcon, label: 'Órdenes' },
  ]

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      // Obtener productos bajo stock
      const { count: stockBajoCount } = await supabase
        .from('inventario')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 'stock_minimo')

      // Obtener órdenes activas
      const { count: ordenesActivasCount } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['Pendiente', 'En reparación'])

      setMetrics({
        stockBajo: stockBajoCount || 0,
        ordenesActivas: ordenesActivasCount || 0
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockBajoClick = () => {
    navigate('/inventario')
  }

  const handleOrdenesActivasClick = () => {
    navigate('/ordenes')
  }

  return (
    <aside className="sidebar hidden md:flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        {/* Logo y título en sidebar */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SM</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">System-Pro</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestión</p>
            </div>
          </div>

          {/* Navegación */}
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
            Navegación
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
            Métricas Rápidas
          </h3>
          <div className="space-y-3">
            {/* Stock bajo */}
            <button
              onClick={handleStockBajoClick}
              className="w-full bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer border border-gray-200 dark:border-gray-700 group"
              title="Ver productos con stock bajo"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Stock bajo
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Acción requerida
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {metrics.stockBajo}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                  </div>
                )}
              </div>
            </button>

            {/* Órdenes activas */}
            <button
              onClick={handleOrdenesActivasClick}
              className="w-full bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer border border-gray-200 dark:border-gray-700 group"
              title="Ver órdenes activas"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                    <WrenchScrewdriverIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Órdenes activas
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      En proceso
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {metrics.ordenesActivas}
                    </span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
            <ChartBarIcon className="w-5 h-5" />
            <span className="text-sm">Dashboard actualizado</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Haz clic en las métricas para ver detalles específicos
          </p>
          
          {/* Usuarios activos (simulado) */}
          <div className="mt-4 flex items-center space-x-2">
            <UserGroupIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">1 administrador activo</span>
          </div>
        </div>
      </div>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">System-Pro v3.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar