import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
app.use('*', logger(console.log))

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Types
interface UserProfile {
  id: string
  name: string
  username: string
  created_at: string
}

interface SurveyData {
  name: string
  username: string
  gender: string
  categories: string[]
  budget: string
  motivations: string[]
  brandPreference: string
  shoppingPattern: string
  stylePreferences: string[]
  dealSensitivity: string
  otherCategory: string
}

interface SearchRequest {
  query: string
  category_id: string
  category_name: string
  userId?: string
}

interface RankedProduct {
  id: string
  title: string
  price: number
  currency: string
  image: string
  url: string
  rank: number
  reasoning: string
}

// Performance optimization: Cache for Gemini responses
const geminiCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for Gemini cache

// Enhanced console logging helper (reduced verbosity for performance)
function logWithHeader(title: string, content: any, force = false) {
  if (!force && Deno.env.get('NODE_ENV') === 'production') return
  
  console.log('🔥', title, typeof content === 'string' ? content : JSON.stringify(content, null, 2))
}

// Optimized Gemini AI integration with caching and parallel processing
async function optimizeSearchWithGemini(query: string, categoryName: string, surveyData?: SurveyData) {
  const cacheKey = `search:${query}:${categoryName}:${surveyData?.gender || 'none'}:${surveyData?.budget || 'none'}`
  
  // Check cache first
  const cached = geminiCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logWithHeader('GEMINI CACHE HIT', 'Using cached optimization')
    return cached.result
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return createFallbackOptimization(query)
    }

    // Simplified context for faster processing
    const contextString = surveyData ? 
      `User: ${surveyData.gender}, budget: ${surveyData.budget}, likes: ${surveyData.categories.slice(0, 3).join(', ')}` :
      'General user'

    // Streamlined prompt for faster response
    const prompt = `Optimize this search for ${categoryName}: "${query}". ${contextString}. 
Return JSON: {"optimized_search": "enhanced search term", "reasoning": "brief reason"}`

    logWithHeader('GEMINI INPUT', { query, categoryName, context: contextString })

    // Use faster model and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 200, // Limit response size for speed
            temperature: 0.7
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        throw new Error('No response generated')
      }

      // Quick JSON extraction
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found')
      }

      const result = JSON.parse(jsonMatch[0])
      
      // Cache the result
      geminiCache.set(cacheKey, { result, timestamp: Date.now() })
      
      logWithHeader('GEMINI OUTPUT', result)
      return result

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }

  } catch (error) {
    logWithHeader('GEMINI ERROR', error.message)
    return createFallbackOptimization(query)
  }
}

// Optimized product ranking with batch processing
async function rankProductsWithGemini(query: string, products: any[], surveyData?: SurveyData) {
  // If too many products, rank only top 20 for speed
  const productsToRank = products.slice(0, 20)
  
  const cacheKey = `rank:${query}:${productsToRank.length}:${surveyData?.gender || 'none'}`
  
  // Check cache
  const cached = geminiCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logWithHeader('RANKING CACHE HIT', 'Using cached rankings')
    // Apply cached rankings to current products
    const cachedRankings = cached.result
    return products.map((product, index) => {
      const ranking = cachedRankings.find((r: any) => r.position === index + 1)
      return {
        ...product,
        rank: ranking?.rank || index + 1,
        reasoning: ranking?.reasoning || 'Cached ranking'
      }
    })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return products.map((product, index) => ({
        ...product,
        rank: index + 1,
        reasoning: 'Default ranking (AI unavailable)'
      }))
    }

    // Simplified user context for speed
    const userContext = surveyData ? 
      `${surveyData.gender}, ${surveyData.budget} budget, prefers ${surveyData.motivations[0]}` :
      'General preferences'

    // Condensed product data for faster processing
    const productsData = productsToRank.map((product, index) => ({
      pos: index + 1,
      title: product.title.substring(0, 80), // Truncate for speed
      price: product.price
    }))

    const prompt = `Rank these ${productsData.length} products for "${query}" (${userContext}):
${JSON.stringify(productsData)}
Return JSON array: [{"position":1,"rank":1,"reasoning":"brief"},...]`

    logWithHeader('RANKING INPUT', { query, productCount: productsToRank.length })

    // Fast ranking with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 500, // Limit for speed
            temperature: 0.3 // Lower temperature for more consistent ranking
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        throw new Error('No ranking response')
      }

      // Extract JSON array
      const arrayMatch = generatedText.match(/\[[\s\S]*\]/)
      if (!arrayMatch) {
        throw new Error('No ranking array found')
      }

      const rankings = JSON.parse(arrayMatch[0])
      
      // Cache rankings
      geminiCache.set(cacheKey, { result: rankings, timestamp: Date.now() })

      // Apply rankings to products
      const rankedProducts = products.map((product, index) => {
        const ranking = rankings.find((r: any) => r.position === index + 1)
        return {
          ...product,
          rank: ranking?.rank || index + 1,
          reasoning: ranking?.reasoning || 'AI ranked'
        }
      })

      // Sort by rank
      rankedProducts.sort((a, b) => a.rank - b.rank)
      
      logWithHeader('RANKING COMPLETE', `Ranked ${rankedProducts.length} products`)
      return rankedProducts

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }

  } catch (error) {
    logWithHeader('RANKING ERROR', error.message)
    return products.map((product, index) => ({
      ...product,
      rank: index + 1,
      reasoning: 'Default ranking (error)'
    }))
  }
}

// Fallback optimization
function createFallbackOptimization(query: string) {
  return {
    optimized_search: query,
    reasoning: 'Direct search (AI optimization unavailable)'
  }
}

// Optimized price extraction
function extractPrice(priceData: any): number {
  if (!priceData) return 0

  if (typeof priceData === 'number') return priceData
  
  if (typeof priceData === 'string') {
    const match = priceData.match(/[\d,]+\.?\d*/)
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0
  }
  
  if (typeof priceData === 'object') {
    const price = priceData.raw || priceData.value || priceData.amount || priceData.price || 0
    if (typeof price === 'string') {
      const match = price.match(/[\d,]+\.?\d*/)
      return match ? parseFloat(match[0].replace(/,/g, '')) : 0
    }
    return typeof price === 'number' ? price : 0
  }

  return 0
}

// Optimized Rainforest API integration with faster timeout
async function searchProducts(optimizedSearch: string, categoryId: string) {
  try {
    const apiKey = "D4508DE087414C619725251279762C22"
    
    const params = new URLSearchParams({
      api_key: apiKey,
      type: "search",
      amazon_domain: "amazon.co.uk",
      search_term: optimizedSearch,
      category_id: categoryId,
      language: "en_US",
      currency: "gbp",
      page: "1", // Only first page for speed
      num_reviews_threshold: "10" // Filter for products with reviews
    })

    logWithHeader('RAINFOREST REQUEST', optimizedSearch)

    // Faster timeout for API calls
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(`https://api.rainforestapi.com/request?${params}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      logWithHeader('RAINFOREST RESPONSE', `${data.search_results?.length || 0} products`)
      
      return data

    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }

  } catch (error) {
    logWithHeader('RAINFOREST ERROR', error.message)
    throw error
  }
}

// Optimized search endpoint with parallel processing
app.post('/make-server-25cda242/search', async (c) => {
  const startTime = Date.now()
  
  try {
    const body = await c.req.json() as SearchRequest
    const { query, category_id, category_name, userId } = body

    if (!query || !category_id || !category_name) {
      return c.json({ error: 'Query, category_id, and category_name are required' }, 400)
    }

    logWithHeader('SEARCH START', { query, category_id, category_name, userId }, true)

    // Get user survey data (parallel with other operations)
    const surveyPromise = userId ? 
      kv.get(`survey:${userId}`).catch(() => null) : 
      Promise.resolve(null)

    // Start optimization and survey loading in parallel
    const [surveyData, optimization] = await Promise.all([
      surveyPromise,
      optimizeSearchWithGemini(query, category_name, null) // Start without survey data for speed
    ])

    // If we got survey data, re-optimize if it would be significantly different
    let finalOptimization = optimization
    if (surveyData && surveyData.gender && surveyData.budget) {
      // Only re-optimize if the original was a fallback
      if (optimization.reasoning.includes('unavailable')) {
        finalOptimization = await optimizeSearchWithGemini(query, category_name, surveyData)
      }
    }

    // Search products with optimized query
    const results = await searchProducts(finalOptimization.optimized_search, category_id)

    // Process products quickly
    const products = (results.search_results || []).slice(0, 25).map((product: any, index: number) => ({
      id: product.asin || `product-${index}`,
      title: product.title || 'Untitled Product',
      price: extractPrice(product.price),
      currency: product.price?.currency || 'GBP',
      image: product.image || '',
      url: product.link || '#'
    })).filter((product: any) => product.price > 0) // Filter out products without valid prices

    // Rank products (this is the slowest operation, but cached)
    const rankedProducts = await rankProductsWithGemini(query, products, surveyData)

    const finalResult = {
      success: true,
      query: query,
      optimized_query: finalOptimization.optimized_search,
      category_id: category_id,
      category_name: category_name,
      products: rankedProducts,
      total_results: results.total_results || rankedProducts.length,
      optimization_reasoning: finalOptimization.reasoning
    }

    const totalTime = Date.now() - startTime
    logWithHeader('SEARCH COMPLETE', `${rankedProducts.length} products in ${totalTime}ms`, true)

    return c.json(finalResult)

  } catch (error) {
    const totalTime = Date.now() - startTime
    logWithHeader('SEARCH ERROR', `Failed in ${totalTime}ms: ${error.message}`, true)
    return c.json({ 
      error: 'Search failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Clean up cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of geminiCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      geminiCache.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes

// Test endpoint
app.get('/make-server-25cda242/test', async (c) => {
  return c.json({
    message: 'Test endpoint working',
    geminiConfigured: !!Deno.env.get('GEMINI_API_KEY'),
    rainforestConfigured: true,
    cacheSize: geminiCache.size,
    timestamp: new Date().toISOString()
  })
})

// Check if username is available
app.get('/make-server-25cda242/check-username/:username', async (c) => {
  try {
    const username = c.req.param('username')
    
    if (!username || username.trim().length === 0) {
      return c.json({ available: false, error: 'Username cannot be empty' }, 400)
    }
    
    const cleanUsername = username.toLowerCase().trim()
    const existingUserId = await kv.get(`username:${cleanUsername}`)
    const isAvailable = existingUserId === undefined || existingUserId === null
    
    return c.json({ 
      available: isAvailable,
      username: username
    })
  } catch (error) {
    return c.json({ available: false, error: 'Failed to check username availability' }, 500)
  }
})

// Create user profile
app.post('/make-server-25cda242/users', async (c) => {
  try {
    const body = await c.req.json()
    const { name, username } = body
    
    if (!name || !username || name.trim().length === 0 || username.trim().length === 0) {
      return c.json({ error: 'Name and username are required' }, 400)
    }
    
    const cleanUsername = username.toLowerCase().trim()
    const cleanName = name.trim()
    
    // Check if username is already taken
    const existingUserId = await kv.get(`username:${cleanUsername}`)
    if (existingUserId !== undefined && existingUserId !== null) {
      return c.json({ error: 'Username is already taken' }, 409)
    }
    
    // Generate user ID
    const userId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    
    const userProfile: UserProfile = {
      id: userId,
      name: cleanName,
      username: cleanUsername,
      created_at: createdAt
    }
    
    // Save user profile and username mapping
    await kv.set(`user:${userId}`, userProfile)
    await kv.set(`username:${cleanUsername}`, userId)
    
    return c.json({ user: userProfile }, 201)
    
  } catch (error) {
    return c.json({ error: 'Failed to create user profile' }, 500)
  }
})

// Get user profile by ID
app.get('/make-server-25cda242/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const user = await kv.get(`user:${userId}`)
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Update user profile
app.put('/make-server-25cda242/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { name, username } = body
    
    if (!name || !username || name.trim().length === 0 || username.trim().length === 0) {
      return c.json({ error: 'Name and username are required' }, 400)
    }
    
    const cleanUsername = username.toLowerCase().trim()
    const cleanName = name.trim()
    
    // Get current user
    const currentUser = await kv.get(`user:${userId}`) as UserProfile
    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Check if username changed and if new username is available
    if (cleanUsername !== currentUser.username) {
      const existingUserId = await kv.get(`username:${cleanUsername}`)
      if (existingUserId !== undefined && existingUserId !== null) {
        return c.json({ error: 'Username is already taken' }, 409)
      }
      
      // Remove old username mapping and add new one
      await kv.del(`username:${currentUser.username}`)
      await kv.set(`username:${cleanUsername}`, userId)
    }
    
    // Update user profile
    const updatedUser: UserProfile = {
      ...currentUser,
      name: cleanName,
      username: cleanUsername
    }
    
    await kv.set(`user:${userId}`, updatedUser)
    return c.json({ user: updatedUser })
    
  } catch (error) {
    return c.json({ error: 'Failed to update user profile' }, 500)
  }
})

// Save survey data
app.post('/make-server-25cda242/users/:userId/survey', async (c) => {
  try {
    const userId = c.req.param('userId')
    const surveyData = await c.req.json() as SurveyData
    
    // Verify user exists
    const user = await kv.get(`user:${userId}`)
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Save survey data
    const surveyRecord = {
      ...surveyData,
      user_id: userId,
      completed_at: new Date().toISOString()
    }
    
    await kv.set(`survey:${userId}`, surveyRecord)
    
    logWithHeader('SURVEY SAVED', { userId, gender: surveyData.gender })
    
    return c.json({ success: true, survey: surveyRecord })
    
  } catch (error) {
    return c.json({ error: 'Failed to save survey data' }, 500)
  }
})

// Get survey data for user
app.get('/make-server-25cda242/users/:userId/survey', async (c) => {
  try {
    const userId = c.req.param('userId')
    const survey = await kv.get(`survey:${userId}`)
    
    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }
    
    return c.json({ survey })
  } catch (error) {
    return c.json({ error: 'Failed to fetch survey data' }, 500)
  }
})

// Login by username
app.post('/make-server-25cda242/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username } = body
    
    if (!username || username.trim().length === 0) {
      return c.json({ error: 'Username is required' }, 400)
    }
    
    const cleanUsername = username.toLowerCase().trim()
    const userId = await kv.get(`username:${cleanUsername}`)
    
    if (!userId) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    const user = await kv.get(`user:${userId}`)
    const survey = await kv.get(`survey:${userId}`)
    
    return c.json({ 
      user,
      survey: survey || null
    })
    
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Health check
app.get('/make-server-25cda242/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Start server
Deno.serve(app.fetch)