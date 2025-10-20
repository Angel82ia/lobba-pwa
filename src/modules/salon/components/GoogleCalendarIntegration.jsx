import { useState, useEffect, useCallback } from 'react'
import api from '../../../services/api'

/**
 * Componente para integración de Google Calendar
 * 
 * Flujo UX:
 * 1. Usuario ve estado: "No conectado" o "Conectado"
 * 2. Si no conectado: botón "Conectar Google Calendar"
 * 3. Se abre popup de Google para autorizar
 * 4. Usuario regresa, ve lista de calendarios
 * 5. Selecciona un calendario
 * 6. Puede sincronizar manualmente
 * 7. Ve última sincronización
 */
export default function GoogleCalendarIntegration({ salonId }) {
  const [status, setStatus] = useState({
    connected: false,
    synced: false,
    calendarId: null,
    lastSync: null,
    loading: true,
  })
  
  const [calendars, setCalendars] = useState([])
  const [syncing, setSyncing] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const response = await api.get(`/salons/${salonId}`)
      const salon = response.data
      
      // DEBUG: Ver qué campos llegan
      console.log('📊 Salon data:', {
        google_calendar_enabled: salon.google_calendar_enabled,
        google_sync_enabled: salon.google_sync_enabled,
        google_calendar_id: salon.google_calendar_id,
        last_google_sync: salon.last_google_sync
      })
      
      const newStatus = {
        connected: salon.google_calendar_enabled || false,
        synced: salon.google_sync_enabled || false,
        calendarId: salon.google_calendar_id || null,
        lastSync: salon.last_google_sync || null,
        loading: false,
      }
      
      console.log('📊 Status calculado:', newStatus)
      
      setStatus(newStatus)
      return salon
    } catch (error) {
      console.error('Error checking status:', error)
      setStatus(prev => ({ ...prev, loading: false }))
      return null
    }
  }, [salonId])

  const loadCalendars = useCallback(async () => {
    try {
      const response = await api.get(`/google-calendar/calendars/${salonId}`)
      setCalendars(response.data.calendars || [])
    } catch (error) {
      console.error('Error loading calendars:', error)
      alert('Error al cargar calendarios. Por favor, reconecta tu cuenta.')
    }
  }, [salonId])

  // Verificar estado inicial
  useEffect(() => {
    const init = async () => {
      const newStatus = await checkStatus()
      
      // Si está conectado pero no sincronizado, cargar calendarios automáticamente
      if (newStatus?.google_calendar_enabled && !newStatus?.google_sync_enabled) {
        loadCalendars()
      }
    }
    init()
  }, [salonId, checkStatus, loadCalendars])

  // PASO 1: Conectar Google Calendar
  const handleConnect = async () => {
    try {
      const response = await api.get(`/google-calendar/auth/${salonId}`)
      const { authUrl } = response.data
      
      // Abrir en ventana actual (mejor UX que popup)
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting:', error)
      alert('Error al conectar con Google Calendar')
    }
  }

  // PASO 3: Seleccionar calendario
  const handleSelectCalendar = async (calendarId) => {
    try {
      await api.post(`/google-calendar/set-calendar/${salonId}`, {
        calendarId,
      })
      
      setStatus(prev => ({
        ...prev,
        synced: true,
        calendarId,
      }))
      
      alert('Calendario configurado correctamente')
      
      // Hacer primera sincronización
      handleSync()
    } catch (error) {
      console.error('Error selecting calendar:', error)
      alert('Error al seleccionar calendario')
    }
  }

  // PASO 4: Sincronizar manualmente
  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await api.post(`/google-calendar/sync/${salonId}`)
      const { sync } = response.data
      
      setStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
      }))
      
      // Mensaje más claro y motivador
      const messages = []
      if (sync.reservationsToGoogle > 0) {
        messages.push(`✅ ${sync.reservationsToGoogle} reserva${sync.reservationsToGoogle > 1 ? 's' : ''} sincronizada${sync.reservationsToGoogle > 1 ? 's' : ''} a Google Calendar`)
      }
      if (sync.eventsToBlocks > 0) {
        messages.push(`🚫 ${sync.eventsToBlocks} evento${sync.eventsToBlocks > 1 ? 's' : ''} de Google bloqueado${sync.eventsToBlocks > 1 ? 's' : ''} en Lobba`)
      }
      if (messages.length === 0) {
        messages.push('✓ Todo está sincronizado. No hay cambios pendientes.')
      }
      
      alert(
        '🎉 Sincronización completada\n\n' +
        messages.join('\n')
      )
    } catch (error) {
      console.error('Error syncing:', error)
      alert('❌ Error al sincronizar. Por favor, intenta de nuevo.')
    } finally {
      setSyncing(false)
    }
  }

  // PASO 5: Desconectar
  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar Google Calendar?')) return
    
    try {
      await api.delete(`/google-calendar/disconnect/${salonId}`)
      
      setStatus({
        connected: false,
        synced: false,
        calendarId: null,
        lastSync: null,
        loading: false,
      })
      
      setCalendars([])
      
      alert('Google Calendar desconectado')
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Error al desconectar')
    }
  }

  if (status.loading) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">📅 Google Calendar</h2>
      
      {/* ESTADO: NO CONECTADO */}
      {!status.connected && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 mb-4">
              Conecta tu Google Calendar para sincronizar automáticamente:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 mb-4">
              <li>Las reservas de Lobba aparecen en tu Google Calendar</li>
              <li>Tus eventos de Google Calendar bloquean horarios en Lobba</li>
              <li>Evita doble reservas automáticamente</li>
            </ul>
          </div>
          
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.5 3h-15C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm-7 15H7V9h5.5v9zm7-5h-5.5V9H19.5v4z"/>
            </svg>
            Conectar Google Calendar
          </button>
        </div>
      )}

      {/* ESTADO: CONECTADO PERO SIN CALENDARIO SELECCIONADO */}
      {status.connected && !status.synced && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-green-800 font-medium mb-2">✓ Conectado con Google</p>
            <p className="text-sm text-green-700">
              Ahora selecciona qué calendario quieres usar:
            </p>
          </div>

          {calendars.length === 0 ? (
            <button
              onClick={loadCalendars}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Cargar Calendarios
            </button>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un calendario:
              </label>
              {calendars.map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => handleSelectCalendar(cal.id)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                  </svg>
                  <div>
                    <div className="font-medium">{cal.summary}</div>
                    {cal.primary && (
                      <span className="text-xs text-blue-600">Principal</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ESTADO: COMPLETAMENTE CONFIGURADO */}
      {status.connected && status.synced && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-green-800 font-semibold text-lg">Sincronización Activa</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Calendario:</span>
                <span className="font-medium text-green-800">{status.calendarId}</span>
              </div>
              
              {status.lastSync ? (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Última sincronización:</span>
                  <span className="font-medium text-green-800">
                    {new Date(status.lastSync).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Estado:</span>
                  <span className="font-medium text-orange-600">Pendiente primera sincronización</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sincronizando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sincronizar
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              className="border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Desconectar
            </button>
          </div>

          {/* Información útil */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Cómo funciona
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">→</span>
                <span><strong>Lobba → Google:</strong> Las reservas confirmadas aparecen automáticamente en tu Google Calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">→</span>
                <span><strong>Google → Lobba:</strong> Tus eventos de Google Calendar bloquean horarios en Lobba (evita doble reservas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">💡</span>
                <span>Sincroniza manualmente cuando crees eventos en Google Calendar</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

