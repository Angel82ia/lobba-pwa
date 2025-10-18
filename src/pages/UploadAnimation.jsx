import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const UploadAnimation = () => {
  const { user } = useAuth()
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

      <style jsx>{`
        .upload-animation-page {
          min-height: 100vh;
          padding: 2rem;
          background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%);
        }

        .upload-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .upload-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ff69b4;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .upload-subtitle {
          font-size: 1.1rem;
          color: #666;
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .success-message {
          background: #efe;
          border: 1px solid #cfc;
          color: #3c3;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .photo-upload-section {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          align-items: center;
        }

        .photo-upload-box h3 {
          text-align: center;
          color: #333;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .upload-label {
          display: block;
          width: 100%;
          aspect-ratio: 1;
          border: 3px dashed #ff69b4;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s;
        }

        .upload-label:hover {
          border-color: #ff1493;
          transform: scale(1.02);
        }

        .upload-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff5f9;
          color: #ff69b4;
          font-weight: 500;
          gap: 1rem;
        }

        .upload-icon {
          font-size: 3rem;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-input {
          display: none;
        }

        .arrow {
          font-size: 3rem;
          color: #ff69b4;
          text-align: center;
        }

        .upload-requirements {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #ff69b4;
        }

        .upload-requirements h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #333;
        }

        .upload-requirements ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .upload-requirements li {
          color: #666;
          margin-bottom: 0.5rem;
        }

        .submit-button {
          background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.2rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .upload-container {
            padding: 2rem 1.5rem;
          }

          .photo-upload-section {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .arrow {
            transform: rotate(90deg);
          }

          .upload-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}

export default UploadAnimation
