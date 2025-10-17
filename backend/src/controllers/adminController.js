import pool from '../config/database.js'

export const getAllUsers = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado. Solo administradores pueden acceder.' })
    }

    const result = await pool.query(`
      SELECT 
        id,
        email,
        first_name AS "firstName",
        last_name AS "lastName",
        role,
        membership_active AS "membershipActive",
        membership_status AS "membershipStatus",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      ORDER BY created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

export const getUserById = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const { id } = req.params

    const result = await pool.query(
      `
      SELECT 
        id,
        email,
        first_name AS "firstName",
        last_name AS "lastName",
        role,
        membership_active AS "membershipActive",
        membership_status AS "membershipStatus",
        avatar,
        bio,
        referral_code AS "referralCode",
        referred_by AS "referredBy",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
    `,
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

export const updateUserRole = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const { id } = req.params
    const { role } = req.body

    // Validar el rol
    const validRoles = ['user', 'salon', 'admin', 'device']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, role`,
      [role, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ message: 'Rol actualizado exitosamente', user: result.rows[0] })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ error: 'Error al actualizar rol' })
  }
}

export const getAdminStats = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'user') AS users,
        COUNT(*) FILTER (WHERE role = 'salon') AS salons,
        COUNT(*) FILTER (WHERE role = 'device') AS devices,
        COUNT(*) FILTER (WHERE role = 'admin') AS admins,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE membership_active = true) AS active_memberships,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days') AS new_users_month
      FROM users
    `)

    res.json(stats.rows[0])
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

export const deleteUser = async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const { id } = req.params

    // No permitir eliminar al propio usuario admin
    if (id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' })
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ message: 'Usuario eliminado exitosamente', user: result.rows[0] })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
}
