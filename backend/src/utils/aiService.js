let aiProvider = null

const PROVIDERS = {
  STABILITY_AI: 'stability_ai',
  OPENAI: 'openai',
  REPLICATE: 'replicate',
  MOCK: 'mock'
}

export const initializeAIProvider = () => {
  if (aiProvider) return aiProvider

  const provider = process.env.AI_PROVIDER || PROVIDERS.MOCK
  const apiKey = process.env.AI_API_KEY

  if (!apiKey && provider !== PROVIDERS.MOCK) {
    console.warn(`AI API key not configured for provider: ${provider}. Using mock mode.`)
    aiProvider = PROVIDERS.MOCK
    return aiProvider
  }

  aiProvider = provider
  return aiProvider
}

export const generateNailDesign = async (prompt) => {
  const provider = initializeAIProvider()
  const startTime = Date.now()

  if (provider === PROVIDERS.MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      imageUrl: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt.substring(0, 30))}`,
      provider: 'mock',
      generationTimeMs: Date.now() - startTime
    }
  }

  if (provider === PROVIDERS.STABILITY_AI) {
    return await generateWithStabilityAI(prompt, startTime)
  }

  if (provider === PROVIDERS.OPENAI) {
    return await generateWithOpenAI(prompt, startTime)
  }

  if (provider === PROVIDERS.REPLICATE) {
    return await generateWithReplicate(prompt, startTime)
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}

export const generateHairstyleTryOn = async (selfieBase64, styleId) => {
  const provider = initializeAIProvider()
  const startTime = Date.now()

  if (provider === PROVIDERS.MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    return {
      imageUrl: `https://via.placeholder.com/512x512.png?text=Hairstyle+${styleId}`,
      provider: 'mock',
      generationTimeMs: Date.now() - startTime
    }
  }

  if (provider === PROVIDERS.REPLICATE) {
    return await tryOnWithReplicate(selfieBase64, styleId, startTime)
  }

  throw new Error(`Hairstyle try-on not supported for provider: ${provider}`)
}

async function generateWithStabilityAI(prompt, startTime) {
  const apiKey = process.env.AI_API_KEY
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 512,
      width: 512,
      samples: 1,
      steps: 30
    })
  })

  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`)
  }

  const data = await response.json()
  const base64Image = data.artifacts[0].base64

  return {
    imageUrl: `data:image/png;base64,${base64Image}`,
    provider: 'stability_ai',
    generationTimeMs: Date.now() - startTime
  }
}

async function generateWithOpenAI(prompt, startTime) {
  const apiKey = process.env.AI_API_KEY
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024'
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.statusText}`)
  }

  const data = await response.json()

  return {
    imageUrl: data.data[0].url,
    provider: 'openai',
    generationTimeMs: Date.now() - startTime
  }
}

async function generateWithReplicate(prompt, startTime) {
  const apiKey = process.env.AI_API_KEY
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl',
      input: { prompt }
    })
  })

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`)
  }

  const prediction = await response.json()
  
  let result = prediction
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Token ${apiKey}` }
    })
    result = await checkResponse.json()
  }

  if (result.status === 'failed') {
    throw new Error('Replicate generation failed')
  }

  return {
    imageUrl: result.output[0],
    provider: 'replicate',
    generationTimeMs: Date.now() - startTime
  }
}

async function tryOnWithReplicate(selfieBase64, styleId, startTime) {
  const apiKey = process.env.AI_API_KEY
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${apiKey}`
    },
    body: JSON.stringify({
      version: 'hair-transfer-model',
      input: {
        image: selfieBase64,
        style: styleId
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`)
  }

  const prediction = await response.json()
  
  let result = prediction
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { 'Authorization': `Token ${apiKey}` }
    })
    result = await checkResponse.json()
  }

  if (result.status === 'failed') {
    throw new Error('Replicate hairstyle generation failed')
  }

  return {
    imageUrl: result.output[0],
    provider: 'replicate',
    generationTimeMs: Date.now() - startTime
  }
}

export const resetAIProvider = () => {
  aiProvider = null
}
