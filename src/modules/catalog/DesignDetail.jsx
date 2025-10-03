import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getDesignDetail, rateDesign, getDesignRatings } from '../../services/catalog'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './DesignDetail.css'

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

  if (loading) return <div className="loading">Cargando diseño...</div>
  if (error && !design) return <div className="error-message">{error}</div>
  if (!design) return <div>Diseño no encontrado</div>

  return (
    <div className="design-detail-page">
      <Card>
        <div className="design-content">
          <div className="design-image-large">
            <img src={design.preview_image_url} alt={design.name} />
          </div>

          <div className="design-details">
            <h1>{design.name}</h1>
            
            <div className="design-type-badge">
              {design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}
            </div>

            {design.description && (
              <p className="description">{design.description}</p>
            )}

            <div className="rating-summary">
              <div className="average-rating">
                <span className="rating-number">{design.averageRating.toFixed(1)}</span>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={star <= Math.round(design.averageRating) ? 'star filled' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="rating-count">
                  {design.ratingCount} {design.ratingCount === 1 ? 'valoración' : 'valoraciones'}
                </span>
              </div>

              {design.ratingDistribution && (
                <div className="rating-distribution">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="distribution-row">
                      <span>{star} ★</span>
                      <div className="bar">
                        <div 
                          className="fill" 
                          style={{ 
                            width: `${(design.ratingDistribution[star] / design.ratingCount * 100) || 0}%` 
                          }}
                        />
                      </div>
                      <span>{design.ratingDistribution[star]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rating-form">
              <h3>Tu valoración</h3>
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleSubmitRating}>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={star <= myRating ? 'star-btn filled' : 'star-btn'}
                      onClick={() => setMyRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Escribe tu comentario (opcional)"
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows="4"
                />

                <Button type="submit" disabled={myRating === 0}>
                  Enviar valoración
                </Button>
              </form>
            </div>

            <div className="ratings-list">
              <h3>Valoraciones ({ratings.length})</h3>
              {ratings.length === 0 ? (
                <p className="empty">No hay valoraciones aún</p>
              ) : (
                ratings.map(rating => (
                  <div key={rating.id} className="rating-item">
                    <div className="rating-header">
                      <strong>{rating.first_name} {rating.last_name}</strong>
                      <div className="stars-small">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={star <= rating.rating ? 'filled' : ''}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    {rating.comment && <p className="comment">{rating.comment}</p>}
                    <span className="date">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DesignDetail
