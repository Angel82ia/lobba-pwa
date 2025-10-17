import { useState, useEffect } from 'react';
import { useEmergency, getCurrentMonthLimits } from '../../../services/courtesy';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import './EmergencyRequest.css';

const EmergencyRequest = () => {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState('');
  const [commerceId, setCommerceId] = useState('');
  const [commerceName, setCommerceName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentMonthLimits();
      setLimits(data);
    } catch (err) {
      setError(err.message || 'Error al cargar límites');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmergency = async (e) => {
    e.preventDefault();

    if (!selectedArticle || !commerceId.trim() || !commerceName.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!limits || limits.emergencies.remaining <= 0) {
      setError('Has alcanzado el límite mensual de artículos de emergencia');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(false);

      await useEmergency({
        articleType: selectedArticle,
        commerceId: commerceId.trim(),
        commerceName: commerceName.trim(),
      });

      setSuccess(true);
      setSelectedArticle('');
      setCommerceId('');
      setCommerceName('');
      await loadLimits();
    } catch (err) {
      setError(err.message || 'Error al solicitar artículo de emergencia');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="emergency-request-loading">
        <p>Cargando...</p>
      </div>
    );
  }

  const emergenciesRemaining = limits?.emergencies?.remaining || 0;
  const emergenciesUsed = limits?.emergencies?.used || 0;
  const emergenciesLimit = limits?.emergencies?.limit || 0;

  return (
    <div className="emergency-request">
      <h1>Artículos de Emergencia</h1>

      <Card className="limits-info-card">
        <div className="limits-header">
          <span className="limits-icon">🚨</span>
          <h2>Límite Mensual</h2>
        </div>
        <div className="limits-content">
          <div className="limits-bar">
            <div
              className="limits-fill"
              style={{
                width: `${(emergenciesUsed / emergenciesLimit) * 100}%`,
                backgroundColor: emergenciesRemaining > 0 ? '#4CAF50' : '#f44336',
              }}
            />
          </div>
          <div className="limits-text">
            <span className="used">{emergenciesUsed} / {emergenciesLimit} usados</span>
            <span className={`remaining ${emergenciesRemaining === 0 ? 'zero' : ''}`}>
              {emergenciesRemaining} disponibles
            </span>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="success-card">
          <p className="success-message">
            ✅ Artículo de emergencia solicitado con éxito. 
            Dirígete al salón indicado para recogerlo.
          </p>
        </Card>
      )}

      <Card className="request-form-card">
        <div className="form-header">
          <h2>Solicitar Artículo</h2>
          <p>Selecciona el artículo que necesitas y el salón más cercano</p>
        </div>

        <form onSubmit={handleRequestEmergency} className="request-form">
          <div className="form-group">
            <label>Tipo de Artículo *</label>
            <div className="article-selection">
              <button
                type="button"
                className={`article-option ${selectedArticle === 'pad' ? 'selected' : ''}`}
                onClick={() => setSelectedArticle('pad')}
                disabled={emergenciesRemaining === 0}
              >
                <span className="article-icon">📋</span>
                <span className="article-name">Compresa</span>
              </button>
              <button
                type="button"
                className={`article-option ${selectedArticle === 'tampon' ? 'selected' : ''}`}
                onClick={() => setSelectedArticle('tampon')}
                disabled={emergenciesRemaining === 0}
              >
                <span className="article-icon">🩸</span>
                <span className="article-name">Tampón</span>
              </button>
            </div>
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
              disabled={emergenciesRemaining === 0}
            />
            <small className="field-help">
              Busca el salón más cercano en el mapa o escanea su código QR
            </small>
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
              disabled={emergenciesRemaining === 0}
            />
          </div>

          <div className="info-box">
            <p className="info-icon">ℹ️</p>
            <div className="info-content">
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Los artículos están disponibles en todos los salones asociados</li>
                <li>Presenta tu membresía al recoger el artículo</li>
                <li>Límite de {emergenciesLimit} artículos por mes</li>
                <li>Este servicio es exclusivo para miembros Essential y Spirit</li>
              </ul>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={processing || emergenciesRemaining === 0 || !selectedArticle}
            className="submit-button"
          >
            {processing 
              ? 'Procesando...' 
              : emergenciesRemaining === 0 
                ? 'Límite Mensual Alcanzado'
                : 'Solicitar Artículo'}
          </Button>
        </form>
      </Card>

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

export default EmergencyRequest;
