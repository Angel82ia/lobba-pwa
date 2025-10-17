import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../../components/common'

const MembershipPlans = () => {
  const navigate = useNavigate()

  const plans = [
    {
      id: 'essential',
      name: 'Essential',
      price: 9.99,
      period: 'mes',
      icon: '💎',
      color: 'from-blue-500 to-cyan-500',
      features: [
        'Acceso básico a servicios',
        'Descuentos exclusivos',
        'Reservas prioritarias',
        'Notificaciones de ofertas',
        'Soporte básico',
      ],
      recommended: false,
    },
    {
      id: 'spirit',
      name: 'Spirit',
      price: 14.99,
      period: 'mes',
      icon: '✨',
      color: 'from-purple-500 to-pink-500',
      features: [
        'Todo lo de Essential',
        'Comparte con 1 persona',
        'Descuentos premium',
        'Acceso a eventos exclusivos',
        'Participación en sorteos',
        'Soporte prioritario',
        'Sin límite de reservas',
      ],
      recommended: true,
    },
  ]

  const handleSelectPlan = (planId) => {
    // Navigate to checkout or subscription page
    navigate(`/membership/checkout/${planId}`)
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-primary text-4xl font-bold text-[#FF1493] mb-4">
          💫 Planes de Membresía LOBBA
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Elige el plan perfecto para ti y disfruta de beneficios exclusivos
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative overflow-hidden ${
              plan.recommended ? 'ring-4 ring-[#FF1493] scale-105' : ''
            }`}
            padding="none"
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-[#FF1493] text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                ⭐ Recomendado
              </div>
            )}

            {/* Header */}
            <div className={`bg-gradient-to-r ${plan.color} p-8 text-center text-white`}>
              <div className="text-6xl mb-4">{plan.icon}</div>
              <h2 className="text-3xl font-bold mb-2">{plan.name}</h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">{plan.price}€</span>
                <span className="text-xl opacity-90">/ {plan.period}</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-8">
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-green-500 text-xl flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                variant={plan.recommended ? 'primary' : 'outline'}
                fullWidth
                size="large"
              >
                {plan.recommended ? '🚀 Comenzar Ahora' : 'Seleccionar Plan'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 max-w-4xl mx-auto" padding="large">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          ℹ️ Información Importante
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
          <div className="flex gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h4 className="font-semibold mb-1">Pago Seguro</h4>
              <p className="text-sm">Procesamos pagos de forma segura con encriptación SSL</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="font-semibold mb-1">Cancela Cuando Quieras</h4>
              <p className="text-sm">Sin permanencia, cancela tu suscripción en cualquier momento</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <h4 className="font-semibold mb-1">Programa de Referidos</h4>
              <p className="text-sm">Invita a 4 amigas y consigue un mes gratis para todas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h4 className="font-semibold mb-1">Soporte 24/7</h4>
              <p className="text-sm">Nuestro equipo está disponible para ayudarte</p>
            </div>
          </div>
        </div>
      </Card>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-12">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          ❓ Preguntas Frecuentes
        </h3>
        <div className="space-y-4">
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ¿Puedo cambiar de plan después?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu panel de membresía.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ¿Qué pasa con el plan Spirit si comparto?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Puedes compartir tu membresía Spirit con una persona especial. Ambas disfrutarán de todos los beneficios del plan.
            </p>
          </Card>
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ¿Cómo funciona la renovación?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tu membresía se renueva automáticamente cada mes. Puedes cancelar la renovación automática en cualquier momento.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MembershipPlans

