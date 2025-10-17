import { useEffect, useState } from 'react'
import { Card, Input, Select, Alert } from '../../components/common'
import useStore from '../../store'
import apiClient from '../../services/api'

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
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">
          No autorizado. Solo administradores pueden acceder.
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'user').length,
    salons: users.filter((u) => u.role === 'salon').length,
    devices: users.filter((u) => u.role === 'device').length,
  }

  const roleColors = {
    user: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
    salon: 'bg-[#FFE6F5] text-[#C71585]',
    device: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100',
    admin: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8">
        Panel de Administración
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Total Usuarios
          </h3>
          <p className="text-4xl font-bold text-[#FF1493]">{stats.total}</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Clientes
          </h3>
          <p className="text-4xl font-bold text-[#FF1493]">{stats.clients}</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Salones
          </h3>
          <p className="text-4xl font-bold text-[#FF1493]">{stats.salons}</p>
        </Card>
        <Card className="text-center">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Equipos
          </h3>
          <p className="text-4xl font-bold text-[#FF1493]">{stats.devices}</p>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </div>
          
          <div className="md:min-w-[200px]">
            <Select
              label="Filtrar por Rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              fullWidth
            >
              <option value="all">Todos</option>
              <option value="user">Clientes</option>
              <option value="salon">Salones</option>
              <option value="device">Equipos</option>
              <option value="admin">Administradores</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${roleColors[user.role] || roleColors.user}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700">
                    {user.membershipActive ? (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100">
                        Inactivo
                      </span>
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
