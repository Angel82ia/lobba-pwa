import { useState, useEffect } from 'react'

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by your browser'))
      setLoading(false)
      return
    }

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      })
      setError(null)
      setLoading(false)
    }

    const handleError = (error) => {
      setError(error)
      setLoading(false)
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options,
    }

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    )
  }, [])

  const refetch = () => {
    setLoading(true)
    setError(null)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
        setError(null)
        setLoading(false)
      },
      (error) => {
        setError(error)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        ...options,
      }
    )
  }

  return { location, error, loading, refetch }
}

export default useGeolocation
