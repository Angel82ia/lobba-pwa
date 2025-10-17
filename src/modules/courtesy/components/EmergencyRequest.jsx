import { useState, useEffect } from 'react';
import { useEmergency, getCurrentMonthLimits } from '../../../services/courtesy';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

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
      <div className="flex justify-center items-center min-h-[400px] text-xl text-gray-600 dark:text-gray-400">
        <p>Cargando...</p>
      </div>
    );
  }

  const emergenciesRemaining = limits?.emergencies?.remaining || 0;
  const emergenciesUsed = limits?.emergencies?.used || 0;
  const emergenciesLimit = limits?.emergencies?.limit || 0;

  return (
    <div className="max-w-3xl mx-auto py-5 px-4 md:px-5">
      <h1 className="font-primary text-3xl md:text-4xl mb-6 text-gray-900 dark:text-white">Artículos de Emergencia</h1>

      <Card className="mb-5 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🚨</span>
          <h2 className="font-primary text-2xl m-0">Límite Mensual</h2>
        </div>
        <div>
          <div className="h-3 bg-white/30 rounded-md overflow-hidden mb-3">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(emergenciesUsed / emergenciesLimit) * 100}%`,
                backgroundColor: emergenciesRemaining > 0 ? '#4CAF50' : '#f44336',
              }}
            />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-lg">
            <span className="font-semibold">{emergenciesUsed} / {emergenciesLimit} usados</span>
            <span className={`font-bold px-3 py-1 rounded-2xl ${emergenciesRemaining === 0 ? 'bg-red-500/30' : 'bg-white/20'}`}>
              {emergenciesRemaining} disponibles
            </span>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-5 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
          <p className="text-red-700 dark:text-red-400 m-0">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="mb-5 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
          <p className="text-green-700 dark:text-green-400 m-0 font-medium">
            ✅ Artículo de emergencia solicitado con éxito. 
            Dirígete al salón indicado para recogerlo.
          </p>
        </Card>
      )}

      <Card className="mb-5">
        <div className="mb-6 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
          <h2 className="font-primary text-2xl text-gray-900 dark:text-white m-0 mb-2">Solicitar Artículo</h2>
          <p className="text-gray-600 dark:text-gray-400 m-0">Selecciona el artículo que necesitas y el salón más cercano</p>
        </div>

        <form onSubmit={handleRequestEmergency} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-900 dark:text-white text-base">Tipo de Artículo *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                className={`flex flex-col items-center gap-2 p-6 border-3 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 ${
                  selectedArticle === 'pad' 
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-purple-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:-translate-y-0.5 hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => setSelectedArticle('pad')}
                disabled={emergenciesRemaining === 0}
              >
                <span className="text-5xl">📋</span>
                <span className={`font-semibold text-lg ${selectedArticle === 'pad' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Compresa</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center gap-2 p-6 border-3 rounded-xl bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 ${
                  selectedArticle === 'tampon' 
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-purple-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:-translate-y-0.5 hover:shadow-lg'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={() => setSelectedArticle('tampon')}
                disabled={emergenciesRemaining === 0}
              >
                <span className="text-5xl">🩸</span>
                <span className={`font-semibold text-lg ${selectedArticle === 'tampon' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Tampón</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="commerceId" className="font-semibold text-gray-900 dark:text-white text-base">ID Salón *</label>
            <input
              type="text"
              id="commerceId"
              value={commerceId}
              onChange={(e) => setCommerceId(e.target.value)}
              placeholder="Ej: COM-123"
              required
              disabled={emergenciesRemaining === 0}
              className="p-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
            <small className="text-gray-600 dark:text-gray-400 text-sm italic">
              Busca el salón más cercano en el mapa o escanea su código QR
            </small>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="commerceName" className="font-semibold text-gray-900 dark:text-white text-base">Nombre Salón *</label>
            <input
              type="text"
              id="commerceName"
              value={commerceName}
              onChange={(e) => setCommerceName(e.target.value)}
              placeholder="Ej: Salón Belleza Madrid"
              required
              disabled={emergenciesRemaining === 0}
              className="p-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
            />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 p-4 rounded-lg flex gap-3">
            <p className="text-2xl m-0">ℹ️</p>
            <div className="flex-1">
              <p className="m-0 mb-2 font-semibold text-gray-900 dark:text-white"><strong>Importante:</strong></p>
              <ul className="m-0 pl-5 text-gray-600 dark:text-gray-400">
                <li className="mb-1">Los artículos están disponibles en todos los salones asociados</li>
                <li className="mb-1">Presenta tu membresía al recoger el artículo</li>
                <li className="mb-1">Límite de {emergenciesLimit} artículos por mes</li>
                <li className="mb-0">Este servicio es exclusivo para miembros Essential y Spirit</li>
              </ul>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={processing || emergenciesRemaining === 0 || !selectedArticle}
            fullWidth
            size="large"
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
        fullWidth
        className="mt-4"
      >
        ← Volver al Dashboard
      </Button>
    </div>
  );
};

export default EmergencyRequest;
