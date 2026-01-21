import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import * as XLSX from 'xlsx'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowDownIcon
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
  const [viewMode, setViewMode] = useState('table')
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Repuesto',
    marca: '',
    modelo: '',
    precio: '',
    stock: '',
    stock_minimo: '5'
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
      
      if (sortConfig.key === 'precio') {
        const aValue = a.precio || 0
        const bValue = b.precio || 0
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
      // Formatear precio: eliminar puntos de miles y convertir coma a punto
      const precioFormateado = form.precio
        .replace(/\./g, '')  // Eliminar puntos de miles
        .replace(',', '.')   // Reemplazar coma decimal por punto
      
      const precioNumerico = parseFloat(precioFormateado) || 0
      
      // Preparar datos con validación
      const productoData = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        marca: form.marca?.trim() || null,
        modelo: form.modelo?.trim() || null,
        precio: precioNumerico,
        stock: parseInt(form.stock) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 5
      }

      if (editingProduct) {
        // Actualizar producto
        const { data, error } = await supabase
          .from('inventario')
          .update(productoData)
          .eq('id', editingProduct.id)
          .select()

        if (error) throw error
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('inventario')
          .insert([productoData])
          .select()

        if (error) throw error
      }

      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      fetchProductos()
      alert(editingProduct ? '✅ Producto actualizado correctamente' : '✅ Producto creado correctamente')
    } catch (error) {
      console.error('Error saving producto:', error)
      alert(`❌ Error al guardar el producto: ${error.message}`)
    }
  }

  const handleEdit = (producto) => {
    setEditingProduct(producto)
    setForm({
      nombre: producto.nombre || '',
      categoria: producto.categoria || 'Repuesto',
      marca: producto.marca || '',
      modelo: producto.modelo || '',
      precio: producto.precio ? formatPrecioParaInput(producto.precio) : '',
      stock: producto.stock ? producto.stock.toString() : '0',
      stock_minimo: producto.stock_minimo ? producto.stock_minimo.toString() : '5'
    })
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
      alert('✅ Producto eliminado correctamente')
    } catch (error) {
      console.error('Error deleting producto:', error)
      alert('❌ Error al eliminar el producto')
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
        'Precio': p.precio ? formatPrecio(p.precio) : '$0',
        'Stock Actual': p.stock,
        'Stock Mínimo': p.stock_minimo,
        'Estado': p.stock < p.stock_minimo ? 'BAJO STOCK' : 'NORMAL',
        'Valor Total': p.precio ? formatPrecio(p.precio * p.stock) : '$0',
        'Última Actualización': new Date(p.updated_at || p.created_at).toLocaleDateString('es-ES')
      }))

      // Crear libro de Excel
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dataToExport)
      
      // Ajustar anchos de columnas
      const wscols = [
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 }
      ]
      ws['!cols'] = wscols

      XLSX.utils.book_append_sheet(wb, ws, 'Inventario')

      const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const fileName = `inventario_servi_moto_${fecha}.xlsx`

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
      precio: '',
      stock: '',
      stock_minimo: '5'
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterCategoria('todos')
    setStockFilter('todos')
    setSortConfig({ key: 'nombre', direction: 'asc' })
  }

  // Formatear precio para mostrar (20.000 en lugar de 20000.00)
  const formatPrecio = (precio) => {
    if (!precio) return '$0'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  // Formatear precio para input (20.000)
  const formatPrecioParaInput = (precio) => {
    if (!precio) return ''
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  // Manejar cambio de precio en el input
  const handlePrecioChange = (e) => {
    let value = e.target.value
    
    // Solo permitir números, puntos y comas
    value = value.replace(/[^0-9.,]/g, '')
    
    // Reemplazar múltiples puntos o comas por uno solo
    value = value.replace(/,+/g, ',')
    value = value.replace(/\.+/g, '.')
    
    setForm({
      ...form,
      precio: value
    })
  }

  // Manejar cambio de stock en el input
  const handleStockChange = (field, value) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '')
    setForm({
      ...form,
      [field]: numericValue
    })
  }

  // Calcular valor total del producto
  const calcularValorTotal = (producto) => {
    return (producto.precio || 0) * (producto.stock || 0)
  }

  // Vista de tarjetas para móviles
  const ProductCard = ({ producto }) => {
    const valorTotal = calcularValorTotal(producto)
    
    return (
      <div className={`card mb-3 border-l-4 ${
        producto.stock < producto.stock_minimo 
          ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
          : 'border-l-blue-500'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CubeIcon className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {producto.nombre}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Categoría:</span>
                <span className={`ml-2 badge ${
                  producto.categoria === 'Repuesto' ? 'badge-primary' : 'badge-success'
                }`}>
                  {producto.categoria}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                <span className={`ml-2 font-bold ${
                  producto.stock < producto.stock_minimo 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {producto.stock}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                  {formatPrecio(producto.precio)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Valor total:</span>
                <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                  {formatPrecio(valorTotal)}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {producto.marca && <div>Marca: {producto.marca}</div>}
              {producto.modelo && <div>Modelo: {producto.modelo}</div>}
              <div>Stock mínimo: {producto.stock_minimo}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {producto.stock < producto.stock_minimo && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>¡Bajo stock!</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(producto)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <PencilIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={() => handleDelete(producto.id)}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista de tabla para desktop
  const ProductTable = () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
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
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Marca/Modelo
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('precio')}
            >
              <div className="flex items-center gap-1">
                Precio
                {sortConfig.key === 'precio' && (
                  sortConfig.direction === 'asc' ? 
                    <ChevronUpIcon className="w-4 h-4" /> : 
                    <ChevronDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mínimo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Valor Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {filteredProductos.map((producto) => {
            const valorTotal = calcularValorTotal(producto)
            
            return (
              <tr 
                key={producto.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  producto.stock < producto.stock_minimo 
                    ? 'bg-red-50 dark:bg-red-900/20' 
                    : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {producto.nombre}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${
                    producto.categoria === 'Repuesto'
                      ? 'badge-primary'
                      : 'badge-success'
                  }`}>
                    {producto.categoria}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>{producto.marca || '-'}</div>
                    <div>{producto.modelo || '-'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-500 mr-1" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrecio(producto.precio)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-600 dark:text-gray-400">
                    {producto.stock_minimo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatPrecio(valorTotal)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(producto)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  // CSS para ocultar flechas de inputs number
  const style = `
    .hide-spin-buttons::-webkit-inner-spin-button,
    .hide-spin-buttons::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    .hide-spin-buttons {
      -moz-appearance: textfield;
    }
  `

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
      <style>{style}</style>
      
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Inventario</h1>
            <p className="page-subtitle">
              {filteredProductos.length} productos encontrados
              <span className="ml-2 text-green-600 dark:text-green-400">
                • Valor total: {formatPrecio(filteredProductos.reduce((sum, p) => sum + calcularValorTotal(p), 0))}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Exportar</span>
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
              <span className="hidden sm:inline">Nuevo</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
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
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden btn-secondary p-2"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="input-label">Categoría</label>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="input-field"
              >
                <option value="todos">Todas</option>
                <option value="Repuesto">Repuesto</option>
                <option value="Accesorio">Accesorio</option>
                <option value="Lubricante">Lubricante</option>
                <option value="Bateria">Bateria</option>
              </select>
            </div>

            <div>
              <label className="input-label">Estado</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input-field"
              >
                <option value="todos">Todos</option>
                <option value="bajo">Stock bajo</option>
                <option value="normal">Stock normal</option>
              </select>
            </div>

            <div>
              <label className="input-label">Ordenar</label>
              <select
                value={sortConfig.key}
                onChange={(e) => handleSort(e.target.value)}
                className="input-field"
              >
                <option value="nombre">Nombre</option>
                <option value="categoria">Categoría</option>
                <option value="precio">Precio</option>
                <option value="stock">Stock</option>
              </select>
            </div>

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

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredProductos.length} productos
          <span className="ml-2 text-green-600 dark:text-green-400">
            • Valor total: {formatPrecio(filteredProductos.reduce((sum, p) => sum + calcularValorTotal(p), 0))}
          </span>
        </div>
        <div className="lg:hidden flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Tabla
          </button>
        </div>
      </div>

      {/* Vista de productos */}
      <div className="card overflow-hidden">
        {filteredProductos.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta ajustar los filtros o agrega un nuevo producto
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn-primary"
            >
              <PlusIcon className="w-4 h-4 inline mr-2" />
              Agregar primer producto
            </button>
          </div>
        ) : (
          <>
            <div className={`lg:hidden ${viewMode === 'cards' ? 'block' : 'hidden'}`}>
              {filteredProductos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>

            <div className={`lg:hidden ${viewMode === 'table' ? 'block' : 'hidden'}`}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Producto</th>
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Precio</th>
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Stock</th>
                      <th className="py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductos.map((producto) => (
                      <tr key={producto.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {producto.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {producto.categoria}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {formatPrecio(producto.precio)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className={`font-bold ${
                            producto.stock < producto.stock_minimo 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {producto.stock}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(producto)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(producto.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ProductTable />
          </>
        )}

        {filteredProductos.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
                {filteredProductos.length} de {productos.length} productos
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-400 font-bold text-green-600 dark:text-green-400">
                Valor total inventario: {formatPrecio(productos.reduce((sum, p) => sum + calcularValorTotal(p), 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
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
                  <label className="input-label">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({...form, nombre: e.target.value})}
                    className="input-field"
                    placeholder="Filtro de aceite, cadena, etc."
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
                    <option value="Lubricante">Lubricante</option>
                    <option value="Bateria">Bateria</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Marca</label>
                    <input
                      type="text"
                      value={form.marca}
                      onChange={(e) => setForm({...form, marca: e.target.value})}
                      className="input-field"
                      placeholder="Honda, Yamaha..."
                    />
                  </div>
                  <div>
                    <label className="input-label">Modelo</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => setForm({...form, modelo: e.target.value})}
                      className="input-field"
                      placeholder="CBR 600, R6..."
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Precio ($)</label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.precio}
                      onChange={handlePrecioChange}
                      className="input-field pl-10 hide-spin-buttons"
                      placeholder="20.000 o 20.000,50"
                      inputMode="decimal"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formato chileno: 20.000 (veinte mil) o 20.000,50 (veinte mil con cincuenta)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Stock actual *</label>
                    <input
                      type="text"
                      required
                      value={form.stock}
                      onChange={(e) => handleStockChange('stock', e.target.value)}
                      className="input-field hide-spin-buttons"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="input-label">Stock mínimo *</label>
                    <input
                      type="text"
                      required
                      value={form.stock_minimo}
                      onChange={(e) => handleStockChange('stock_minimo', e.target.value)}
                      className="input-field hide-spin-buttons"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {/* Resumen del producto */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Resumen:</h4>
                  <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                    <div>Precio ingresado: {form.precio ? formatPrecio(parseFloat(form.precio.replace(/\./g, '').replace(',', '.')) || 0) : '$0'}</div>
                    <div>Stock: {form.stock || '0'}</div>
                    <div>Valor total: {form.precio && form.stock ? 
                      formatPrecio((parseFloat(form.precio.replace(/\./g, '').replace(',', '.')) || 0) * (parseInt(form.stock) || 0)) : '$0'}</div>
                    <div>Estado: {(parseInt(form.stock) || 0) < (parseInt(form.stock_minimo) || 5) ? '⚠️ Bajo stock' : '✅ Stock normal'}</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary px-4"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4"
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