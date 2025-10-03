import { useState, useEffect, useCallback } from 'react'
import { getMyDesigns, getMyFavorites, toggleFavorite } from '../../services/ai'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import './MyDesigns.css'

const MyDesigns = () => {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)

  const fetchDesigns = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = activeTab === 'favorites' 
        ? await getMyFavorites(page, 20)
        : await getMyDesigns(page, 20)
      setDesigns(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar diseños')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  const handleToggleFavorite = async (designId) => {
    try {
      await toggleFavorite(designId)
      fetchDesigns()
    } catch (err) {
      setError('Error al cambiar favorito')
    }
  }

  return (
    <div className="my-designs-page">
      <Card>
        <h1>Mis Diseños</h1>

        <div className="tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => { setActiveTab('all'); setPage(1); }}
          >
            Todos
          </button>
          <button
            className={activeTab === 'favorites' ? 'active' : ''}
            onClick={() => { setActiveTab('favorites'); setPage(1); }}
          >
            ❤️ Favoritos
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando diseños...</div>
        ) : designs.length === 0 ? (
          <div className="empty-state">
            <p>No tienes diseños guardados aún</p>
          </div>
        ) : (
          <>
            <div className="designs-grid">
              {designs.map((design) => (
                <div key={design.id} className="design-card">
                  <img src={design.output_image_url} alt={design.title} />
                  <div className="design-info">
                    <h3>{design.title}</h3>
                    <p className="design-type">{design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}</p>
                    {design.prompt && <p className="design-prompt">{design.prompt}</p>}
                    <button
                      className={`favorite-btn ${design.is_favorite ? 'active' : ''}`}
                      onClick={() => handleToggleFavorite(design.id)}
                    >
                      {design.is_favorite ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span>Página {page}</span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={designs.length < 20}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default MyDesigns
