import { useState } from 'react'
import useStore from '../store'
import { useNavigate } from 'react-router-dom'
import './UploadAnimation.css'

const UploadAnimation = () => {
  const user = useStore((state) => state.auth.user)
  const navigate = useNavigate()
  
  const [beforePhoto, setBeforePhoto] = useState(null)
  const [afterPhoto, setAfterPhoto] = useState(null)
  const [beforePreview, setBeforePreview] = useState(null)
  const [afterPreview, setAfterPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleBeforePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar 5MB')
        return
      }
      setBeforePhoto(file)
      setBeforePreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleAfterPhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar 5MB')
        return
      }
      setAfterPhoto(file)
      setAfterPreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!beforePhoto || !afterPhoto) {
      setError('Debes seleccionar ambas fotos')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('beforePhoto', beforePhoto)
      formData.append('afterPhoto', afterPhoto)

      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const response = await fetch(
        `${apiUrl}/api/users/${user.id}/upload-animation-photos`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir las fotos')
      }

      setSuccess(true)
      
      setTimeout(() => {
        navigate('/profile')
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="upload-animation-page">
      <div className="upload-container">
        <h1 className="upload-title">Crea tu Animación Personalizada</h1>
        <p className="upload-subtitle">
          Sube tus fotos antes y después del maquillaje para crear tu animación única
        </p>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <span>✅</span> ¡Animación creada exitosamente! Redirigiendo...
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="photo-upload-section">
            <div className="photo-upload-box">
              <h3>Foto Sin Maquillaje</h3>
              <label htmlFor="before-photo" className="upload-label">
                {beforePreview ? (
                  <img src={beforePreview} alt="Preview Before" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📸</span>
                    <span>Seleccionar foto</span>
                  </div>
                )}
              </label>
              <input
                id="before-photo"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleBeforePhotoChange}
                className="file-input"
              />
            </div>

            <div className="arrow">➜</div>

            <div className="photo-upload-box">
              <h3>Foto Con Maquillaje</h3>
              <label htmlFor="after-photo" className="upload-label">
                {afterPreview ? (
                  <img src={afterPreview} alt="Preview After" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">💄</span>
                    <span>Seleccionar foto</span>
                  </div>
                )}
              </label>
              <input
                id="after-photo"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAfterPhotoChange}
                className="file-input"
              />
            </div>
          </div>

          <div className="upload-requirements">
            <h4>Requisitos:</h4>
            <ul>
              <li>Formato: JPEG, PNG o WebP</li>
              <li>Tamaño máximo: 5MB por imagen</li>
              <li>Dimensiones mínimas: 500x500px</li>
              <li>Recomendado: Buena iluminación y rostro centrado</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!beforePhoto || !afterPhoto || isUploading}
            className="submit-button"
          >
            {isUploading ? (
              <>
                <span className="spinner-small"></span>
                Procesando...
              </>
            ) : (
              'Crear Animación'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default UploadAnimation
