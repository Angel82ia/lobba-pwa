import { useState, useEffect } from 'react'
import { getReferralStats, getReferralHistory } from '../../services/referral'
import Card from '../../components/common/Card'
import './ReferralDashboard.css'

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
      console.error('Error loading referral data:', err)
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
      <div className="referral-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando programa de referidos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="referral-dashboard">
        <Card variant="error">
          <p>{error}</p>
          <button onClick={loadReferralData} className="retry-button">
            Reintentar
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="referral-dashboard">
      <div className="referral-header">
        <h1 className="referral-title">Programa de Referidos</h1>
        <p className="referral-subtitle">
          Invita a 4 amigas y consigue un mes gratis para todas
        </p>
      </div>

      <div className="referral-grid">
        <Card variant="glass" className="referral-code-card">
          <div className="card-header">
            <h2>Tu Código de Referido</h2>
          </div>
          <div className="referral-code-display">
            <div className="code-box">
              <span className="code-text">{stats?.referralCode || 'LOBBA000000'}</span>
            </div>
            <button 
              className={`copy-button ${copied ? 'copied' : ''}`}
              onClick={copyReferralCode}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="code-help">
            Comparte este código con tus amigas para que lo usen al registrarse
          </p>
        </Card>

        <Card variant="gradient" className="progress-card">
          <div className="card-header">
            <h2>Progreso de Referidos</h2>
          </div>
          <div className="progress-stats">
            <div className="stat-large">
              <span className="stat-number">{stats?.stats?.completed || 0}</span>
              <span className="stat-label">de {stats?.stats?.needed || 4} completados</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            {stats?.stats?.remaining > 0 && (
              <p className="remaining-text">
                ¡Te faltan {stats.stats.remaining} referidos para obtener tu mes gratis!
              </p>
            )}
            {stats?.stats?.completed >= stats?.stats?.needed && (
              <p className="success-text">
                ¡Felicidades! Has completado el programa de referidos 🎉
              </p>
            )}
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats?.stats?.pending || 0}</span>
              <span className="stat-name">Pendientes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats?.stats?.total || 0}</span>
              <span className="stat-name">Total</span>
            </div>
          </div>
        </Card>

        <Card variant="dark" className="rewards-card">
          <div className="card-header">
            <h2>Recompensas</h2>
          </div>
          <div className="rewards-list">
            <div className="reward-item">
              <div className="reward-icon">🎁</div>
              <div className="reward-content">
                <h3>Mes Gratis para Todas</h3>
                <p>Invita a 4 amigas que se suscriban y todas recibirán un mes gratis</p>
              </div>
              {stats?.rewards?.freeMonthsGranted && (
                <div className="reward-badge">✓ Conseguido</div>
              )}
            </div>
            <div className="reward-item">
              <div className="reward-icon">🎰</div>
              <div className="reward-content">
                <h3>Sorteo Trimestral</h3>
                <p>Participa en el sorteo trimestral de 1 año de membresía gratis</p>
                {stats?.rewards?.raffleQuarter && (
                  <small>Sorteo: {stats.rewards.raffleQuarter}</small>
                )}
              </div>
              {stats?.rewards?.raffleEntryGranted && (
                <div className="reward-badge">✓ Participando</div>
              )}
            </div>
          </div>
        </Card>

        {history.length > 0 && (
          <Card variant="glass" className="history-card">
            <div className="card-header">
              <h2>Historial de Referidos</h2>
            </div>
            <div className="history-list">
              {history.map((entry, index) => (
                <div key={index} className="history-item">
                  <div className="history-info">
                    <div className="history-name">{entry.name}</div>
                    <div className="history-email">{entry.email}</div>
                  </div>
                  <div className="history-details">
                    <div className="history-membership">
                      {entry.membershipChosen ? (
                        <span className={`membership-badge ${entry.membershipChosen}`}>
                          {entry.membershipChosen === 'essential' ? 'Essential' : 'Spirit'}
                        </span>
                      ) : (
                        <span className="status-badge pending">Pendiente</span>
                      )}
                    </div>
                    <div className="history-status">
                      <span className={`status-badge ${entry.status}`}>
                        {entry.status === 'completed' ? 'Completado' : 'Pendiente de pago'}
                      </span>
                    </div>
                  </div>
                  <div className="history-date">
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
      </div>

      <Card variant="info" className="info-card">
        <div className="card-header">
          <h2>Cómo funciona</h2>
        </div>
        <div className="info-content">
          <ol className="info-steps">
            <li>Comparte tu código de referido con tus amigas</li>
            <li>Tus amigas deben usar el código al registrarse</li>
            <li>Cuando tus 4 amigas completen su primer pago, todas (incluida tú) recibirán un mes gratis</li>
            <li>Automáticamente participarás en el sorteo trimestral de 1 año de membresía gratis</li>
          </ol>
          <div className="info-note">
            <strong>Nota:</strong> No podrás cambiar de membresía hasta el segundo cobro para asegurar que todas reciban su mes gratis.
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ReferralDashboard
