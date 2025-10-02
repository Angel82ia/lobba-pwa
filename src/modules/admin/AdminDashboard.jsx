import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import useStore from '../../store'
import apiClient from '../../services/api'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { auth } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [unauthorized, setUnauthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    if (auth.user?.role !== 'admin') {
      setUnauthorized(true)
      setLoading(false)
      return
    }

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/admin/users')
        setUsers(response.data)
        setFilteredUsers(response.data)
      } catch (error) {
        setError(error.message || 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [auth.user])

  useEffect(() => {
    let filtered = users

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [users, roleFilter, searchTerm])

  if (unauthorized) {
    return <div className="error">No autorizado. Solo administradores pueden acceder.</div>
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'user').length,
    salons: users.filter((u) => u.role === 'salon').length,
    devices: users.filter((u) => u.role === 'device').length,
  }

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>

      <div className="stats-grid">
        <Card className="stat-card">
          <h3>Total Usuarios</h3>
          <p className="stat-value">{stats.total}</p>
        </Card>
        <Card className="stat-card">
          <h3>Clientes</h3>
          <p className="stat-value">{stats.clients}</p>
        </Card>
        <Card className="stat-card">
          <h3>Salones</h3>
          <p className="stat-value">{stats.salons}</p>
        </Card>
        <Card className="stat-card">
          <h3>Equipos</h3>
          <p className="stat-value">{stats.devices}</p>
        </Card>
      </div>

      <Card>
        <div className="filters">
          <Input
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="form-group">
            <label htmlFor="roleFilter">Filtrar por Rol</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select"
            >
              <option value="all">Todos</option>
              <option value="user">Clientes</option>
              <option value="salon">Salones</option>
              <option value="device">Equipos</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.membershipActive ? (
                      <span className="status-badge status-active">Activo</span>
                    ) : (
                      <span className="status-badge status-inactive">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminDashboard
