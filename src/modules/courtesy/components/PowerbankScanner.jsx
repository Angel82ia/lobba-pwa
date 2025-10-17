import { useState, useEffect } from 'react';
import { loanPowerbank, getActivePowerbank, returnPowerbank } from '../../../services/courtesy';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import './PowerbankScanner.css';

const PowerbankScanner = () => {
  const [activeLoan, setActiveLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [powerbankId, setPowerbankId] = useState('');
  const [commerceId, setCommerceId] = useState('');
  const [commerceName, setCommerceName] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadActiveLoan();
  }, []);

  const loadActiveLoan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActivePowerbank();
      setActiveLoan(data.hasActiveLoan ? data.loan : null);
    } catch (err) {
      setError(err.message || 'Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanPowerbank = async (e) => {
    e.preventDefault();
    
    if (!powerbankId.trim() || !commerceId.trim() || !commerceName.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      const result = await loanPowerbank({
        powerbankId: powerbankId.trim(),
        commerceId: commerceId.trim(),
        commerceName: commerceName.trim(),
      });
      
      await loadActiveLoan();
      setPowerbankId('');
      setCommerceId('');
      setCommerceName('');
    } catch (err) {
      setError(err.message || 'Error al solicitar powerbank');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturnPowerbank = async () => {
    if (!activeLoan) return;

    try {
      setProcessing(true);
      setError(null);
      await returnPowerbank(activeLoan.id);
      await loadActiveLoan();
    } catch (err) {
      setError(err.message || 'Error al devolver powerbank');
    } finally {
      setProcessing(false);
    }
  };

  const calculateTimeRemaining = () => {
    if (!activeLoan || !activeLoan.deadline) return null;
    
    const now = new Date();
    const deadline = new Date(activeLoan.deadline);
    const diff = deadline - now;
    
    if (diff <= 0) return { overdue: true, text: 'TIEMPO AGOTADO' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      overdue: false,
      text: `${hours}h ${minutes}m`,
      percentage: (diff / (24 * 60 * 60 * 1000)) * 100,
    };
  };

  const timeRemaining = calculateTimeRemaining();

  if (loading) {
    return (
      <div className="powerbank-scanner-loading">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="powerbank-scanner">
      <h1>Powerbank de Cortesía</h1>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      {activeLoan ? (
        <Card className="active-loan-card">
          <div className="loan-header">
            <span className="powerbank-icon">🔋</span>
            <h2>Powerbank Activo</h2>
          </div>

          <div className="loan-info">
            <div className="info-row">
              <span className="label">ID Powerbank:</span>
              <span className="value">{activeLoan.powerbankId}</span>
            </div>
            <div className="info-row">
              <span className="label">Salón:</span>
              <span className="value">{activeLoan.commerce?.name || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Prestado:</span>
              <span className="value">
                {new Date(activeLoan.loanDate).toLocaleString('es-ES')}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Límite devolución:</span>
              <span className="value">
                {new Date(activeLoan.deadline).toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {timeRemaining && (
            <div className={`countdown ${timeRemaining.overdue ? 'overdue' : ''}`}>
              <h3>{timeRemaining.overdue ? '⚠️ TIEMPO AGOTADO' : '⏱️ Tiempo Restante'}</h3>
              <div className="countdown-value">{timeRemaining.text}</div>
              {!timeRemaining.overdue && (
                <div className="countdown-bar">
                  <div 
                    className="countdown-fill"
                    style={{ 
                      width: `${timeRemaining.percentage}%`,
                      backgroundColor: timeRemaining.percentage > 25 ? '#4CAF50' : '#f44336',
                    }}
                  />
                </div>
              )}
              {timeRemaining.overdue && (
                <p className="penalty-warning">
                  ⚠️ Penalización de 10€ aplicada al devolver
                </p>
              )}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleReturnPowerbank}
            disabled={processing}
            className="return-button"
          >
            {processing ? 'Procesando...' : 'Devolver Powerbank'}
          </Button>
        </Card>
      ) : (
        <Card className="loan-form-card">
          <div className="form-header">
            <span className="scan-icon">📱</span>
            <h2>Solicitar Powerbank</h2>
            <p>Escanea el código QR del powerbank o introduce los datos manualmente</p>
          </div>

          <form onSubmit={handleLoanPowerbank} className="loan-form">
            <div className="form-group">
              <label htmlFor="powerbankId">ID Powerbank *</label>
              <input
                type="text"
                id="powerbankId"
                value={powerbankId}
                onChange={(e) => setPowerbankId(e.target.value)}
                placeholder="Ej: PB-001"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="commerceId">ID Salón *</label>
              <input
                type="text"
                id="commerceId"
                value={commerceId}
                onChange={(e) => setCommerceId(e.target.value)}
                placeholder="Ej: COM-123"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="commerceName">Nombre Salón *</label>
              <input
                type="text"
                id="commerceName"
                value={commerceName}
                onChange={(e) => setCommerceName(e.target.value)}
                placeholder="Ej: Salón Belleza Madrid"
                required
              />
            </div>

            <div className="info-box">
              <p className="info-icon">ℹ️</p>
              <div className="info-content">
                <p><strong>Importante:</strong></p>
                <ul>
                  <li>Tienes 24 horas para devolver el powerbank</li>
                  <li>Penalización de 10€ si lo devuelves tarde</li>
                  <li>Solo puedes tener 1 powerbank activo a la vez</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={processing}
              className="submit-button"
            >
              {processing ? 'Procesando...' : 'Solicitar Powerbank'}
            </Button>
          </form>
        </Card>
      )}

      <Button
        variant="secondary"
        onClick={() => window.location.href = '/membership/dashboard'}
        className="back-button"
      >
        ← Volver al Dashboard
      </Button>
    </div>
  );
};

export default PowerbankScanner;
