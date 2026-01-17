import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    ordenesPendientes: 0,
    ordenesHoy: 0
  })
  const [recentOrdenes, setRecentOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
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

      setStats({
        totalProductos: totalProductos || 0,
        productosBajoStock,
        ordenesPendientes: ordenesPendientes || 0,
        ordenesHoy: ordenesHoy || 0
      })

      setRecentOrdenes(ordenes || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Resumen general del taller
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Productos"
          value={stats.totalProductos}
          icon={ChartBarIcon}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        
        <StatCard
          title="Productos bajo stock"
          value={stats.productosBajoStock}
          icon={ExclamationTriangleIcon}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
        
        <StatCard
          title="Órdenes pendientes"
          value={stats.ordenesPendientes}
          icon={WrenchScrewdriverIcon}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
        />
        
        <StatCard
          title="Órdenes hoy"
          value={stats.ordenesHoy}
          icon={CheckCircleIcon}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Órdenes recientes
            </h3>
            <button
              onClick={() => navigate('/ordenes')}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              Ver todas <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Moto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentOrdenes.map((orden) => (
                  <tr key={orden.id} className="table-row">
                    <td className="px-4 py-3">{orden.cliente_nombre}</td>
                    <td className="px-4 py-3">{orden.moto_marca} {orden.moto_modelo}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        orden.estado === 'Finalizada' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                          : orden.estado === 'En reparación'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {orden.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
              Crear nueva orden
            </button>
            
            <button
              onClick={handleGoToInventario}
              className="w-full btn-secondary flex items-center justify-center gap-2 px-4 py-3"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              Revisar inventario bajo
            </button>
            
            <button
              onClick={handleGenerateReport}
              className="w-full btn-secondary flex items-center justify-center gap-2 px-4 py-3"
            >
              <ChartBarIcon className="w-5 h-5" />
              Generar reporte diario
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard