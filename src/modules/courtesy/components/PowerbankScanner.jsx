import { useState, useEffect } from 'react';
import { loanPowerbank, getActivePowerbank, returnPowerbank } from '../../../services/courtesy';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

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
      await loanPowerbank({
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
      <div className="flex justify-center items-center min-h-[400px] text-xl text-gray-600 dark:text-gray-400">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-5 px-4 md:px-5">
      <h1 className="font-primary text-3xl md:text-4xl mb-6 text-gray-900 dark:text-white">Powerbank de Cortesía</h1>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 mb-5">
          <p className="text-red-700 dark:text-red-400 m-0">{error}</p>
        </Card>
      )}

      {activeLoan ? (
        <Card className="mb-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
            <span className="text-4xl">🔋</span>
            <h2 className="font-primary text-2xl text-gray-900 dark:text-white m-0">Powerbank Activo</h2>
          </div>

          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between py-3 border-b border-gray-200 dark:border-gray-700 gap-1 md:gap-0">
              <span className="font-semibold text-gray-600 dark:text-gray-400">ID Powerbank:</span>
              <span className="text-gray-900 dark:text-white md:text-right">{activeLoan.powerbankId}</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between py-3 border-b border-gray-200 dark:border-gray-700 gap-1 md:gap-0">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Salón:</span>
              <span className="text-gray-900 dark:text-white md:text-right">{activeLoan.commerce?.name || 'N/A'}</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between py-3 border-b border-gray-200 dark:border-gray-700 gap-1 md:gap-0">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Prestado:</span>
              <span className="text-gray-900 dark:text-white md:text-right">
                {new Date(activeLoan.loanDate).toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex flex-col md:flex-row justify-between py-3 gap-1 md:gap-0">
              <span className="font-semibold text-gray-600 dark:text-gray-400">Límite devolución:</span>
              <span className="text-gray-900 dark:text-white md:text-right">
                {new Date(activeLoan.deadline).toLocaleString('es-ES')}
              </span>
            </div>
          </div>

          {timeRemaining && (
            <div className={`${timeRemaining.overdue ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'} text-white p-6 rounded-xl text-center mb-6`}>
              <h3 className="m-0 mb-3 text-xl">{timeRemaining.overdue ? '⚠️ TIEMPO AGOTADO' : '⏱️ Tiempo Restante'}</h3>
              <div className="text-5xl md:text-6xl font-bold my-3">{timeRemaining.text}</div>
              {!timeRemaining.overdue && (
                <div className="h-2 bg-white/30 rounded mt-4 overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${timeRemaining.percentage}%`,
                      backgroundColor: timeRemaining.percentage > 25 ? '#4CAF50' : '#f44336',
                    }}
                  />
                </div>
              )}
              {timeRemaining.overdue && (
                <p className="mt-3 mb-0 text-lg font-semibold">
                  ⚠️ Penalización de 10€ aplicada al devolver
                </p>
              )}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleReturnPowerbank}
            disabled={processing}
            fullWidth
          >
            {processing ? 'Procesando...' : 'Devolver Powerbank'}
          </Button>
        </Card>
      ) : (
        <Card className="mb-5">
          <div className="text-center mb-8">
            <span className="text-5xl block mb-3">📱</span>
            <h2 className="font-primary text-2xl text-gray-900 dark:text-white m-0 mb-2">Solicitar Powerbank</h2>
            <p className="text-gray-600 dark:text-gray-400 m-0">Escanea el código QR del powerbank o introduce los datos manualmente</p>
          </div>

          <form onSubmit={handleLoanPowerbank} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="powerbankId" className="font-semibold text-gray-900 dark:text-white">ID Powerbank *</label>
              <input
                type="text"
                id="powerbankId"
                value={powerbankId}
                onChange={(e) => setPowerbankId(e.target.value)}
                placeholder="Ej: PB-001"
                required
                className="p-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="commerceId" className="font-semibold text-gray-900 dark:text-white">ID Salón *</label>
              <input
                type="text"
                id="commerceId"
                value={commerceId}
                onChange={(e) => setCommerceId(e.target.value)}
                placeholder="Ej: COM-123"
                required
                className="p-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="commerceName" className="font-semibold text-gray-900 dark:text-white">Nombre Salón *</label>
              <input
                type="text"
                id="commerceName"
                value={commerceName}
                onChange={(e) => setCommerceName(e.target.value)}
                placeholder="Ej: Salón Belleza Madrid"
                required
                className="p-3 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 p-4 rounded-lg flex gap-3">
              <p className="text-2xl m-0">ℹ️</p>
              <div className="flex-1">
                <p className="m-0 mb-2 font-semibold text-gray-900 dark:text-white"><strong>Importante:</strong></p>
                <ul className="m-0 pl-5 text-gray-600 dark:text-gray-400">
                  <li className="mb-1">Tienes 24 horas para devolver el powerbank</li>
                  <li className="mb-1">Penalización de 10€ si lo devuelves tarde</li>
                  <li className="mb-0">Solo puedes tener 1 powerbank activo a la vez</li>
                </ul>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={processing}
              fullWidth
              size="large"
            >
              {processing ? 'Procesando...' : 'Solicitar Powerbank'}
            </Button>
          </form>
        </Card>
      )}

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

export default PowerbankScanner;
