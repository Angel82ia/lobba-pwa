import { useState, useCallback } from 'react'

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'))
      return
    }

    setLoading(true)
    setError(null)

    const geoOptions = {
      enableHighAccuracy: false, // Más rápido, usa WiFi/red celular
      timeout: 10000,
      maximumAge: 300000, // Acepta ubicación de hasta 5 minutos
      ...options,
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
        setError(null)
        setLoading(false)
      },
      error => {
        setError(error)
        setLoading(false)
      },
      geoOptions
    )
  }, [options])

  return { location, error, loading, requestLocation }
}

export default useGeolocation
