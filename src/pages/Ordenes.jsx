import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOrden, setEditingOrden] = useState(null)
  const [selectedRepuestos, setSelectedRepuestos] = useState([])
  const [selectedOrdenForActions, setSelectedOrdenForActions] = useState(null)
  const [showActionsModal, setShowActionsModal] = useState(false)
  
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

 // Función para exportar orden a PDF con QR
const exportToPDF = async (orden) => {
  try {
    // Generar URL única para esta orden
    const ordenUrl = `${window.location.origin}/orden/${orden.id}`
    
    // Generar código QR como data URL
    let qrCodeDataUrl = ''
    try {
      qrCodeDataUrl = await QRCode.toDataURL(ordenUrl, {
        width: 120,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      })
    } catch (qrError) {
      console.warn('No se pudo generar QR, continuando sin él:', qrError)
    }

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
            📋 Información del Cliente
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
            🔧 Detalles de la Reparación
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
              🛠️ Repuestos Utilizados
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

        <!-- Notas, Firmas y QR -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #d1d5db;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
            <div>
              <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 15px;">Notas Importantes:</h3>
              <ul style="color: #6b7280; font-size: 12px; line-height: 1.6; padding-left: 20px;">
                <li>Esta orden es válida por 30 días desde la fecha de emisión</li>
                <li>Los repuestos tienen garantía de 90 días</li>
                <li>El cliente debe presentar esta orden para retirar su motocicleta</li>
                <li>Cualquier modificación debe ser autorizada por el cliente</li>
              </ul>
              
              <div style="margin-top: 30px;">
                <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 15px;">Firmas:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
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
            
            <!-- Código QR -->
            <div style="text-align: center;">
              ${qrCodeDataUrl ? `
                <div>
                  <img src="${qrCodeDataUrl}" alt="Código QR de la orden" style="width: 120px; height: 120px; margin: 0 auto;" />
                  <p style="font-size: 11px; color: #6b7280; margin-top: 10px;">
                    Escanee para ver detalles
                  </p>
                </div>
              ` : ''}
              <div style="margin-top: ${qrCodeDataUrl ? '20px' : '0'};">
                <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                  <p style="font-size: 12px; color: #6b7280; font-weight: bold;">ID de Orden</p>
                  <p style="font-size: 10px; color: #374151; font-family: monospace;">${orden.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie de página -->
        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #1e40af; text-align: center; font-size: 11px; color: #6b7280;">
          <p>Servi-Moto • Molina• Tel: +1 234 567 8900</p>
          <p>www.servi-moto.com • info@servi-moto.com</p>
          <p>Orden generada automáticamente el ${new Date().toLocaleDateString('es-ES')}</p>
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
    const pageHeight = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let position = 0

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    
    // Si la imagen es más alta que una página, agregar páginas adicionales
    let heightLeft = imgHeight
    while (heightLeft > 0) {
      position = heightLeft - pageHeight
      if (position < 0) break
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position - pageHeight, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

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
📞 Contacto: +1 234 567 8900
🕐 Horario: Lunes a Viernes 8:00 - 18:00

¡Gracias por confiar en nosotros! 🏍️✨

_Este mensaje fue generado automáticamente por el sistema Servi-Moto_`

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank')
  }

  // Función para abrir modal de acciones
  const openActionsModal = (orden) => {
    setSelectedOrdenForActions(orden)
    setShowActionsModal(true)
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Órdenes de Trabajo</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona reparaciones y servicios ({ordenes.length} órdenes)
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <WrenchScrewdriverIcon className="w-5 h-5" />
          Nueva Orden
        </button>
      </div>

      {/* Tabla de órdenes */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Moto</th>
                <th className="px-6 py-3 text-left">Problema</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No hay órdenes registradas
                  </td>
                </tr>
              ) : (
                ordenes.map((orden) => (
                  <tr key={orden.id} className="table-row">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          {orden.cliente_nombre}
                        </div>
                        {orden.cliente_telefono && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <PhoneIcon className="w-3 h-3" />
                            {orden.cliente_telefono}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">
                        {orden.moto_marca} {orden.moto_modelo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                        {orden.problema}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(orden.estado)}`}>
                        {orden.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(orden.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(orden)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar orden"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(orden.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar orden"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => openActionsModal(orden)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                          title="Acciones adicionales"
                        >
                          <ShareIcon className="w-4 h-4" />
                          Acciones
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

      {/* Modal de acciones adicionales */}
      {showActionsModal && selectedOrdenForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones para Orden #{selectedOrdenForActions.id.substring(0, 8).toUpperCase()}
                </h3>
                <button
                  onClick={() => setShowActionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Información de la Orden</h4>
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
                      setShowActionsModal(false)
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Exportar a PDF
                  </button>

                  <button
                    onClick={() => {
                      shareViaWhatsApp(selectedOrdenForActions)
                      setShowActionsModal(false)
                    }}
                    className="w-full btn-secondary flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Compartir por WhatsApp
                  </button>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  <p className="flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    PDF: Genera un documento profesional de la orden
                  </p>
                  <p className="flex items-center gap-2 mt-2">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    WhatsApp: Envía los detalles al cliente automáticamente
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowActionsModal(false)}
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
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-40 overflow-y-auto">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del cliente *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marca de la moto
              </label>
              <input
                type="text"
                value={form.moto_marca}
                onChange={(e) => setForm({...form, moto_marca: e.target.value})}
                className="input-field"
                placeholder="Ej: Honda, Yamaha, Suzuki"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modelo de la moto
              </label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Problema reportado *
            </label>
            <textarea
              required
              rows="4"
              value={form.problema}
              onChange={(e) => setForm({...form, problema: e.target.value})}
              className="input-field resize-none"
              placeholder="Describa el problema o servicio requerido..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado de la orden
              </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de creación
                </label>
                <div className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
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
                  Selecciona los repuestos que se usarán en esta reparación
                </p>
              </div>
              <button
                type="button"
                onClick={addRepuesto}
                className="text-sm btn-primary px-3 py-1.5 flex items-center gap-1"
              >
                <PlusIcon className="w-4 h-4" />
                Agregar repuesto
              </button>
            </div>

            {selectedRepuestos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay repuestos agregados</p>
                <p className="text-sm text-gray-400 mt-1">
                  Agrega los repuestos que se utilizarán en esta reparación
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {selectedRepuestos.map((repuesto, index) => {
                  const productoSeleccionado = productos.find(p => p.id === repuesto.id)
                  const stockDisponible = productoSeleccionado?.stock || 0
                  
                  return (
                    <div key={index} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                              className={producto.stock <= 0 ? 'text-red-500' : ''}
                            >
                              {producto.nombre} - {producto.marca} {producto.modelo} 
                              {producto.stock <= 0 ? ' (SIN STOCK)' : ` (Stock: ${producto.stock})`}
                            </option>
                          ))}
                        </select>
                        
                        {productoSeleccionado && (
                          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                            <span>Categoría: {productoSeleccionado.categoria}</span>
                            {productoSeleccionado.stock < productoSeleccionado.stock_minimo && (
                              <span className="text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                Stock bajo
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (repuesto.cantidad > 1) {
                                  updateRepuesto(index, 'cantidad', repuesto.cantidad - 1)
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                              disabled={repuesto.cantidad <= 1}
                            >
                              <span className="text-lg">-</span>
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={stockDisponible}
                              value={repuesto.cantidad}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1
                                const maxValue = Math.min(value, stockDisponible)
                                updateRepuesto(index, 'cantidad', maxValue)
                              }}
                              className="w-16 input-field text-center py-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (repuesto.cantidad < stockDisponible) {
                                  updateRepuesto(index, 'cantidad', repuesto.cantidad + 1)
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                              disabled={repuesto.cantidad >= stockDisponible}
                            >
                              <span className="text-lg">+</span>
                            </button>
                          </div>
                          {stockDisponible > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Disponible: {stockDisponible}
                            </p>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeRepuesto(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2"
                          title="Eliminar repuesto"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {selectedRepuestos.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Total de repuestos: {selectedRepuestos.reduce((sum, r) => sum + r.cantidad, 0)}
                  </span>
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Items diferentes: {selectedRepuestos.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notas adicionales */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas adicionales (opcional)
            </h4>
            <textarea
              rows="2"
              className="input-field resize-none"
              placeholder="Observaciones, recomendaciones o información adicional..."
            />
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              {editingOrden ? (
                <p>Editando orden creada el {new Date(editingOrden.created_at).toLocaleDateString()}</p>
              ) : (
                <p>Los campos marcados con * son obligatorios</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary px-6"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary px-6 flex items-center gap-2"
              >
                {editingOrden ? (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Actualizar Orden
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