import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'moment/locale/es'
import { supabase } from '../utils/supabase'
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

const Calendario = () => {
  const [events, setEvents] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [filterEstado, setFilterEstado] = useState('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [mobileView, setMobileView] = useState('calendar') // 'calendar' o 'list'

  useEffect(() => {
    fetchOrdenes()
  }, [])

  useEffect(() => {
    convertirOrdenesAEventos()
  }, [ordenes, filterEstado, searchTerm])

  const fetchOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          ordenes_repuestos (
            cantidad,
            inventario (nombre)
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

  const convertirOrdenesAEventos = () => {
    const eventos = ordenes.map(orden => {
      const fecha = new Date(orden.created_at)
      const color = getEstadoColor(orden.estado)
      
      return {
        id: orden.id,
        title: `${orden.cliente_nombre} - ${orden.moto_marca} ${orden.moto_modelo}`,
        start: fecha,
        end: new Date(fecha.getTime() + 60 * 60 * 1000), // 1 hora después
        allDay: true,
        resource: orden,
        color: color,
        estado: orden.estado,
        descripcion: orden.problema,
        telefono: orden.cliente_telefono
      }
    })

    // Filtrar eventos
    let filteredEvents = eventos
    
    if (filterEstado !== 'todos') {
      filteredEvents = filteredEvents.filter(event => event.estado === filterEstado)
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(term) ||
        event.resource.cliente_telefono?.toLowerCase().includes(term) ||
        event.descripcion?.toLowerCase().includes(term)
      )
    }

    setEvents(filteredEvents)
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return '#10B981' // verde
      case 'En reparación':
        return '#F59E0B' // amarillo
      case 'Pendiente':
        return '#6B7280' // gris
      default:
        return '#3B82F6' // azul
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

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'Finalizada':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'En reparación':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleViewChange = (newView) => {
    setView(newView)
  }

  const handleNavigate = (newDate) => {
    setDate(newDate)
  }

  const eventStyleGetter = (event) => {
    const backgroundColor = event.color
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: window.innerWidth < 640 ? '10px' : '12px',
      padding: '2px 4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
    return {
      style: style
    }
  }

  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay órdenes en este período',
    showMore: (total) => `+${total} más`
  }

  const formatFecha = (fecha) => {
    return moment(fecha).format('DD [de] MMMM [de] YYYY, h:mm A')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterEstado('todos')
    setDate(new Date())
  }

  // Componente de lista para vista móvil
  const EventListMobile = () => (
    <div className="space-y-3">
      {events.map((event) => (
        <div 
          key={event.id} 
          className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleSelectEvent(event)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: event.color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {event.resource.cliente_nombre}
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {event.resource.moto_marca} {event.resource.moto_modelo}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(event.estado)}`}>
              {event.estado}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
            {event.descripcion}
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {moment(event.start).format('DD/MM')}
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {moment(event.start).format('HH:mm')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Componente de toolbar personalizado para el calendario
  const CustomToolbar = (toolbar) => (
    <div className="rbc-toolbar mb-3 sm:mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toolbar.onNavigate('PREV')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Mes anterior"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base px-2 text-center min-w-[140px]">
              {moment(toolbar.date).format('MMMM YYYY').toUpperCase()}
            </span>
            <button
              type="button"
              onClick={() => toolbar.onNavigate('NEXT')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Mes siguiente"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:hidden"
          >
            Hoy
          </button>
        </div>
        
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => toolbar.onView('day')}
              className={`px-3 py-1.5 text-xs rounded-lg ${toolbar.view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => toolbar.onView('week')}
              className={`px-3 py-1.5 text-xs rounded-lg ${toolbar.view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => toolbar.onView('month')}
              className={`px-3 py-1.5 text-xs rounded-lg ${toolbar.view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Mes
            </button>
          </div>
          <button
            type="button"
            onClick={() => toolbar.onNavigate('TODAY')}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg hidden sm:block"
          >
            Hoy
          </button>
        </div>
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
            <h1 className="page-title">Calendario de Órdenes</h1>
            <p className="page-subtitle">
              {events.length} órdenes programadas
            </p>
          </div>
          <div className="flex gap-2">
            {/* Selector de vista móvil */}
            <div className="lg:hidden flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setMobileView('calendar')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${mobileView === 'calendar' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Calendario
              </button>
              <button
                onClick={() => setMobileView('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${mobileView === 'list' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <ClipboardDocumentListIcon className="w-4 h-4 inline mr-1" />
                Lista
              </button>
            </div>
            <button
              onClick={() => setDate(new Date())}
              className="btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Hoy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o moto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 sm:pl-10 text-sm sm:text-base"
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
            aria-label="Mostrar filtros"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros avanzados */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="input-label text-sm">Estado</label>
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

            <div>
              <label className="input-label text-sm">Vista</label>
              <select
                value={view}
                onChange={(e) => handleViewChange(e.target.value)}
                className="input-field text-sm sm:text-base"
              >
                <option value="month">Mes</option>
                <option value="week">Semana</option>
                <option value="day">Día</option>
                <option value="agenda">Agenda</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-sm"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpiar
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="btn-secondary flex items-center gap-2 py-2 text-sm w-full"
              >
                <InformationCircleIcon className="w-4 h-4" />
                Leyenda
              </button>
            </div>
          </div>

          {/* Resumen de filtros activos */}
          {(searchTerm || filterEstado !== 'todos') && (
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
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

      {/* Contenido principal - Móvil */}
      <div className="lg:hidden">
        {mobileView === 'calendar' ? (
          /* Calendario móvil */
          <div className="card overflow-hidden p-0 mb-4">
            <div className="h-[400px] p-2">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                onView={handleViewChange}
                onNavigate={handleNavigate}
                view={view}
                date={date}
                messages={messages}
                eventPropGetter={eventStyleGetter}
                components={{
                  toolbar: CustomToolbar
                }}
              />
            </div>
          </div>
        ) : (
          /* Lista móvil */
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Lista de Órdenes
              </h3>
              <span className="text-sm text-gray-500">
                {events.length} órdenes
              </span>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay órdenes para mostrar</p>
              </div>
            ) : (
              <EventListMobile />
            )}
          </div>
        )}
      </div>

      {/* Contenido principal - Desktop */}
      <div className="hidden lg:block">
        <div className="card overflow-hidden p-0 mb-6">
          <div className="h-[500px] sm:h-[600px] p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onView={handleViewChange}
              onNavigate={handleNavigate}
              view={view}
              date={date}
              messages={messages}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar
              }}
            />
          </div>
        </div>
      </div>

      {/* Leyenda */}
      {(showLegend || window.innerWidth >= 1024) && (
        <div className="card mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Leyenda de Estados
            </h4>
            <button
              onClick={() => setShowLegend(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Nuevas/Pendientes</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">En reparación</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Finalizadas</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Otros estados</span>
            </div>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes totales</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {ordenes.length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Órdenes este mes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {ordenes.filter(o => {
                  const orderDate = new Date(o.created_at)
                  const now = new Date()
                  return orderDate.getMonth() === now.getMonth() && 
                         orderDate.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mostrando</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {events.length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FunnelIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle de evento */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 pt-4 sm:pt-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalles de la Orden
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Información del cliente */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">
                      Información del Cliente
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Nombre:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedEvent.resource.cliente_nombre}
                      </p>
                    </div>
                    {selectedEvent.telefono && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Teléfono:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedEvent.telefono}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Moto:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedEvent.resource.moto_marca} {selectedEvent.resource.moto_modelo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles de la orden */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Detalles del Servicio
                    </h4>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {selectedEvent.descripcion}
                    </p>
                  </div>
                </div>

                {/* Estado y fecha */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getEstadoIcon(selectedEvent.estado)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(selectedEvent.estado)}`}>
                        {selectedEvent.estado}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1 text-sm">
                      {formatFecha(selectedEvent.start)}
                    </p>
                  </div>
                </div>

                {/* Repuestos utilizados */}
                {selectedEvent.resource.ordenes_repuestos && selectedEvent.resource.ordenes_repuestos.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Repuestos utilizados:
                    </h4>
                    <div className="space-y-1">
                      {selectedEvent.resource.ordenes_repuestos.map((repuesto, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {repuesto.cantidad}x {repuesto.inventario?.nombre || 'Repuesto'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    window.location.href = `/ordenes?edit=${selectedEvent.id}`
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Editar Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS para el calendario responsive */}
      <style jsx>{`
        @media (max-width: 640px) {
          :global(.rbc-calendar) {
            font-size: 12px;
          }
          
          :global(.rbc-header) {
            padding: 4px 2px;
            font-size: 10px;
          }
          
          :global(.rbc-date-cell) {
            padding: 2px;
            text-align: center;
            font-size: 11px;
          }
          
          :global(.rbc-row-content) {
            min-height: 60px;
          }
          
          :global(.rbc-event) {
            font-size: 9px;
            padding: 1px 2px;
            margin: 1px;
          }
          
          :global(.rbc-show-more) {
            font-size: 9px;
          }
        }
        
        @media (max-width: 768px) {
          :global(.rbc-toolbar) {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          :global(.rbc-toolbar-label) {
            margin: 0.25rem 0;
            font-size: 0.875rem;
          }
          
          :global(.rbc-btn-group) {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.25rem;
          }
          
          :global(.rbc-btn-group button) {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Calendario