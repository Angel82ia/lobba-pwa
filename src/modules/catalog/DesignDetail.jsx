import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getDesignDetail, rateDesign, getDesignRatings } from '../../services/catalog'
import { Card, Button, Textarea, Alert } from '../../components/common'

const DesignDetail = () => {
  const { id } = useParams()
  const [design, setDesign] = useState(null)
  const [ratings, setRatings] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDesign = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDesignDetail(id)
      setDesign(data)
      if (data.userRating) {
        setMyRating(data.userRating.rating)
        setMyComment(data.userRating.comment || '')
      }
    } catch (err) {
      setError('Error al cargar diseño')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchRatings = useCallback(async () => {
    try {
      const data = await getDesignRatings(id)
      setRatings(data)
    } catch (err) {
      setError((prev) => prev || 'Error al cargar valoraciones')
    }
  }, [id])

  useEffect(() => {
    fetchDesign()
    fetchRatings()
  }, [fetchDesign, fetchRatings])

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    if (myRating === 0) {
      setError('Por favor selecciona una calificación')
      return
    }

    try {
      setError('')
      await rateDesign(id, myRating, myComment)
      fetchDesign()
      fetchRatings()
    } catch (err) {
      setError('Error al enviar calificación')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando diseño...</p>
      </div>
    )
  }

  if (error && !design) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (!design) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Diseño no encontrado
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <Card padding="none" className="overflow-hidden">
            <img 
              src={design.preview_image_url} 
              alt={design.name}
              className="w-full h-auto"
            />
          </Card>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <Card padding="large">
            <h1 className="font-primary text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {design.name}
            </h1>
            
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                {design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}
              </span>
            </div>

            {design.description && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                {design.description}
              </p>
            )}

            {/* Rating Summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-[#FF1493] mb-2">
                  {design.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center text-3xl text-yellow-400 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= Math.round(design.averageRating) ? '' : 'opacity-30'}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {design.ratingCount} {design.ratingCount === 1 ? 'valoración' : 'valoraciones'}
                </p>
              </div>

              {/* Rating Distribution */}
              {design.ratingDistribution && (
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 w-8">{star} ★</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(design.ratingDistribution[star] / design.ratingCount * 100) || 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 w-8 text-right">
                        {design.ratingDistribution[star]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Rating Form */}
          <Card padding="large">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ⭐ Tu valoración
            </h3>
            
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            
            <form onSubmit={handleSubmitRating} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Calificación
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`text-5xl transition-all duration-200 ${
                        star <= myRating 
                          ? 'text-yellow-400 scale-110' 
                          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 hover:scale-110'
                      }`}
                      onClick={() => setMyRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Comentario (opcional)"
                placeholder="Escribe tu opinión sobre este diseño..."
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={4}
                maxLength={500}
                fullWidth
              />

              <Button type="submit" disabled={myRating === 0} fullWidth size="large">
                Enviar valoración
              </Button>
            </form>
          </Card>

          {/* Ratings List */}
          <Card padding="large">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              💬 Valoraciones ({ratings.length})
            </h3>
            {ratings.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No hay valoraciones aún. ¡Sé el primero!
              </p>
            ) : (
              <div className="space-y-4">
                {ratings.map(rating => (
                  <div 
                    key={rating.id} 
                    className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-gray-900 dark:text-white">
                        {rating.first_name} {rating.last_name}
                      </strong>
                      <div className="flex text-yellow-400 text-lg">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={star <= rating.rating ? '' : 'opacity-30'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                        {rating.comment}
                      </p>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(rating.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DesignDetail
