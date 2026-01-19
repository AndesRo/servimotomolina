import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
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
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' })
  const [showFilters, setShowFilters] = useState(false)
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
    filterAndSortProductos()
  }, [productos, searchTerm, filterCategoria, stockFilter, sortConfig])

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

  const filterAndSortProductos = () => {
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

    // Ordenar
    filtered.sort((a, b) => {
      if (sortConfig.key === 'stock') {
        const aValue = a.stock - a.stock_minimo
        const bValue = b.stock - b.stock_minimo
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      const aValue = a[sortConfig.key]?.toString().toLowerCase() || ''
      const bValue = b[sortConfig.key]?.toString().toLowerCase() || ''
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredProductos(filtered)
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
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
      resetForm()
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

  const resetForm = () => {
    setForm({
      nombre: '',
      categoria: 'Repuesto',
      marca: '',
      modelo: '',
      stock: 0,
      stock_minimo: 5
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategoria('todos')
    setStockFilter('todos')
    setSortConfig({ key: 'nombre', direction: 'asc' })
  }

  if (loading) {
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
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Inventario</h1>
            <p className="page-subtitle">
              Gestiona repuestos y accesorios ({filteredProductos.length} productos)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </button>
            <button
              onClick={() => {
                setEditingProduct(null)
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 sm:pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Botón mostrar/ocultar filtros en móvil */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-secondary p-2"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros avanzados */}
        <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Filtro por categoría */}
            <div>
              <label className="input-label">Categoría</label>
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
            <div>
              <label className="input-label">Estado de stock</label>
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

            {/* Ordenar por */}
            <div>
              <label className="input-label">Ordenar por</label>
              <select
                value={sortConfig.key}
                onChange={(e) => handleSort(e.target.value)}
                className="input-field"
              >
                <option value="nombre">Nombre</option>
                <option value="categoria">Categoría</option>
                <option value="stock">Nivel de stock</option>
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          {(searchTerm || filterCategoria !== 'todos' || stockFilter !== 'todos') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                  Búsqueda: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterCategoria !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                  Categoría: {filterCategoria}
                  <button onClick={() => setFilterCategoria('todos')}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {stockFilter !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                  Stock: {stockFilter === 'bajo' ? 'Bajo' : 'Normal'}
                  <button onClick={() => setStockFilter('todos')}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="table-header">
              <tr>
                <th 
                  className="table-cell cursor-pointer"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="flex items-center gap-1">
                    Producto
                    {sortConfig.key === 'nombre' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="table-cell cursor-pointer hidden sm:table-cell"
                  onClick={() => handleSort('categoria')}
                >
                  <div className="flex items-center gap-1">
                    Categoría
                    {sortConfig.key === 'categoria' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="table-cell hidden md:table-cell">Marca/Modelo</th>
                <th 
                  className="table-cell cursor-pointer"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-1">
                    Stock
                    {sortConfig.key === 'stock' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="table-cell hidden lg:table-cell">Mínimo</th>
                <th className="table-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
                    <td className="table-cell">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {producto.nombre}
                      </div>
                      <div className="sm:hidden text-xs text-gray-500 mt-1">
                        {producto.categoria}
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className={`badge ${
                        producto.categoria === 'Repuesto'
                          ? 'badge-primary'
                          : 'badge-success'
                      }`}>
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>{producto.marca || '-'}</div>
                        <div>{producto.modelo || '-'}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          producto.stock < producto.stock_minimo 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {producto.stock}
                        </span>
                        {producto.stock < producto.stock_minimo && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3 h-3" />
                            ¡Bajo stock!
                          </span>
                        )}
                      </div>
                      <div className="lg:hidden text-xs text-gray-500 mt-1">
                        Mín: {producto.stock_minimo}
                      </div>
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      <span className="text-gray-600 dark:text-gray-400">
                        {producto.stock_minimo}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(producto)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(producto.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
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

        {/* Paginación */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
              Mostrando <span className="font-medium">{filteredProductos.length}</span> de{' '}
              <span className="font-medium">{productos.length}</span> productos
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                disabled
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-400">1 de 1</span>
              <button
                className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                disabled
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="form-section">
                <div className="form-grid">
                  <div>
                    <label className="input-label">Nombre *</label>
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
                    <label className="input-label">Categoría *</label>
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({...form, categoria: e.target.value})}
                      className="input-field"
                    >
                      <option value="Repuesto">Repuesto</option>
                      <option value="Accesorio">Accesorio</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="input-label">Marca</label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => setForm({...form, marca: e.target.value})}
                      className="input-field"
                      placeholder="Ej: Honda"
                    />
                  </div>
                  <div>
                    <label className="input-label">Modelo compatible</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => setForm({...form, modelo: e.target.value})}
                      className="input-field"
                      placeholder="Ej: CBR 600"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="input-label">Stock actual *</label>
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
                    <label className="input-label">Stock mínimo *</label>
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

                <div className="flex justify-end space-x-3 pt-4 sm:pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary px-4 sm:px-6"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 sm:px-6"
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