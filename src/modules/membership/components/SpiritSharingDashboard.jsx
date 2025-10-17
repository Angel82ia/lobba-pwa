import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { getSharedMembershipByMembershipId } from '../../../services/sharedMembership'
import { Card, Button } from '../../../components/common'
import SpiritSharingForm from './SpiritSharingForm'
import SpiritSharingList from './SpiritSharingList'

const SpiritSharingDashboard = ({ membershipId, membershipType }) => {
  const [hasShared, setHasShared] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    checkSharedStatus()
  }, [membershipId])

  const checkSharedStatus = async () => {
    try {
      setLoading(true)
      const shared = await getSharedMembershipByMembershipId(membershipId)
      setHasShared(!!shared)
    } catch (err) {
      // Error checking status - fail silently
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setShowForm(false)
    setHasShared(true)
  }

  const handleRevoke = () => {
    setHasShared(false)
  }

  if (membershipType !== 'spirit') {
    return (
      <Card className="text-center" padding="large">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Compartir Membresía no disponible
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Solo las membresías Spirit pueden compartirse. Actualiza tu membresía para poder compartir con un familiar o amiga.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#FF1493] mb-3">
          💝 Compartir Membresía Spirit
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Comparte tu membresía con un familiar o amiga para que ambas disfruten de todos los beneficios
        </p>
      </div>

      {/* CTA or Form */}
      {!hasShared && !showForm && (
        <div className="text-center py-8">
          <Button
            onClick={() => setShowForm(true)}
            size="large"
          >
            ➕ Compartir Membresía
          </Button>
        </div>
      )}

      {showForm && !hasShared && (
        <SpiritSharingForm
          membershipId={membershipId}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {hasShared && (
        <SpiritSharingList
          membershipId={membershipId}
          onRevoke={handleRevoke}
        />
      )}
    </div>
  )
}

SpiritSharingDashboard.propTypes = {
  membershipId: PropTypes.string.isRequired,
  membershipType: PropTypes.string.isRequired
}

export default SpiritSharingDashboard
