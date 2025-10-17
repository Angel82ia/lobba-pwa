import { useState, useEffect, useCallback } from 'react'
import { getMyDesigns, getMyFavorites, toggleFavorite } from '../../services/ai'
import { Card, Button, Alert } from '../../components/common'

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
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="font-primary text-3xl font-bold text-[#FF1493] mb-8 text-center">
        🎨 Mis Diseños
      </h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
            activeTab === 'all'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => { setActiveTab('all'); setPage(1); }}
        >
          📁 Todos
        </button>
        <button
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
            activeTab === 'favorites'
              ? 'bg-[#FF1493] text-white shadow-lg shadow-[#FF1493]/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          onClick={() => { setActiveTab('favorites'); setPage(1); }}
        >
          ❤️ Favoritos
        </button>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#FF1493] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando diseños...</p>
          </div>
        </div>
      ) : designs.length === 0 ? (
        <Card className="text-center" padding="large">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No tienes diseños guardados aún
          </p>
          <p className="text-gray-500 dark:text-gray-500 mt-2">
            ¡Crea tu primer diseño con IA!
          </p>
        </Card>
      ) : (
        <>
          {/* Designs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <Card key={design.id} padding="none" className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                  <img 
                    src={design.output_image_url} 
                    alt={design.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Favorite Button */}
                  <button
                    className={`absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      design.is_favorite 
                        ? 'bg-red-500 text-white shadow-lg scale-110' 
                        : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white hover:scale-110'
                    }`}
                    onClick={() => handleToggleFavorite(design.id)}
                    aria-label="Toggle favorite"
                  >
                    <span className="text-2xl">{design.is_favorite ? '❤️' : '🤍'}</span>
                  </button>

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white">
                      {design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {design.title}
                  </h3>
                  {design.prompt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {design.prompt}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              variant="outline"
            >
              ← Anterior
            </Button>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Página {page}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={designs.length < 20}
              variant="outline"
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default MyDesigns
