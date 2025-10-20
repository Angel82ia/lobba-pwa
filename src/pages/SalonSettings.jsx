import { useParams } from 'react-router-dom'
import GoogleCalendarIntegration from '../modules/salon/components/GoogleCalendarIntegration'
import StripeConnectIntegration from '../modules/salon/components/StripeConnectIntegration'

export default function SalonSettings() {
  const { id } = useParams()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración del Salón
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configura pagos, calendario y otras integraciones
        </p>
      </div>

      {/* Configuración de Pagos - PRIORITARIO */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          💳 Pagos y Reservas
        </h2>
        <StripeConnectIntegration salonId={id} />
      </div>

      {/* Integración de Google Calendar */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📅 Calendario
        </h2>
        <GoogleCalendarIntegration salonId={id} />
      </div>
    </div>
  )
}

