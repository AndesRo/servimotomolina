import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { CubeIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    ordenesPendientes: 0,
    ordenesHoy: 0
  })
  const [recentOrdenes, setRecentOrdenes] = useState([])
  const [recentProductos, setRecentProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas
      const { count: totalProductos } = await supabase
        .from('inventario')
        .select('*', { count: 'exact', head: true })

      const { data: productos } = await supabase
        .from('inventario')
        .select('*')

      const productosBajoStock = productos?.filter(p => p.stock < p.stock_minimo).length || 0

      const { count: ordenesPendientes } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['Pendiente', 'En reparación'])

      const hoy = new Date().toISOString().split('T')[0]
      const { count: ordenesHoy } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hoy)

      // Obtener órdenes recientes
      const { data: ordenes } = await supabase
        .from('ordenes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Obtener productos recientes
      const { data: productosRecientes } = await supabase
        .from('inventario')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4)

      setStats({
        totalProductos: totalProductos || 0,
        productosBajoStock,
        ordenesPendientes: ordenesPendientes || 0,
        ordenesHoy: ordenesHoy || 0
      })

      setRecentOrdenes(ordenes || [])
      setRecentProductos(productosRecientes || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card transform-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 dark:text-white">
            {loading ? '...' : value}
          </p>
          {trend && (
            <div className={`flex items-center mt-1 text-xs ${trend.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value > 0 ? (
                <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
              )}
              {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  )

  const handleGoToOrdenes = () => {
    navigate('/ordenes')
  }

  const handleGoToInventario = () => {
    navigate('/inventario')
  }

  const handleGenerateReport = () => {
    alert('Función de generación de reporte diario. Próximamente disponible.')
  }

  if (loading && !stats.totalProductos) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Panel de Control</h1>
        <p className="page-subtitle">
          Resumen general del taller • Actualizado hace unos momentos
        </p>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid-responsive mb-6">
        <StatCard
          title="Total Productos"
          value={stats.totalProductos}
          icon={CubeIcon}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          trend={{ value: 2, label: 'este mes' }}
        />
        
        <StatCard
          title="Productos bajo stock"
          value={stats.productosBajoStock}
          icon={ExclamationTriangleIcon}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          trend={{ value: -1, label: 'desde ayer' }}
        />
        
        <StatCard
          title="Órdenes pendientes"
          value={stats.ordenesPendientes}
          icon={WrenchScrewdriverIcon}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          trend={{ value: 3, label: 'activas' }}
        />
        
        <StatCard
          title="Órdenes hoy"
          value={stats.ordenesHoy}
          icon={CheckCircleIcon}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          trend={{ value: 2, label: 'vs ayer' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Órdenes recientes */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Órdenes recientes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Últimas 5 órdenes de trabajo
              </p>
            </div>
            <button
              onClick={() => navigate('/ordenes')}
              className="btn-secondary flex items-center justify-center gap-1 sm:gap-2 text-sm"
            >
              Ver todas <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Encabezados de tabla - Desktop */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-2">
                <div className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</div>
                <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300">Moto</div>
                <div className="col-span-3 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</div>
                <div className="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">Fecha</div>
              </div>
              
              {/* Lista de órdenes */}
              <div className="space-y-2">
                {recentOrdenes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay órdenes recientes
                  </div>
                ) : (
                  recentOrdenes.map((orden) => (
                    <div key={orden.id} className="card-flat hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="sm:hidden">
                        {/* Vista móvil */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{orden.cliente_nombre}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{orden.moto_marca} {orden.moto_modelo}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            orden.estado === 'Finalizada' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                              : orden.estado === 'En reparación'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {orden.estado}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(orden.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Vista desktop */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <p className="font-medium text-gray-900 dark:text-white">{orden.cliente_nombre}</p>
                          {orden.cliente_telefono && (
                            <p className="text-xs text-gray-500">{orden.cliente_telefono}</p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-700 dark:text-gray-300">{orden.moto_marca} {orden.moto_modelo}</p>
                        </div>
                        <div className="col-span-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            orden.estado === 'Finalizada' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                              : orden.estado === 'En reparación'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {orden.estado}
                          </span>
                        </div>
                        <div className="col-span-2 text-right text-sm text-gray-600 dark:text-gray-400">
                          {new Date(orden.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas y productos */}
        <div className="space-y-4 sm:space-y-6">
          {/* Acciones rápidas */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Acciones rápidas
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleGoToOrdenes}
                className="w-full btn-primary flex items-center justify-center gap-2 px-4 py-3"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Nueva orden</span>
              </button>
              
              <button
                onClick={handleGoToInventario}
                className="w-full btn-secondary flex items-center justify-center gap-2 px-4 py-3"
              >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                <span>Revisar inventario</span>
              </button>
              
              <button
                onClick={handleGenerateReport}
                className="w-full btn-secondary flex items-center justify-center gap-2 px-4 py-3"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Generar reporte</span>
              </button>
            </div>
          </div>

          {/* Productos recientes */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Productos agregados
            </h3>
            <div className="space-y-3">
              {recentProductos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay productos recientes
                </div>
              ) : (
                recentProductos.map((producto) => (
                  <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">{producto.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        producto.stock < producto.stock_minimo 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {producto.stock} unidades
                      </p>
                      <p className="text-xs text-gray-500">Stock</p>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => navigate('/inventario')}
                className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium py-2"
              >
                Ver todos los productos →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="mt-6 card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen del sistema</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estado actual del taller
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProductos}</div>
              <div className="text-xs text-gray-500">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ordenesPendientes}</div>
              <div className="text-xs text-gray-500">Órdenes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.ordenesHoy}</div>
              <div className="text-xs text-gray-500">Hoy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard