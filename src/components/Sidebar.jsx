import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  HomeIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon
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
    navigate('/inventario', { 
      state: { filter: 'stock-bajo' } 
    })
  }

  const handleOrdenesActivasClick = () => {
    navigate('/ordenes', { 
      state: { filter: 'activas' } 
    })
  }

  return (
    <aside className="hidden md:block w-64 bg-gray-50 dark:bg-gray-900 min-h-screen border-r border-gray-200 dark:border-gray-800">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Navegación
          </h2>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
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

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Métricas Rápidas
          </h3>
          <div className="space-y-4">
            {/* Stock bajo - Ahora es clickable */}
            <button
              onClick={handleStockBajoClick}
              className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
              title="Ver productos con stock bajo"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Stock bajo
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Acción requerida
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    {metrics.stockBajo}
                  </span>
                )}
              </div>
            </button>

            {/* Órdenes activas - Ahora es clickable */}
            <button
              onClick={handleOrdenesActivasClick}
              className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
              title="Ver órdenes activas"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Órdenes activas
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      En proceso
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {metrics.ordenesActivas}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <ChartBarIcon className="w-5 h-5" />
            <span className="text-sm">Dashboard actualizado</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Haz clic en las métricas para ver detalles específicos
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar