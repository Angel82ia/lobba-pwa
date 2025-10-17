import { useState, useEffect } from 'react'
import { getReferralStats, getReferralHistory } from '../../services/referral'
import { Card, Button, Alert } from '../../components/common'

const ReferralDashboard = () => {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    try {
      setLoading(true)
      const [statsData, historyData] = await Promise.all([
        getReferralStats(),
        getReferralHistory()
      ])
      
      setStats(statsData.data)
      setHistory(historyData.data)
      setError(null)
    } catch (err) {
      setError('Error cargando datos de referidos')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getProgressPercentage = () => {
    if (!stats?.stats) return 0
    return (stats.stats.completed / stats.stats.needed) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando programa de referidos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Alert variant="error" className="mb-6">{error}</Alert>
        <Button onClick={loadReferralData}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-primary text-4xl font-bold text-[#FF1493] mb-4">
        Programa de Referidos
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Invita a 4 amigas y consigue un mes gratis para todas
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Referral Code Card */}
        <Card className="bg-gradient-to-br from-[#FFE6F5] to-white dark:from-[#4A1135] dark:to-gray-800" padding="large">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tu Código de Referido
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-4 border-2 border-dashed border-[#FF1493]">
            <div className="text-center mb-4">
              <span className="text-4xl font-mono font-bold text-[#FF1493] tracking-wider">
                {stats?.referralCode || 'LOBBA000000'}
              </span>
            </div>
            <Button 
              onClick={copyReferralCode}
              fullWidth
              variant={copied ? 'success' : 'primary'}
            >
              {copied ? '✓ ¡Copiado!' : '📋 Copiar Código'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Comparte este código con tus amigas para que lo usen al registrarse
          </p>
        </Card>

        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950" padding="large">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Progreso de Referidos
          </h2>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-[#FF1493] mb-2">
              {stats?.stats?.completed || 0}
            </div>
            <div className="text-lg text-gray-700 dark:text-gray-300">
              de {stats?.stats?.needed || 4} completados
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF1493] to-[#C71585] transition-all duration-500 rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          {stats?.stats?.remaining > 0 ? (
            <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
              ¡Te faltan {stats.stats.remaining} referidos para obtener tu mes gratis!
            </p>
          ) : (
            <p className="text-center text-green-600 dark:text-green-400 font-bold text-lg">
              ¡Felicidades! Has completado el programa de referidos 🎉
            </p>
          )}
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">
                {stats?.stats?.pending || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pendientes</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">
                {stats?.stats?.total || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Rewards Card */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mb-8" padding="large">
        <h2 className="text-2xl font-bold mb-6">🏆 Recompensas</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
            <div className="text-4xl">🎁</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Mes Gratis para Todas</h3>
              <p className="text-gray-300 text-sm">
                Invita a 4 amigas que se suscriban y todas recibirán un mes gratis
              </p>
            </div>
            {stats?.rewards?.freeMonthsGranted && (
              <div className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                ✓ Conseguido
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-4 bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
            <div className="text-4xl">🎰</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Sorteo Trimestral</h3>
              <p className="text-gray-300 text-sm">
                Participa en el sorteo trimestral de 1 año de membresía gratis
              </p>
              {stats?.rewards?.raffleQuarter && (
                <p className="text-xs text-gray-400 mt-1">Sorteo: {stats.rewards.raffleQuarter}</p>
              )}
            </div>
            {stats?.rewards?.raffleEntryGranted && (
              <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold">
                ✓ Participando
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="bg-white dark:bg-gray-800" padding="large">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📜 Historial de Referidos
          </h2>
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div 
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {entry.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.email}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.membershipChosen ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      entry.membershipChosen === 'essential'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-100'
                    }`}>
                      {entry.membershipChosen === 'essential' ? 'Essential' : 'Spirit'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                      Pendiente
                    </span>
                  )}
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    entry.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100'
                  }`}>
                    {entry.status === 'completed' ? 'Completado' : 'Pendiente de pago'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.registeredAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* How it Works */}
      <Card className="bg-blue-50 dark:bg-blue-950 mt-8" padding="large">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          ℹ️ Cómo funciona
        </h2>
        <ol className="space-y-4 text-gray-700 dark:text-gray-300">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold">1</span>
            <span>Comparte tu código de referido con tus amigas</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold">2</span>
            <span>Tus amigas deben usar el código al registrarse</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold">3</span>
            <span>Cuando tus 4 amigas completen su primer pago, todas (incluida tú) recibirán un mes gratis</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold">4</span>
            <span>Automáticamente participarás en el sorteo trimestral de 1 año de membresía gratis</span>
          </li>
        </ol>
        <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            <strong className="font-bold">Nota:</strong> No podrás cambiar de membresía hasta el segundo cobro para asegurar que todas reciban su mes gratis.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default ReferralDashboard
