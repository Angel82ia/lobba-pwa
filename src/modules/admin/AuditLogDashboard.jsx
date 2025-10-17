import { useState, useEffect, useCallback } from 'react'
import { getAuditLogs, getAuditStats } from '../../services/auditLog'
import Card from '../../components/common/Card'

const AuditLogDashboard = () => {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState([])
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    page: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAuditLogs(filters)
      setLogs(data)
    } catch (err) {
      setError('Error al cargar logs de auditoría')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAuditStats(30)
      setStats(data)
    } catch (err) {
      setError('Error al cargar estadísticas')
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [fetchLogs, fetchStats])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  return (
    <div className="audit-log-dashboard">
      <h1>Registros de Auditoría</h1>

      <Card className="audit-stats">
        <h2>Estadísticas (Últimos 30 días)</h2>
        <div className="stats-grid">
          {stats.slice(0, 5).map((stat, idx) => (
            <div key={idx} className="stat-card">
              <span className="stat-label">{stat.action}</span>
              <span className="stat-value">{stat.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="audit-filters">
        <h2>Filtros</h2>
        <div className="filters-grid">
          <select 
            value={filters.action} 
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Todas las acciones</option>
            <option value="auth">Autenticación</option>
            <option value="user_action">Acción de usuario</option>
            <option value="admin_action">Acción admin</option>
            <option value="data_access">Acceso a datos</option>
            <option value="data_modification">Modificación</option>
            <option value="data_deletion">Eliminación</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            placeholder="Fecha fin"
          />

          <button onClick={() => setFilters({ action: '', resourceType: '', startDate: '', endDate: '', page: 1 })}>
            Limpiar filtros
          </button>
        </div>
      </Card>

      <Card className="audit-logs">
        <h2>Registros</h2>
        {loading && <p>Cargando...</p>}
        {error && <p className="error">{error}</p>}
        
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Recurso</th>
                <th>IP</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.user_email || 'N/A'}</td>
                  <td><span className={`badge badge-${log.action}`}>{log.action}</span></td>
                  <td>{log.resource_type || 'N/A'}</td>
                  <td>{log.ip_address}</td>
                  <td>
                    <button onClick={() => alert(JSON.stringify(log.details, null, 2))}>
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button 
            disabled={filters.page === 1}
            onClick={() => handleFilterChange('page', filters.page - 1)}
          >
            Anterior
          </button>
          <span>Página {filters.page}</span>
          <button 
            disabled={logs.length < 50}
            onClick={() => handleFilterChange('page', filters.page + 1)}
          >
            Siguiente
          </button>
        </div>
      </Card>
    </div>
  )
}

export default AuditLogDashboard
