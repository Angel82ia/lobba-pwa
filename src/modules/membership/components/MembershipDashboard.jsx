import { useState, useEffect } from 'react'
import { getMembershipDashboard } from '../../../services/courtesy'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'

const MembershipDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMembershipDashboard()
      setDashboard(data)
    } catch (err) {
      setError(err.message || 'Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="membership-dashboard-loading">
        <p>Cargando información de membresía...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="membership-dashboard-error">
        <Card>
          <p className="error-message">{error}</p>
          <Button onClick={loadDashboard}>Reintentar</Button>
        </Card>
      </div>
    )
  }

  if (!dashboard || !dashboard.hasMembership) {
    return (
      <div className="membership-dashboard-no-membership">
        <Card>
          <h2>Sin Membresía Activa</h2>
          <p>Actualmente no tienes una membresía activa.</p>
          <Button variant="primary" onClick={() => window.location.href = '/membership'}>
            Ver Planes de Membresía
          </Button>
        </Card>
      </div>
    )
  }

  const { membership, limits, powerbank, emergencies } = dashboard
  const membershipType = membership.type === 'essential' ? 'Essential' : 'Spirit'
  const membershipColor = membership.type === 'essential' ? '#FF1493' : '#9370DB'

  return (
    <div className="membership-dashboard">
      <Card className="membership-info-card" style={{ borderLeft: `4px solid ${membershipColor}` }}>
        <div className="membership-header">
          <h1>Membresía {membershipType}</h1>
          <span className={`membership-badge ${membership.type}`}>
            {membershipType}
          </span>
        </div>
        <div className="membership-details">
          <div className="detail-item">
            <span className="label">Estado:</span>
            <span className="value status-active">Activa</span>
          </div>
          <div className="detail-item">
            <span className="label">Precio mensual:</span>
            <span className="value">{membership.monthlyPrice}€/mes</span>
          </div>
          <div className="detail-item">
            <span className="label">Próxima facturación:</span>
            <span className="value">{new Date(membership.nextBillingDate).toLocaleDateString('es-ES')}</span>
          </div>
        </div>
      </Card>

      <div className="limits-section">
        <h2>Límites Mensuales</h2>
        <Card className="limits-card">
          <div className="limit-item">
            <div className="limit-header">
              <span className="limit-icon">🚨</span>
              <span className="limit-title">Artículos de Emergencia</span>
            </div>
            <div className="limit-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(limits.emergencies.used / limits.emergencies.limit) * 100}%`,
                    backgroundColor: limits.emergencies.remaining > 0 ? '#4CAF50' : '#f44336'
                  }}
                />
              </div>
              <div className="progress-text">
                {limits.emergencies.used} / {limits.emergencies.limit} usados
                <span className="remaining">
                  {limits.emergencies.remaining} disponibles
                </span>
              </div>
            </div>
          </div>

          <div className="limit-item">
            <div className="limit-header">
              <span className="limit-icon">📦</span>
              <span className="limit-title">Envíos Mensuales</span>
            </div>
            <div className="limit-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(limits.shipments.used / limits.shipments.limit) * 100}%`,
                    backgroundColor: limits.shipments.remaining > 0 ? '#4CAF50' : '#f44336'
                  }}
                />
              </div>
              <div className="progress-text">
                {limits.shipments.used} / {limits.shipments.limit} usados
                <span className="remaining">
                  {limits.shipments.remaining} disponibles
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="powerbank-section">
        <h2>Powerbanks</h2>
        {powerbank.active ? (
          <Card className="powerbank-active-card">
            <div className="powerbank-active-header">
              <span className="powerbank-icon">🔋</span>
              <span className="powerbank-status">Powerbank Activo</span>
            </div>
            <div className="powerbank-details">
              <p><strong>ID:</strong> {powerbank.active.powerbankId}</p>
              <p><strong>Prestado:</strong> {new Date(powerbank.active.loanDate).toLocaleString('es-ES')}</p>
              <p><strong>Límite devolución:</strong> {new Date(powerbank.active.deadline).toLocaleString('es-ES')}</p>
              <p className={powerbank.active.isOverdue ? 'overdue' : ''}>
                <strong>Tiempo restante:</strong> {powerbank.active.hoursRemaining} horas
                {powerbank.active.isOverdue && ' (¡PASADO EL LÍMITE!)'}
              </p>
              {powerbank.active.commerce?.name && (
                <p><strong>Salón:</strong> {powerbank.active.commerce.name}</p>
              )}
            </div>
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/courtesy/powerbank/return'}
            >
              Devolver Powerbank
            </Button>
          </Card>
        ) : (
          <Card className="powerbank-no-active">
            <p>No tienes ningún powerbank en préstamo</p>
            <Button onClick={() => window.location.href = '/courtesy/powerbank/scan'}>
              Solicitar Powerbank
            </Button>
          </Card>
        )}

        {powerbank.history && powerbank.history.length > 0 && (
          <div className="powerbank-history">
            <h3>Historial de Powerbanks</h3>
            <div className="history-list">
              {powerbank.history.map(loan => (
                <Card key={loan.id} className="history-item">
                  <div className="history-item-header">
                    <span>{loan.powerbankId}</span>
                    <span className={`status-badge ${loan.status}`}>{loan.status}</span>
                  </div>
                  <div className="history-item-details">
                    <p>Prestado: {new Date(loan.loanDate).toLocaleDateString('es-ES')}</p>
                    {loan.returnDate && (
                      <p>Devuelto: {new Date(loan.returnDate).toLocaleDateString('es-ES')}</p>
                    )}
                    {loan.penaltyApplied && (
                      <p className="penalty">Penalización: {loan.penaltyAmount}€</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="emergency-section">
        <h2>Artículos de Emergencia</h2>
        <Button 
          variant="primary" 
          disabled={limits.emergencies.remaining === 0}
          onClick={() => window.location.href = '/courtesy/emergency'}
        >
          {limits.emergencies.remaining > 0 
            ? 'Solicitar Artículo de Emergencia'
            : 'Límite Mensual Alcanzado'}
        </Button>

        {emergencies.history && emergencies.history.length > 0 && (
          <div className="emergency-history">
            <h3>Historial de Emergencias</h3>
            <div className="history-list">
              {emergencies.history.map(usage => (
                <Card key={usage.id} className="history-item">
                  <div className="history-item-header">
                    <span className="emergency-icon">
                      {usage.articleType === 'tampon' ? '🩸' : '📋'}
                    </span>
                    <span>{usage.articleType === 'tampon' ? 'Tampón' : 'Compresa'}</span>
                  </div>
                  <div className="history-item-details">
                    <p>Usado: {new Date(usage.usedAt).toLocaleDateString('es-ES')}</p>
                    {usage.commerce?.name && (
                      <p>Salón: {usage.commerce.name}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MembershipDashboard
