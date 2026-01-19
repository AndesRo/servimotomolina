import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([])
  const [filteredOrdenes, setFilteredOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOrden, setEditingOrden] = useState(null)
  const [selectedRepuestos, setSelectedRepuestos] = useState([])
  const [selectedOrdenForActions, setSelectedOrdenForActions] = useState(null)
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)
  
  const [form, setForm] = useState({
    cliente_nombre: '',
    cliente_telefono: '',
    moto_marca: '',
    moto_modelo: '',
    problema: '',
    estado: 'Pendiente'
  })

  useEffect(() => {
    fetchOrdenes()
    fetchProductos()
  }, [])

  useEffect(() => {
    filterOrdenes()
  }, [ordenes, searchTerm, filterEstado])

  const fetchOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          ordenes_repuestos (
            cantidad,
            inventario (nombre, marca, modelo, stock)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrdenes(data || [])
      setFilteredOrdenes(data || [])
    } catch (error) {
      console.error('Error fetching ordenes:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  const filterOrdenes = () => {
    let filtered = [...ordenes]

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(o =>
        o.cliente_nombre.toLowerCase().includes(term) ||
        o.moto_marca?.toLowerCase().includes(term) ||
        o.moto_modelo?.toLowerCase().includes(term) ||
        o.cliente_telefono?.includes(term)
      )
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(o => o.estado === filterEstado)
    }

    setFilteredOrdenes(filtered)
  }

  // Función para exportar orden a PDF
  const exportToPDF = async (orden) => {
    try {
      // Crear elemento temporal para el PDF
      const element = document.createElement('div')
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.width = '800px'
      element.style.padding = '20px'
      element.style.backgroundColor = 'white'
      element.style.color = 'black'
      element.style.fontFamily = 'Arial, sans-serif'
      
      const fecha = new Date(orden.created_at).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const totalRepuestos = orden.ordenes_repuestos?.reduce((sum, rep) => sum + rep.cantidad, 0) || 0

      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- Encabezado -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
            <div>
              <h1 style="color: #1e40af; margin: 0; font-size: 28px; font-weight: bold;">SERVI-MOTO</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Taller Mecánico Especializado</p>
              <p style="color: #6b7280; margin: 0; font-size: 12px;">Orden de Trabajo</p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 24px; font-weight: bold; color: #1e40af;">ORDEN #${orden.id.substring(0, 8).toUpperCase()}</div>
              <div style="font-size: 14px; color: #6b7280;">${fecha}</div>
            </div>
          </div>

          <!-- Información del Cliente -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 18px;">
              Información del Cliente
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
              <div>
                <strong>Nombre:</strong> ${orden.cliente_nombre}
              </div>
              <div>
                <strong>Teléfono:</strong> ${orden.cliente_telefono || 'No registrado'}
              </div>
              <div>
                <strong>Marca:</strong> ${orden.moto_marca || 'No especificada'}
              </div>
              <div>
                <strong>Modelo:</strong> ${orden.moto_modelo || 'No especificado'}
              </div>
            </div>
          </div>

          <!-- Información de la Orden -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 18px;">
              Detalles de la Reparación
            </h2>
            <div style="margin-top: 15px;">
              <strong>Problema Reportado:</strong>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #3b82f6;">
                ${orden.problema || 'No especificado'}
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
              <div>
                <strong>Estado:</strong>
                <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; 
                  ${orden.estado === 'Finalizada' ? 'background: #10b981; color: white;' : 
                    orden.estado === 'En reparación' ? 'background: #f59e0b; color: white;' : 
                    'background: #6b7280; color: white;'}">
                  ${orden.estado}
                </span>
              </div>
              <div>
                <strong>Repuestos Utilizados:</strong> ${totalRepuestos}
              </div>
            </div>
          </div>

          <!-- Tabla de Repuestos -->
          ${orden.ordenes_repuestos && orden.ordenes_repuestos.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 18px;">
                Repuestos Utilizados
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                  <tr style="background: #1e40af; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Producto</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db;">Cantidad</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Marca</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Modelo</th>
                  </tr>
                </thead>
                <tbody>
                  ${orden.ordenes_repuestos.map((repuesto, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                      <td style="padding: 10px; border: 1px solid #d1d5db;">${repuesto.inventario.nombre}</td>
                      <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${repuesto.cantidad}</td>
                      <td style="padding: 10px; border: 1px solid #d1d5db;">${repuesto.inventario.marca || 'N/A'}</td>
                      <td style="padding: 10px; border: 1px solid #d1d5db;">${repuesto.inventario.modelo || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Notas y Firmas -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #d1d5db;">
            <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
              <div>
                <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 15px;">Notas Importantes:</h3>
                <ul style="color: #6b7280; font-size: 12px; line-height: 1.6; padding-left: 20px;">
                  <li>Esta orden es válida por 30 días desde la fecha de emisión</li>
                  <li>Los repuestos tienen garantía de 90 días</li>
                  <li>El cliente debe presentar esta orden para retirar su motocicleta</li>
                  <li>Cualquier modificación debe ser autorizada por el cliente</li>
                </ul>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
                <div>
                  <div style="border-top: 1px solid #d1d5db; padding-top: 10px; text-align: center; height: 60px;">
                    <p style="font-size: 12px; color: #6b7280;">Firma del Mecánico</p>
                  </div>
                </div>
                <div>
                  <div style="border-top: 1px solid #d1d5db; padding-top: 10px; text-align: center; height: 60px;">
                    <p style="font-size: 12px; color: #6b7280;">Firma del Cliente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pie de página -->
          <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #1e40af; text-align: center; font-size: 11px; color: #6b7280;">
            <p>Servi-Moto • Taller Mecánico Especializado</p>
            <p>Orden generada el ${new Date().toLocaleDateString('es-ES')} • ID: ${orden.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      `
      
      document.body.appendChild(element)

      // Convertir a canvas y luego a PDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      document.body.removeChild(element)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)

      // Generar nombre del archivo
      const fechaStr = new Date().toISOString().split('T')[0]
      const nombreCliente = orden.cliente_nombre.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
      const fileName = `orden_${nombreCliente}_${fechaStr}.pdf`

      pdf.save(fileName)
      
      alert(`✅ PDF "${fileName}" generado exitosamente`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('❌ Error al generar el PDF. Por favor, intenta de nuevo.')
    }
  }

  // Función para compartir por WhatsApp
  const shareViaWhatsApp = (orden) => {
    if (!orden.cliente_telefono) {
      alert('❌ El cliente no tiene número de teléfono registrado')
      return
    }

    // Limpiar número de teléfono
    const phoneNumber = orden.cliente_telefono.replace(/\D/g, '')
    
    // Validar formato
    if (!phoneNumber || phoneNumber.length < 8) {
      alert('❌ Número de teléfono inválido')
      return
    }

    // Preparar mensaje
    const fecha = new Date(orden.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const repuestosText = orden.ordenes_repuestos && orden.ordenes_repuestos.length > 0 
      ? `\n\n🔧 *Repuestos utilizados:*\n${orden.ordenes_repuestos.map(rep => 
          `• ${rep.cantidad}x ${rep.inventario.nombre}`
        ).join('\n')}`
      : ''

    const message = `¡Hola ${orden.cliente_nombre}! 👋

📋 *Información de tu orden en Servi-Moto:*

*Orden:* #${orden.id.substring(0, 8).toUpperCase()}
*Fecha:* ${fecha}
*Moto:* ${orden.moto_marca || 'No especificada'} ${orden.moto_modelo || ''}
*Problema:* ${orden.problema || 'No especificado'}
*Estado:* ${orden.estado}${repuestosText}

📍 *Taller Servi-Moto*
🕐 Horario: Lunes a Viernes 8:00 - 18:00

¡Gracias por confiar en nosotros! 🏍️✨

_Este mensaje fue generado automáticamente por el sistema Servi-Moto_`

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Crear URL de WhatsApp (con código de país para México: +52)
    const countryCode = '52'
    const whatsappUrl = `https://wa.me/${countryCode}${phoneNumber}?text=${encodedMessage}`
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let ordenId
      
      if (editingOrden) {
        // Actualizar orden
        const { error } = await supabase
          .from('ordenes')
          .update(form)
          .eq('id', editingOrden.id)

        if (error) throw error
        ordenId = editingOrden.id
      } else {
        // Crear nueva orden
        const { data, error } = await supabase
          .from('ordenes')
          .insert([form])
          .select()
          .single()

        if (error) throw error
        ordenId = data.id
      }

      // Gestionar repuestos
      await handleRepuestos(ordenId)

      resetForm()
      fetchOrdenes()
    } catch (error) {
      console.error('Error saving orden:', error)
      alert('Error al guardar la orden')
    }
  }

  const handleRepuestos = async (ordenId) => {
    try {
      // Eliminar repuestos anteriores si estamos editando
      if (editingOrden) {
        await supabase
          .from('ordenes_repuestos')
          .delete()
          .eq('orden_id', ordenId)
      }

      // Insertar nuevos repuestos
      for (const repuesto of selectedRepuestos) {
        // Insertar en ordenes_repuestos
        await supabase
          .from('ordenes_repuestos')
          .insert({
            orden_id: ordenId,
            producto_id: repuesto.id,
            cantidad: repuesto.cantidad
          })

        // Actualizar stock del producto
        const productoActual = productos.find(p => p.id === repuesto.id)
        if (productoActual) {
          const nuevoStock = productoActual.stock - repuesto.cantidad
          
          await supabase
            .from('inventario')
            .update({ stock: nuevoStock })
            .eq('id', repuesto.id)
        }
      }
    } catch (error) {
      console.error('Error handling repuestos:', error)
      throw error
    }
  }

  const handleEdit = (orden) => {
    setEditingOrden(orden)
    setForm({
      cliente_nombre: orden.cliente_nombre,
      cliente_telefono: orden.cliente_telefono,
      moto_marca: orden.moto_marca,
      moto_modelo: orden.moto_modelo,
      problema: orden.problema,
      estado: orden.estado
    })
    
    // Cargar repuestos de la orden
    if (orden.ordenes_repuestos) {
      const repuestos = orden.ordenes_repuestos.map(r => ({
        id: r.inventario.id,
        nombre: r.inventario.nombre,
        cantidad: r.cantidad
      }))
      setSelectedRepuestos(repuestos)
    }
    
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) return

    try {
      const { error } = await supabase
        .from('ordenes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchOrdenes()
    } catch (error) {
      console.error('Error deleting orden:', error)
      alert('Error al eliminar la orden')
    }
  }

  const addRepuesto = () => {
    setSelectedRepuestos([...selectedRepuestos, { id: '', cantidad: 1 }])
  }

  const removeRepuesto = (index) => {
    const nuevosRepuestos = [...selectedRepuestos]
    nuevosRepuestos.splice(index, 1)
    setSelectedRepuestos(nuevosRepuestos)
  }

  const updateRepuesto = (index, field, value) => {
    const nuevosRepuestos = [...selectedRepuestos]
    nuevosRepuestos[index][field] = value
    setSelectedRepuestos(nuevosRepuestos)
  }

  const resetForm = () => {
    setForm({
      cliente_nombre: '',
      cliente_telefono: '',
      moto_marca: '',
      moto_modelo: '',
      problema: '',
      estado: 'Pendiente'
    })
    setSelectedRepuestos([])
    setEditingOrden(null)
    setShowModal(false)
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'En reparación':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'En reparación':
        return <WrenchScrewdriverIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  // Componente de tarjeta para vista móvil
  const OrdenCard = ({ orden }) => (
    <div className="card mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getEstadoIcon(orden.estado)}
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {orden.cliente_nombre}
            </h3>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <WrenchScrewdriverIcon className="w-4 h-4" />
              <span>{orden.moto_marca} {orden.moto_modelo}</span>
            </div>
            {orden.cliente_telefono && (
              <div className="flex items-center gap-1">
                <PhoneIcon className="w-4 h-4" />
                <span>{orden.cliente_telefono}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
            {orden.problema}
          </div>
        </div>

        <div className="text-right">
          <span className={`badge ${getEstadoColor(orden.estado)}`}>
            {orden.estado}
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(orden.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => handleEdit(orden)}
          className="flex-1 btn-secondary text-sm py-2"
        >
          Editar
        </button>
        <button
          onClick={() => setSelectedOrdenForActions(orden)}
          className="flex-1 btn-primary text-sm py-2"
        >
          Acciones
        </button>
      </div>
    </div>
  )

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
            <h1 className="page-title">Órdenes de Trabajo</h1>
            <p className="page-subtitle">
              {filteredOrdenes.length} órdenes encontradas
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nueva Orden</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        {/* Barra de búsqueda y botón filtros móvil */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, moto o teléfono..."
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
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros avanzados */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="input-label">Estado</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="input-field"
              >
                <option value="todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En reparación">En reparación</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterEstado('todos')
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          {(searchTerm || filterEstado !== 'todos') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                  Búsqueda: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterEstado !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                  Estado: {filterEstado}
                  <button onClick={() => setFilterEstado('todos')}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vista de órdenes */}
      <div className="card overflow-hidden">
        {/* Vista de tarjetas para móviles */}
        <div className="lg:hidden">
          {filteredOrdenes.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron órdenes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterEstado !== 'todos' 
                  ? 'Intenta ajustar los filtros' 
                  : 'Crea tu primera orden de trabajo'
                }
              </p>
              {!searchTerm && filterEstado === 'todos' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 btn-primary"
                >
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Crear primera orden
                </button>
              )}
            </div>
          ) : (
            filteredOrdenes.map((orden) => (
              <OrdenCard key={orden.id} orden={orden} />
            ))
          )}
        </div>

        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Moto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Problema
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredOrdenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {orden.cliente_nombre}
                        </div>
                        {orden.cliente_telefono && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {orden.cliente_telefono}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {orden.moto_marca} {orden.moto_modelo}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {orden.problema}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getEstadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(orden.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(orden)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setSelectedOrdenForActions(orden)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Acciones
                      </button>
                      <button
                        onClick={() => handleDelete(orden.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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

        {/* Paginación */}
        {filteredOrdenes.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
                Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de acciones */}
      {selectedOrdenForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones para Orden
                </h3>
                <button
                  onClick={() => setSelectedOrdenForActions(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Información</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Cliente:</strong> {selectedOrdenForActions.cliente_nombre}<br />
                    <strong>Moto:</strong> {selectedOrdenForActions.moto_marca} {selectedOrdenForActions.moto_modelo}<br />
                    <strong>Estado:</strong> {selectedOrdenForActions.estado}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      exportToPDF(selectedOrdenForActions)
                      setSelectedOrdenForActions(null)
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Exportar a PDF
                  </button>

                  <button
                    onClick={() => {
                      shareViaWhatsApp(selectedOrdenForActions)
                      setSelectedOrdenForActions(null)
                    }}
                    className="w-full btn-secondary flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Compartir por WhatsApp
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedOrdenForActions(null)}
                  className="btn-secondary px-4 py-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar orden */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingOrden ? 'Editar Orden' : 'Nueva Orden de Trabajo'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="input-label">Nombre del cliente *</label>
                    <input
                      type="text"
                      required
                      value={form.cliente_nombre}
                      onChange={(e) => setForm({...form, cliente_nombre: e.target.value})}
                      className="input-field"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="input-label">Teléfono</label>
                    <input
                      type="tel"
                      value={form.cliente_telefono}
                      onChange={(e) => setForm({...form, cliente_telefono: e.target.value})}
                      className="input-field"
                      placeholder="Ej: +52 123 456 7890"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para compartir la orden por WhatsApp
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="input-label">Marca de la moto</label>
                    <input
                      type="text"
                      value={form.moto_marca}
                      onChange={(e) => setForm({...form, moto_marca: e.target.value})}
                      className="input-field"
                      placeholder="Ej: Honda, Yamaha, Suzuki"
                    />
                  </div>

                  <div>
                    <label className="input-label">Modelo de la moto</label>
                    <input
                      type="text"
                      value={form.moto_modelo}
                      onChange={(e) => setForm({...form, moto_modelo: e.target.value})}
                      className="input-field"
                      placeholder="Ej: CBR 600, R6, GSX-R"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Problema reportado *</label>
                  <textarea
                    required
                    rows="4"
                    value={form.problema}
                    onChange={(e) => setForm({...form, problema: e.target.value})}
                    className="input-field resize-none"
                    placeholder="Describa el problema o servicio requerido..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="input-label">Estado de la orden</label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      className="input-field"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En reparación">En reparación</option>
                      <option value="Finalizada">Finalizada</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="input-label">Fecha</label>
                      <div className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed">
                        {new Date().toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de repuestos */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Repuestos utilizados
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona los repuestos que se usarán
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addRepuesto}
                      className="text-sm btn-primary px-3 py-1.5 flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  {selectedRepuestos.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No hay repuestos agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedRepuestos.map((repuesto, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <select
                              value={repuesto.id}
                              onChange={(e) => updateRepuesto(index, 'id', e.target.value)}
                              className="w-full input-field text-sm"
                              required
                            >
                              <option value="">Seleccionar repuesto</option>
                              {productos.map((producto) => (
                                <option 
                                  key={producto.id} 
                                  value={producto.id}
                                  disabled={producto.stock <= 0}
                                >
                                  {producto.nombre} - Stock: {producto.stock}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={repuesto.cantidad}
                              onChange={(e) => updateRepuesto(index, 'cantidad', parseInt(e.target.value) || 1)}
                              className="w-20 input-field py-1 text-center"
                            />
                            <button
                              type="button"
                              onClick={() => removeRepuesto(index)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500">
                    {editingOrden ? 'Editando orden' : 'Los campos marcados con * son obligatorios'}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary px-4"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-4 flex items-center gap-2"
                    >
                      {editingOrden ? (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          Crear Orden
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ordenes