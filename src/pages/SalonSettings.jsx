import { useParams } from 'react-router-dom'
import GoogleCalendarIntegration from '../modules/salon/components/GoogleCalendarIntegration'

export default function SalonSettings() {
  const { id } = useParams()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Integraciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta tu salón con Google Calendar y otras herramientas
        </p>
      </div>

      <GoogleCalendarIntegration salonId={id} />
    </div>
  )
}

