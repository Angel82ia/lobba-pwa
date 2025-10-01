const STORAGE_PREFIX = 'lobba_'

export const setItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value)
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue)
    return true
  } catch {
    return false
  }
}

export const getItem = (key) => {
  try {
    const serializedValue = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (serializedValue === null) return null
    return JSON.parse(serializedValue)
  } catch {
    return null
  }
}

export const removeItem = (key) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
    return true
  } catch {
    return false
  }
}

export const clear = () => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch {
    return false
  }
}

export const setSessionItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value)
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue)
    return true
  } catch {
    return false
  }
}

export const getSessionItem = (key) => {
  try {
    const serializedValue = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (serializedValue === null) return null
    return JSON.parse(serializedValue)
  } catch {
    return null
  }
}

export const removeSessionItem = (key) => {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`)
    return true
  } catch {
    return false
  }
}
