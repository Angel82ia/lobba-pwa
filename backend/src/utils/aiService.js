let aiProvider = null

const PROVIDERS = {
  STABILITY_AI: 'stability_ai',
  OPENAI: 'openai',
  REPLICATE: 'replicate',
  OPENROUTER: 'openrouter',
  PERFECTCORP: 'perfectcorp',
  MOCK: 'mock'
}

export const initializeAIProvider = () => {
  if (aiProvider) return aiProvider

  const provider = process.env.NODE_ENV === 'test' ? PROVIDERS.MOCK : (process.env.AI_PROVIDER || PROVIDERS.MOCK)
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

  if (provider === PROVIDERS.OPENROUTER) {
    return await generateWithOpenRouter(prompt, startTime)
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

  if (provider === PROVIDERS.PERFECTCORP) {
    return await tryOnWithPerfectCorp(selfieBase64, styleId, startTime)
  }

  throw new Error(`Hairstyle try-on not supported for provider: ${provider}`)
}

export const generateChatbotResponse = async (userMessage, conversationHistory = []) => {
  const provider = initializeAIProvider()
  
  if (provider === PROVIDERS.MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      response: `Hola, soy Olivia, tu asistente virtual de LOBBA. Has dicho: "${userMessage}". ¿En qué puedo ayudarte hoy?`,
      provider: 'mock'
    }
  }

  if (provider === PROVIDERS.OPENROUTER) {
    return await generateChatWithOpenRouter(userMessage, conversationHistory)
  }

  throw new Error(`Chatbot not supported for provider: ${provider}`)
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

async function generateWithOpenRouter(prompt, startTime) {
  const apiKey = process.env.AI_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'LOBBA PWA'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that generates detailed descriptions for nail art designs. Respond with only the enhanced prompt description, no other text.'
        },
        {
          role: 'user',
          content: `Generate a detailed, creative description for this nail design concept: ${prompt}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const enhancedPrompt = data.choices[0]?.message?.content

  return {
    imageUrl: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(enhancedPrompt?.substring(0, 50) || prompt)}`,
    provider: 'openrouter',
    generationTimeMs: Date.now() - startTime,
    enhancedPrompt
  }
}

async function generateChatWithOpenRouter(userMessage, conversationHistory) {
  const apiKey = process.env.AI_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
  
  const messages = [
    {
      role: 'system',
      content: 'Eres Olivia, la asistente virtual de LOBBA, una plataforma de belleza y bienestar. Eres amable, profesional y útil. Ayudas a los usuarios con preguntas sobre servicios de salones, productos, reservas y uso de la plataforma. Responde siempre en español de forma clara y concisa.'
    }
  ]
  
  conversationHistory.slice(-10).forEach(msg => {
    messages.push({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })
  })
  
  messages.push({
    role: 'user',
    content: userMessage
  })
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'LOBBA PWA - Chatbot Olivia'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const botResponse = data.choices[0]?.message?.content

  return {
    response: botResponse || 'Lo siento, no pude generar una respuesta. Por favor intenta de nuevo.',
    provider: 'openrouter'
  }
}

async function tryOnWithPerfectCorp(_selfieBase64, _styleId, _startTime) {
  throw new Error('PerfectCorp integration pending: API credentials not yet provided. Please configure PERFECTCORP_CLIENT_ID and PERFECTCORP_CLIENT_SECRET in .env')
}

export const resetAIProvider = () => {
  aiProvider = null
}
