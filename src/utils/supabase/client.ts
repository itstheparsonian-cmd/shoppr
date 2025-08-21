import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

// Types
export interface UserProfile {
  id: string
  name: string
  username: string
  created_at: string
}

export interface SurveyData {
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

export interface Product {
  id: string
  title: string
  price: number
  currency: string
  image: string
  url: string
  rank: number
  reasoning: string
}

export interface SearchResult {
  success: boolean
  query: string
  optimized_query: string
  category_id: string
  category_name: string
  products: Product[]
  total_results: number
  optimization_reasoning: string
}

// API client class
export class ApiClient {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-25cda242`
  }
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`Making request to: ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    })
    
    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Request failed:`, { url, status: response.status, error: errorText })
      
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.error || 'Request failed')
      } catch {
        throw new Error(errorText || 'Request failed')
      }
    }
    
    const result = await response.json()
    console.log(`Response data:`, result)
    return result
  }
  
  // Search products with category ID and name
  async search(query: string, categoryId: string, categoryName: string, userId?: string): Promise<SearchResult> {
    console.log(`Searching: query="${query}", categoryId="${categoryId}", categoryName="${categoryName}", userId="${userId}"`)
    const body: any = { 
      query, 
      category_id: categoryId,
      category_name: categoryName
    }
    if (userId) {
      body.userId = userId
    }
    
    return this.request('/search', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
  
  // Check if username is available
  async checkUsername(username: string): Promise<{ available: boolean; username: string }> {
    console.log(`Checking username availability: "${username}"`)
    return this.request(`/check-username/${encodeURIComponent(username)}`)
  }
  
  // Create user profile
  async createUser(name: string, username: string): Promise<{ user: UserProfile }> {
    console.log(`Creating user: name="${name}", username="${username}"`)
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ name, username }),
    })
  }
  
  // Get user profile
  async getUser(userId: string): Promise<{ user: UserProfile }> {
    return this.request(`/users/${userId}`)
  }
  
  // Update user profile
  async updateUser(userId: string, name: string, username: string): Promise<{ user: UserProfile }> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, username }),
    })
  }
  
  // Save survey data
  async saveSurvey(userId: string, surveyData: SurveyData): Promise<{ success: boolean; survey: any }> {
    return this.request(`/users/${userId}/survey`, {
      method: 'POST',
      body: JSON.stringify(surveyData),
    })
  }
  
  // Get survey data
  async getSurvey(userId: string): Promise<{ survey: any }> {
    return this.request(`/users/${userId}/survey`)
  }
  
  // Login by username
  async login(username: string): Promise<{ user: UserProfile; survey: any | null }> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }
}

export const apiClient = new ApiClient()