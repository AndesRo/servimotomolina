import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import * as XLSX from 'xlsx'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PlusIcon 
} from '@heroicons/react/24/outline'

const Inventario = () => {
  const [productos, setProductos] = useState([])
  const [filteredProductos, setFilteredProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [stockFilter, setStockFilter] = useState('todos')
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Repuesto',
    marca: '',
    modelo: '',
    stock: 0,
    stock_minimo: 5
  })

  useEffect(() => {
    fetchProductos()
  }, [])

  useEffect(() => {
    filterProductos()
  }, [productos, searchTerm, filterCategoria, stockFilter])

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('nombre')

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error fetching productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProductos = () => {
    let filtered = [...productos]

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.marca?.toLowerCase().includes(term) ||
        p.modelo?.toLowerCase().includes(term)
      )
    }

    // Filtro por categoría
    if (filterCategoria !== 'todos') {
      filtered = filtered.filter(p => p.categoria === filterCategoria)
    }

    // Filtro por stock
    if (stockFilter === 'bajo') {
      filtered = filtered.filter(p => p.stock < p.stock_minimo)
    } else if (stockFilter === 'normal') {
      filtered = filtered.filter(p => p.stock >= p.stock_minimo)
    }

    setFilteredProductos(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        // Actualizar producto
        const { error } = await supabase
          .from('inventario')
          .update(form)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('inventario')
          .insert([form])

        if (error) throw error
      }

      setShowModal(false)
      setEditingProduct(null)
      setForm({
        nombre: '',
        categoria: 'Repuesto',
        marca: '',
        modelo: '',
        stock: 0,
        stock_minimo: 5
      })
      
      fetchProductos()
    } catch (error) {
      console.error('Error saving producto:', error)
      alert('Error al guardar el producto')
    }
  }

  const handleEdit = (producto) => {
    setEditingProduct(producto)
    setForm(producto)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProductos()
    } catch (error) {
      console.error('Error deleting producto:', error)
      alert('Error al eliminar el producto')
    }
  }

  // Solo exportar a Excel (eliminada importación)
  const exportToExcel = () => {
    try {
      // Preparar datos para exportar
      const dataToExport = filteredProductos.map(p => ({
        'Nombre': p.nombre,
        'Categoría': p.categoria,
        'Marca': p.marca || '',
        'Modelo': p.modelo || '',
        'Stock Actual': p.stock,
        'Stock Mínimo': p.stock_minimo,
        'Estado': p.stock < p.stock_minimo ? 'BAJO STOCK' : 'NORMAL',
        'Última Actualización': new Date(p.updated_at).toLocaleDateString('es-ES')
      }))

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      
      // Ajustar anchos de columnas
      const wscols = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // Categoría
        { wch: 20 }, // Marca
        { wch: 20 }, // Modelo
        { wch: 12 }, // Stock Actual
        { wch: 12 }, // Stock Mínimo
        { wch: 15 }, // Estado
        { wch: 20 }  // Última Actualización
      ]
      ws['!cols'] = wscols

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

      // Generar nombre de archivo con fecha
      const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const fileName = `inventario_servi_moto_${fecha}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, fileName)
      
      alert(`✅ Archivo "${fileName}" descargado exitosamente`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('❌ Error al exportar a Excel')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategoria('todos')
    setStockFilter('todos')
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona repuestos y accesorios ({filteredProductos.length} productos)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Exportar Excel
          </button>
          <button
            onClick={() => {
              setEditingProduct(null)
              setForm({
                nombre: '',
                categoria: 'Repuesto',
                marca: '',
                modelo: '',
                stock: 0,
                stock_minimo: 5
              })
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, marca o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro por categoría */}
          <div className="w-full md:w-48">
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="input-field"
            >
              <option value="todos">Todas las categorías</option>
              <option value="Repuesto">Repuesto</option>
              <option value="Accesorio">Accesorio</option>
            </select>
          </div>

          {/* Filtro por stock */}
          <div className="w-full md:w-48">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input-field"
            >
              <option value="todos">Todos los estados</option>
              <option value="bajo">Stock bajo</option>
              <option value="normal">Stock normal</option>
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <button
            onClick={clearFilters}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FunnelIcon className="w-5 h-5" />
            Limpiar
          </button>
        </div>

        {/* Resumen de filtros */}
        {(searchTerm || filterCategoria !== 'todos' || stockFilter !== 'todos') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                Búsqueda: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {filterCategoria !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm">
                Categoría: {filterCategoria}
                <button onClick={() => setFilterCategoria('todos')}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            {stockFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                Stock: {stockFilter === 'bajo' ? 'Bajo' : 'Normal'}
                <button onClick={() => setStockFilter('todos')}>
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Producto</th>
                <th className="px-6 py-3 text-left">Categoría</th>
                <th className="px-6 py-3 text-left">Marca/Modelo</th>
                <th className="px-6 py-3 text-left">Stock</th>
                <th className="px-6 py-3 text-left">Mínimo</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron productos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredProductos.map((producto) => (
                  <tr 
                    key={producto.id} 
                    className={`table-row ${
                      producto.stock < producto.stock_minimo 
                        ? 'bg-red-50 dark:bg-red-900/20' 
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {producto.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        producto.categoria === 'Repuesto'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
                      }`}>
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>{producto.marca}</div>
                        <div>{producto.modelo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          producto.stock < producto.stock_minimo 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {producto.stock}
                        </span>
                        {producto.stock < producto.stock_minimo && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                            ¡Bajo stock!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        {producto.stock_minimo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="input-field"
                    placeholder="Ej: Filtro de aceite"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({...form, categoria: e.target.value})}
                    className="input-field"
                  >
                    <option value="Repuesto">Repuesto</option>
                    <option value="Accesorio">Accesorio</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => setForm({...form, marca: e.target.value})}
                      className="input-field"
                      placeholder="Ej: Honda"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Modelo compatible
                    </label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => setForm({...form, modelo: e.target.value})}
                      className="input-field"
                      placeholder="Ej: CBR 600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock actual *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.stock}
                      onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock mínimo *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.stock_minimo}
                      onChange={(e) => setForm({...form, stock_minimo: parseInt(e.target.value) || 5})}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventario