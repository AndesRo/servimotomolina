import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon
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
    estado: 'Pendiente',
    precio_servicio: '',
    precio_mano_obra: ''
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
            id,
            cantidad,
            inventario:producto_id (
              id,
              nombre,
              marca,
              modelo,
              precio
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrdenes(data || [])
      setFilteredOrdenes(data || [])
    } catch (error) {
      console.error('Error fetching ordenes:', error)
      alert('❌ Error al cargar las órdenes')
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
      alert('❌ Error al cargar los productos')
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
        o.cliente_telefono?.includes(term) ||
        o.id.toLowerCase().includes(term)
      )
    }

    // Filtro por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(o => o.estado === filterEstado)
    }

    setFilteredOrdenes(filtered)
  }

  // Función para formatear precio en formato chileno
  const formatPrecio = (precio) => {
    if (!precio && precio !== 0) return '$0'
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  // Función para formatear precio para input (mostrar con puntos de miles)
  const formatPrecioParaInput = (precio) => {
    if (!precio && precio !== 0) return ''
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  // Función para convertir precio de input a número
  const parsePrecioInput = (precioStr) => {
    if (!precioStr) return 0
    return parseFloat(precioStr.replace(/\./g, '').replace(',', '.')) || 0
  }

  const calcularTotalOrden = (orden) => {
    if (!orden) return 0
    
    const totalRepuestos = orden.ordenes_repuestos?.reduce((sum, rep) => {
      const precio = rep.inventario?.precio || 0
      return sum + (precio * (rep.cantidad || 0))
    }, 0) || 0
    
    const servicio = orden.precio_servicio || 0
    const manoObra = orden.precio_mano_obra || 0
    
    return totalRepuestos + servicio + manoObra
  }

  // Función para exportar orden a PDF
  const exportToPDF = async (orden) => {
    try {
      if (!orden) {
        alert('❌ No hay orden seleccionada')
        return
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
      const totalRepuestosPrecio = orden.ordenes_repuestos?.reduce((sum, rep) => {
        const precio = rep.inventario?.precio || 0
        return sum + (precio * (rep.cantidad || 0))
      }, 0) || 0
      
      const totalOrden = calcularTotalOrden(orden)

      element.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- Encabezado -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
            <div>
              <h1 style="color: #1e40af; margin: 0; font-size: 28px; font-weight: bold;">SERVI MOTO</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">Taller Mecánico Especializado</p>
              <p style="color: #6b7280; margin: 0; font-size: 12px;">Orden de Trabajo y Presupuesto</p>
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
                <strong>Nombre:</strong> ${orden.cliente_nombre || 'No especificado'}
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

          <!-- Información de la Orden y Presupuesto -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 18px;">
              Detalles de la Reparación y Presupuesto
            </h2>
            <div style="margin-top: 15px;">
              <strong>Servicio:</strong>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #3b82f6;">
                ${orden.problema || 'No especificado'}
              </div>
            </div>
            
            <!-- Tabla de Presupuesto -->
            <div style="margin-top: 20px;">
              <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Desglose del Presupuesto:</h3>
              <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden;">
                <tbody>
                  <tr>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">Servicio</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                      ${formatPrecio(orden.precio_servicio || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">Mano de Obra</td>
                    <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                      ${formatPrecio(orden.precio_mano_obra || 0)}
                    </td>
                  </tr>
                  ${orden.ordenes_repuestos && orden.ordenes_repuestos.length > 0 ? `
                    <tr>
                      <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb;">Repuestos</td>
                      <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
                        ${formatPrecio(totalRepuestosPrecio)}
                      </td>
                    </tr>
                  ` : ''}
                  <tr style="background: #1e40af; color: white;">
                    <td style="padding: 12px 15px; font-weight: bold;">TOTAL</td>
                    <td style="padding: 12px 15px; text-align: right; font-weight: bold; font-size: 18px;">
                      ${formatPrecio(totalOrden)}
                    </td>
                  </tr>
                </tbody>
              </table>
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
                    <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Precio Unitario</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${orden.ordenes_repuestos.map((repuesto, index) => {
                    const precio = repuesto.inventario?.precio || 0
                    const subtotal = precio * (repuesto.cantidad || 0)
                    return `
                      <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                        <td style="padding: 10px; border: 1px solid #d1d5db;">${repuesto.inventario?.nombre || 'Producto no encontrado'}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #d1d5db;">${repuesto.cantidad}</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db;">${formatPrecio(precio)}</td>
                        <td style="padding: 10px; border: 1px solid #d1d5db;">${formatPrecio(subtotal)}</td>
                      </tr>
                    `
                  }).join('')}
                  <tr style="background: #f3f4f6; font-weight: bold;">
                    <td colspan="3" style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">Total Repuestos:</td>
                    <td style="padding: 10px; border: 1px solid #d1d5db;">${formatPrecio(totalRepuestosPrecio)}</td>
                  </tr>
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
                  <li>Esta orden y presupuesto son válidos por 30 días desde la fecha de emisión</li>
                  <li>Los repuestos tienen garantía de 90 días</li>
                  <li>El cliente debe presentar esta orden para retirar su motocicleta</li>
                  <li>Cualquier modificación debe ser autorizada por el cliente</li>
                  <li>El presupuesto puede variar si se requieren repuestos adicionales</li>
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
                    <p style="font-size: 10px; color: #9ca3af;">Acepto el presupuesto y autorizo el trabajo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pie de página -->
          <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #1e40af; text-align: center; font-size: 11px; color: #6b7280;">
            <p>Servi Moto • Taller Mecánico</p>
            <p>Orden y presupuesto generados el ${new Date().toLocaleDateString('es-ES')} • ID: ${orden.id.substring(0, 8).toUpperCase()}</p>
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
      const nombreCliente = orden.cliente_nombre?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) || 'cliente'
      const fileName = `orden_${nombreCliente}_${fechaStr}.pdf`

      pdf.save(fileName)
      
      alert(`✅ PDF "${fileName}" generado exitosamente`)
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('❌ Error al generar el PDF. Por favor, intenta de nuevo.')
    }
  }

  const shareViaWhatsApp = (orden) => {
    if (!orden.cliente_telefono) {
      alert('❌ El cliente no tiene número de teléfono registrado')
      return
    }

    // Limpiar a solo dígitos
    let phone = orden.cliente_telefono.replace(/\D/g, '')

    // Quitar código país si viene incluido
    if (phone.startsWith('56')) {
      phone = phone.substring(2)
    }

    // Quitar cero inicial
    if (phone.startsWith('0')) {
      phone = phone.substring(1)
    }

    // Validar número chileno (9 dígitos)
    if (phone.length !== 9) {
      alert('❌ Número de teléfono inválido. Debe tener 9 dígitos (ej: 912345678)')
      return
    }

    // Formato WhatsApp
    const phoneNumber = `56${phone}`

    const fecha = new Date(orden.created_at).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const repuestosText = orden.ordenes_repuestos?.length > 0
      ? `\n\n🔧 *Repuestos utilizados:*\n${orden.ordenes_repuestos
          .map(rep => `• ${rep.cantidad}x ${rep.inventario?.nombre || 'Producto'} - ${formatPrecio(((rep.inventario?.precio || 0) * (rep.cantidad || 0)))}`)
          .join('\n')}`
      : ''

    const totalRepuestosPrecio = orden.ordenes_repuestos?.reduce((sum, rep) => {
      const precio = rep.inventario?.precio || 0
      return sum + (precio * (rep.cantidad || 0))
    }, 0) || 0

    const message = `Hola ${orden.cliente_nombre}!

📋 *INFORMACIÓN DE TU ORDEN - SERVI MOTO*

Orden: #${orden.id.substring(0, 8).toUpperCase()}
Fecha: ${fecha}
Moto: ${orden.moto_marca || 'No especificada'} ${orden.moto_modelo || ''}
Servicio: ${orden.problema || 'No especificado'}
Estado: ${orden.estado}

💰 *PRESUPUESTO:*
• Servicio: ${formatPrecio(orden.precio_servicio || 0)}
• Mano de obra: ${formatPrecio(orden.precio_mano_obra || 0)}
• Repuestos: ${formatPrecio(totalRepuestosPrecio)}
• *TOTAL: ${formatPrecio(calcularTotalOrden(orden))}*${repuestosText}

🏍️ *Taller Servi Moto*
⏰ Horario: Lunes a Viernes 8:00 - 18:00

Gracias por confiar en nosotros.
Mensaje generado automáticamente por el sistema Servi Moto`

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validar campos requeridos
      if (!form.cliente_nombre.trim()) {
        alert('❌ El nombre del cliente es requerido')
        return
      }

      if (!form.problema.trim()) {
        alert('❌ La descripción del servicio es requerida')
        return
      }

      // Preparar datos de la orden
      const ordenData = {
        cliente_nombre: form.cliente_nombre.trim(),
        cliente_telefono: form.cliente_telefono.trim() || null,
        moto_marca: form.moto_marca.trim() || null,
        moto_modelo: form.moto_modelo.trim() || null,
        problema: form.problema.trim(),
        estado: form.estado,
        precio_servicio: parsePrecioInput(form.precio_servicio) || 0,
        precio_mano_obra: parsePrecioInput(form.precio_mano_obra) || 0,
        updated_at: new Date().toISOString()
      }

      let ordenId
      
      if (editingOrden) {
        // Actualizar orden existente
        const { error } = await supabase
          .from('ordenes')
          .update(ordenData)
          .eq('id', editingOrden.id)

        if (error) throw error
        ordenId = editingOrden.id
        alert('✅ Orden actualizada correctamente')
      } else {
        // Crear nueva orden
        const { data, error } = await supabase
          .from('ordenes')
          .insert([ordenData])
          .select()
          .single()

        if (error) throw error
        ordenId = data.id
        alert('✅ Orden creada correctamente')
      }

      // Gestionar repuestos
      await handleRepuestos(ordenId, editingOrden)

      setShowModal(false)
      setEditingOrden(null)
      resetForm()
      fetchOrdenes()
    } catch (error) {
      console.error('Error saving orden:', error)
      alert(`❌ Error al guardar la orden: ${error.message}`)
    }
  }

  const handleRepuestos = async (ordenId, isEditing) => {
    try {
      // Si estamos editando, primero obtener los repuestos anteriores para restaurar stock
      if (isEditing) {
        const { data: repuestosAnteriores, error: errorAnteriores } = await supabase
          .from('ordenes_repuestos')
          .select('producto_id, cantidad')
          .eq('orden_id', ordenId)

        if (errorAnteriores) throw errorAnteriores

        // Restaurar stock de repuestos anteriores
        for (const repuesto of repuestosAnteriores || []) {
          const producto = productos.find(p => p.id === repuesto.producto_id)
          if (producto) {
            const nuevoStock = producto.stock + repuesto.cantidad
            await supabase
              .from('inventario')
              .update({ stock: nuevoStock })
              .eq('id', repuesto.producto_id)
          }
        }

        // Eliminar repuestos anteriores
        await supabase
          .from('ordenes_repuestos')
          .delete()
          .eq('orden_id', ordenId)
      }

      // Insertar nuevos repuestos y actualizar stock
      for (const repuesto of selectedRepuestos) {
        if (!repuesto.id || !repuesto.cantidad || repuesto.cantidad <= 0) {
          continue
        }

        const producto = productos.find(p => p.id === repuesto.id)
        if (!producto) {
          console.warn(`Producto con ID ${repuesto.id} no encontrado`)
          continue
        }

        // Verificar stock disponible
        if (producto.stock < repuesto.cantidad) {
          alert(`⚠️ Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock}`)
          continue
        }

        // Insertar en ordenes_repuestos
        await supabase
          .from('ordenes_repuestos')
          .insert({
            orden_id: ordenId,
            producto_id: repuesto.id,
            cantidad: repuesto.cantidad
          })

        // Actualizar stock del producto
        const nuevoStock = producto.stock - repuesto.cantidad
        await supabase
          .from('inventario')
          .update({ stock: nuevoStock })
          .eq('id', repuesto.id)
      }
    } catch (error) {
      console.error('Error handling repuestos:', error)
      throw error
    }
  }

  const handleEdit = (orden) => {
    setEditingOrden(orden)
    setForm({
      cliente_nombre: orden.cliente_nombre || '',
      cliente_telefono: orden.cliente_telefono || '',
      moto_marca: orden.moto_marca || '',
      moto_modelo: orden.moto_modelo || '',
      problema: orden.problema || '',
      estado: orden.estado || 'Pendiente',
      precio_servicio: formatPrecioParaInput(orden.precio_servicio) || '',
      precio_mano_obra: formatPrecioParaInput(orden.precio_mano_obra) || ''
    })
    
    // Cargar repuestos de la orden
    if (orden.ordenes_repuestos) {
      const repuestos = orden.ordenes_repuestos.map(r => ({
        id: r.inventario?.id,
        nombre: r.inventario?.nombre,
        cantidad: r.cantidad || 1
      })).filter(r => r.id) // Filtrar repuestos con ID válido
      setSelectedRepuestos(repuestos)
    } else {
      setSelectedRepuestos([])
    }
    
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta orden?\n\n⚠️ Esta acción restaurará el stock de los repuestos utilizados pero NO se puede deshacer.')) return

    try {
      // Primero restaurar stock de repuestos
      const { data: repuestos, error: repuestosError } = await supabase
        .from('ordenes_repuestos')
        .select('producto_id, cantidad')
        .eq('orden_id', id)

      if (repuestosError) throw repuestosError

      for (const repuesto of repuestos || []) {
        const producto = productos.find(p => p.id === repuesto.producto_id)
        if (producto) {
          const nuevoStock = producto.stock + repuesto.cantidad
          await supabase
            .from('inventario')
            .update({ stock: nuevoStock })
            .eq('id', repuesto.producto_id)
        }
      }

      // Eliminar repuestos de la orden
      await supabase
        .from('ordenes_repuestos')
        .delete()
        .eq('orden_id', id)

      // Eliminar la orden
      const { error } = await supabase
        .from('ordenes')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      fetchOrdenes()
      alert('✅ Orden eliminada correctamente. Stock restaurado.')
    } catch (error) {
      console.error('Error deleting orden:', error)
      alert('❌ Error al eliminar la orden')
    }
  }

  const addRepuesto = () => {
    setSelectedRepuestos([...selectedRepuestos, { id: '', nombre: '', cantidad: 1 }])
  }

  const removeRepuesto = (index) => {
    const nuevosRepuestos = [...selectedRepuestos]
    nuevosRepuestos.splice(index, 1)
    setSelectedRepuestos(nuevosRepuestos)
  }

  const updateRepuesto = (index, field, value) => {
    const nuevosRepuestos = [...selectedRepuestos]
    if (field === 'id') {
      const producto = productos.find(p => p.id === value)
      nuevosRepuestos[index] = {
        ...nuevosRepuestos[index],
        id: value,
        nombre: producto?.nombre || ''
      }
    } else {
      nuevosRepuestos[index][field] = value
    }
    setSelectedRepuestos(nuevosRepuestos)
  }

  const resetForm = () => {
    setForm({
      cliente_nombre: '',
      cliente_telefono: '',
      moto_marca: '',
      moto_modelo: '',
      problema: '',
      estado: 'Pendiente',
      precio_servicio: '',
      precio_mano_obra: ''
    })
    setSelectedRepuestos([])
    setEditingOrden(null)
    setShowModal(false)
  }

  const handlePrecioChange = (field, value) => {
    // Limpiar el valor: permitir números, puntos y comas
    const cleanValue = value.replace(/[^0-9.,]/g, '')
    setForm({
      ...form,
      [field]: cleanValue
    })
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'En reparación':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'Pendiente':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
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
      case 'Pendiente':
        return <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      default:
        return <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  // Componente de tarjeta para vista móvil
  const OrdenCard = ({ orden }) => {
    const totalOrden = calcularTotalOrden(orden)
    
    return (
      <div className="card mb-3 border-l-4 border-blue-500">
        <div className="flex flex-col">
          {/* Encabezado */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getEstadoIcon(orden.estado)}
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {orden.cliente_nombre}
                </h3>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-2">
                <div className="flex items-center gap-1">
                  <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{orden.moto_marca || 'Sin marca'} {orden.moto_modelo || ''}</span>
                </div>
                {orden.cliente_telefono && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{orden.cliente_telefono}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className={`badge ${getEstadoColor(orden.estado)} text-xs`}>
                {orden.estado}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {orden.problema || 'Sin descripción'}
            </p>
          </div>

          {/* Información inferior */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(orden.created_at).toLocaleDateString('es-CL')}
              </div>
              <div className="text-xs text-gray-500">
                {orden.ordenes_repuestos?.length || 0} repuestos
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPrecio(totalOrden)}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleEdit(orden)}
              className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
              title="Editar orden"
            >
              <PencilIcon className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {
                setSelectedOrdenForActions(orden)
                setShowActionsModal(true)
              }}
              className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
              title="Más acciones"
            >
              <ArrowPathIcon className="w-3 h-3" />
              <span>Acciones</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando órdenes...</p>
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
            <h1 className="page-title">Órdenes de Trabajo</h1>
            <p className="page-subtitle">
              {filteredOrdenes.length} órdenes encontradas
              <span className="ml-2 text-green-600 dark:text-green-400">
                • Total: {formatPrecio(filteredOrdenes.reduce((sum, orden) => sum + calcularTotalOrden(orden), 0))}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchOrdenes()}
              className="btn-secondary flex items-center gap-2"
              title="Actualizar lista"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm sm:text-base"
              title="Crear nueva orden"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nueva Orden</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
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
              placeholder="Buscar por cliente, moto, teléfono o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 sm:pl-10 text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                title="Limpiar búsqueda"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden btn-secondary p-2"
            title="Mostrar/Ocultar filtros"
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
                className="input-field text-sm sm:text-base"
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
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-sm sm:text-base"
                title="Limpiar todos los filtros"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          {(searchTerm || filterEstado !== 'todos') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs dark:bg-blue-900/30 dark:text-blue-300">
                  Búsqueda: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                    title="Quitar filtro"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterEstado !== 'todos' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs dark:bg-purple-900/30 dark:text-purple-300">
                  Estado: {filterEstado}
                  <button 
                    onClick={() => setFilterEstado('todos')}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                    title="Quitar filtro"
                  >
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
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron órdenes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterEstado !== 'todos' 
                  ? 'Intenta ajustar los filtros de búsqueda' 
                  : 'Crea tu primera orden de trabajo'
                }
              </p>
              {!searchTerm && filterEstado === 'todos' && (
                <button
                  onClick={() => {
                    resetForm()
                    setShowModal(true)
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Crear primera orden
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOrdenes.map((orden) => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </div>

        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Moto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredOrdenes.map((orden) => {
                const totalOrden = calcularTotalOrden(orden)
                return (
                <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {orden.cliente_nombre}
                        </div>
                        {orden.cliente_telefono && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {orden.cliente_telefono}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                      {orden.moto_marca || 'N/A'} {orden.moto_modelo || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate">
                      {orden.problema || 'Sin descripción'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge ${getEstadoColor(orden.estado)} text-xs`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatPrecio(totalOrden)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(orden.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(orden)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                        title="Editar orden"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span className="hidden xl:inline">Editar</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrdenForActions(orden)
                          setShowActionsModal(true)
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                        title="Más acciones"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span className="hidden xl:inline">Acciones</span>
                      </button>
                      <button
                        onClick={() => handleDelete(orden.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                        title="Eliminar orden"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden xl:inline">Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla */}
        {filteredOrdenes.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
                Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-400 font-medium">
                Valor total: {formatPrecio(filteredOrdenes.reduce((sum, orden) => sum + calcularTotalOrden(orden), 0))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de acciones */}
      {selectedOrdenForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-2 sm:mx-0">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones para Orden
                </h3>
                <button
                  onClick={() => {
                    setSelectedOrdenForActions(null)
                    setShowActionsModal(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Información de la Orden</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div><strong>Cliente:</strong> {selectedOrdenForActions.cliente_nombre}</div>
                    <div><strong>Moto:</strong> {selectedOrdenForActions.moto_marca} {selectedOrdenForActions.moto_modelo}</div>
                    <div><strong>Estado:</strong> {selectedOrdenForActions.estado}</div>
                    <div><strong>Total:</strong> {formatPrecio(calcularTotalOrden(selectedOrdenForActions))}</div>
                    <div><strong>Repuestos:</strong> {selectedOrdenForActions.ordenes_repuestos?.length || 0}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      exportToPDF(selectedOrdenForActions)
                      setSelectedOrdenForActions(null)
                      setShowActionsModal(false)
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
                    title="Generar PDF de la orden"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Generar PDF
                  </button>

                  <button
                    onClick={() => {
                      shareViaWhatsApp(selectedOrdenForActions)
                      setSelectedOrdenForActions(null)
                      setShowActionsModal(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Compartir por WhatsApp"
                    disabled={!selectedOrdenForActions.cliente_telefono}
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Compartir por WhatsApp
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setSelectedOrdenForActions(null)
                    setShowActionsModal(false)
                  }}
                  className="btn-secondary px-4 py-2 text-sm sm:text-base"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto pt-4 sm:pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingOrden ? 'Editar Orden' : 'Nueva Orden de Trabajo'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">Nombre del cliente *</label>
                    <input
                      type="text"
                      required
                      value={form.cliente_nombre}
                      onChange={(e) => setForm({...form, cliente_nombre: e.target.value})}
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: Juan Pérez"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="input-label">Teléfono</label>
                    <input
                      type="tel"
                      value={form.cliente_telefono}
                      onChange={(e) => setForm({...form, cliente_telefono: e.target.value})}
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: 912345678"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para compartir la orden por WhatsApp
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">Marca de la moto</label>
                    <input
                      type="text"
                      value={form.moto_marca}
                      onChange={(e) => setForm({...form, moto_marca: e.target.value})}
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: Honda, Yamaha, Suzuki"
                    />
                  </div>

                  <div>
                    <label className="input-label">Modelo de la moto</label>
                    <input
                      type="text"
                      value={form.moto_modelo}
                      onChange={(e) => setForm({...form, moto_modelo: e.target.value})}
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: CBR 600, R6, GSX-R"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Servicio requerido *</label>
                  <textarea
                    required
                    rows="3"
                    value={form.problema}
                    onChange={(e) => setForm({...form, problema: e.target.value})}
                    className="input-field resize-none text-sm sm:text-base"
                    placeholder="Describa el problema o servicio requerido..."
                  />
                </div>

                {/* Sección de precios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Precio del servicio ($)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.precio_servicio}
                        onChange={(e) => handlePrecioChange('precio_servicio', e.target.value)}
                        className="input-field pl-10 text-sm sm:text-base hide-spin-buttons"
                        placeholder="20.000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="input-label">
                      Mano de obra ($)
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.precio_mano_obra}
                        onChange={(e) => handlePrecioChange('precio_mano_obra', e.target.value)}
                        className="input-field pl-10 text-sm sm:text-base hide-spin-buttons"
                        placeholder="15.000"
                      />
                    </div>
                  </div>
                </div>

                {/* Total automático */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                      Total estimado:
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-300">
                      {formatPrecio(
                        parsePrecioInput(form.precio_servicio) + 
                        parsePrecioInput(form.precio_mano_obra) + 
                        selectedRepuestos.reduce((sum, rep) => {
                          const producto = productos.find(p => p.id === rep.id)
                          return sum + (producto?.precio || 0) * (rep.cantidad || 0)
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Incluye: Servicio ({formatPrecio(parsePrecioInput(form.precio_servicio))}), 
                    Mano de obra ({formatPrecio(parsePrecioInput(form.precio_mano_obra))}), 
                    Repuestos ({formatPrecio(selectedRepuestos.reduce((sum, rep) => {
                      const producto = productos.find(p => p.id === rep.id)
                      return sum + (producto?.precio || 0) * (rep.cantidad || 0)
                    }, 0))})
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">Estado de la orden</label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      className="input-field text-sm sm:text-base"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En reparación">En reparación</option>
                      <option value="Finalizada">Finalizada</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="input-label">Fecha</label>
                      <div className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-sm sm:text-base">
                        {new Date().toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de repuestos */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
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
                      title="Agregar repuesto"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  {selectedRepuestos.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <WrenchScrewdriverIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No hay repuestos agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedRepuestos.map((repuesto, index) => {
                        const producto = productos.find(p => p.id === repuesto.id)
                        const precioUnitario = producto?.precio || 0
                        const subtotal = precioUnitario * (repuesto.cantidad || 0)
                        
                        return (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                                    title={`Stock disponible: ${producto.stock}`}
                                  >
                                    {producto.nombre} - Stock: {producto.stock} - {formatPrecio(producto.precio)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  max={producto?.stock || 1}
                                  value={repuesto.cantidad}
                                  onChange={(e) => updateRepuesto(index, 'cantidad', parseInt(e.target.value) || 1)}
                                  className="w-16 input-field py-1 text-center text-sm"
                                />
                              </div>
                              <div className="text-xs text-gray-500 w-16 text-right">
                                {formatPrecio(subtotal)}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRepuesto(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Quitar repuesto"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    {editingOrden ? 'Editando orden existente' : 'Los campos marcados con * son obligatorios'}
                  </div>
                  
                  <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="flex-1 sm:flex-none btn-secondary px-4 py-2 text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none btn-primary px-4 py-2 text-sm sm:text-base flex items-center justify-center gap-2"
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