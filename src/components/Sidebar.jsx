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
  UserGroupIcon,
  ArrowLeftEndOnRectangleIcon,
  PlusIcon,
  CalendarDaysIcon,  // Solo una vez aquí
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const Sidebar = () => {
  const { supabase } = useAppContext()
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({
    stockBajo: 0,
    ordenesActivas: 0,
    ordenesHoy: 0,
    ingresosMes: 0
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    fetchMetrics()
    fetchNotifications()
    
    const interval = setInterval(() => {
      fetchMetrics()
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      // Obtener productos bajo stock
      const { data: productos, error: productosError } = await supabase
        .from('inventario')
        .select('stock, stock_minimo')
      
      const stockBajo = productos?.filter(p => p.stock < p.stock_minimo).length || 0

      // Obtener órdenes activas
      const { data: ordenes, error: ordenesError } = await supabase
        .from('ordenes')
        .select('*')

      const hoy = new Date().toISOString().split('T')[0]
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const ordenesActivas = ordenes?.filter(o => ['Pendiente', 'En reparación'].includes(o.estado)).length || 0
      const ordenesHoy = ordenes?.filter(o => o.created_at.startsWith(hoy)).length || 0
      
      // Calcular ingresos del mes
      const ordenesMes = ordenes?.filter(o => o.created_at >= inicioMes && o.estado === 'Finalizada') || []
      const ingresosMes = ordenesMes.reduce((sum, orden) => {
        const totalRepuestos = orden.ordenes_repuestos?.reduce((s, rep) => 
          s + ((rep.inventario?.precio || 0) * (rep.cantidad || 0)), 0) || 0
        return sum + (orden.precio_servicio || 0) + (orden.precio_mano_obra || 0) + totalRepuestos
      }, 0)

      setMetrics({
        stockBajo,
        ordenesActivas,
        ordenesHoy,
        ingresosMes
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      // Obtener productos con stock crítico (menos de 2 unidades o menos del 20% del mínimo)
      const { data: productosCriticos } = await supabase
        .from('inventario')
        .select('nombre, stock, stock_minimo')
        .or('stock.lt.2,stock.lt.stock_minimo*0.2')
        .limit(5)

      // Obtener órdenes urgentes (pendientes por más de 2 días)
      const dosDiasAtras = new Date()
      dosDiasAtras.setDate(dosDiasAtras.getDate() - 2)
      
      const { data: ordenesUrgentes } = await supabase
        .from('ordenes')
        .select('id, cliente_nombre, created_at')
        .eq('estado', 'Pendiente')
        .lt('created_at', dosDiasAtras.toISOString())
        .limit(3)

      const notificaciones = [
        ...(productosCriticos?.map(p => ({
          id: `stock-${p.nombre}`,
          type: 'warning',
          title: `Stock crítico: ${p.nombre}`,
          message: `Solo quedan ${p.stock} unidades (mínimo: ${p.stock_minimo})`,
          time: 'Reciente',
          action: '/inventario'
        })) || []),
        ...(ordenesUrgentes?.map(o => ({
          id: `orden-${o.id}`,
          type: 'urgent',
          title: `Orden urgente: ${o.cliente_nombre}`,
          message: 'Pendiente por más de 2 días',
          time: 'Reciente',
          action: `/ordenes`
        })) || [])
      ]

      setNotifications(notificaciones)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Dashboard', badge: null },
    { path: '/inventario', icon: CubeIcon, label: 'Inventario', badge: metrics.stockBajo > 0 ? metrics.stockBajo : null },
    { path: '/ordenes', icon: ClipboardDocumentListIcon, label: 'Órdenes', badge: metrics.ordenesActivas },
    { path: '/calendario', icon: CalendarDaysIcon, label: 'Calendario', badge: null },
  ]

  const handleStockBajoClick = () => {
    navigate('/inventario')
  }

  const handleOrdenesActivasClick = () => {
    navigate('/ordenes')
  }

  const quickActions = [
    { 
      label: 'Nueva Orden', 
      icon: PlusIcon, 
      onClick: () => navigate('/ordenes?new=true'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      label: 'Agregar Producto', 
      icon: CubeIcon, 
      onClick: () => navigate('/inventario?new=true'),
      color: 'bg-green-500 hover:bg-green-600'
    },
  
  ]

  return (
    <aside className={`sidebar hidden md:flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Botón para colapsar/expandir */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:shadow-lg z-10"
      >
        <ArrowLeftEndOnRectangleIcon className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className="flex-1 p-4 sm:p-6">
        {/* Logo y título */}
        {!sidebarCollapsed && (
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">SM</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Servi-Stock</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestion de Inventario</p>
              </div>
            </div>

            {/* Navegación */}
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
              Navegación
            </h3>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge !== null && item.badge > 0 && (
                        <span className={`absolute right-3 px-2 py-0.5 text-xs rounded-full ${
                          item.path === '/inventario' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {sidebarCollapsed ? (
          // Vista colapsada
          <div className="space-y-4 mt-8">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center p-3 rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
                title={item.label}
              >
                <item.icon className="w-6 h-6" />
                {item.badge !== null && item.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center ${
                    item.path === '/inventario' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ) : (
          // Vista expandida
          <>
            {/* Acciones rápidas */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`${action.color} text-white p-2 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md hover:scale-105`}
                  >
                    <action.icon className="w-4 h-4 mb-1" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                Estado Actual
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
                          Requiere atención
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

                {/* Ingresos del mes */}
                <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg shadow-sm text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">Ingresos mensuales</p>
                        <p className="text-xs opacity-90">Este mes</p>
                      </div>
                    </div>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span className="text-lg font-bold">
                        ${metrics.ingresosMes.toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notificaciones */}
            {notifications.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Alertas
                  </h3>
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                      onClick={() => navigate(notification.action)}
                    >
                      <div className="flex items-start space-x-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                <ChartBarIcon className="w-4 h-4" />
                <span className="text-xs">Actualizado hace unos segundos</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                Haz clic en las métricas para ver detalles
              </p>
              
              {/* Usuarios activos */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Usuarios activos:</span>
                </div>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">1</span>
              </div>

              {/* Órdenes hoy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Órdenes hoy:</span>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {metrics.ordenesHoy}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer del sidebar - Solo información de versión */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Servi-Stock v3.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">© {new Date().getFullYear()}</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar