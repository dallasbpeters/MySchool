// Custom fetch-based Supabase client to bypass SDK issues
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class FetchSupabaseClient {
  private baseUrl: string
  private baseHeaders: Record<string, string>

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/rest/v1`
    this.baseHeaders = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }

  private getHeaders(accessToken?: string): Record<string, string> {
    return {
      ...this.baseHeaders,
      'Authorization': `Bearer ${accessToken || SUPABASE_KEY}`
    }
  }

  async query(table: string, select: string = '*', limit?: number, filters?: Record<string, unknown>, accessToken?: string) {
    const url = new URL(`${this.baseUrl}/${table}`)
    url.searchParams.set('select', select)
    if (limit) {
      url.searchParams.set('limit', limit.toString())
    }

    // Add filters (e.g., { code: 'eq.ABC123', used: 'eq.false' })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }


    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(accessToken)
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data }
    }

    return { data, error: null }
  }

  async insert(table: string, values: unknown, accessToken?: string) {
    const url = `${this.baseUrl}/${table}`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(values)
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data }
    }

    return { data, error: null }
  }

  async update(table: string, values: unknown, filters: Record<string, unknown>, accessToken?: string) {
    const url = new URL(`${this.baseUrl}/${table}`)

    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })


    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(values)
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data }
    }

    return { data, error: null }
  }

  async delete(table: string, filters: Record<string, unknown>, accessToken?: string) {
    const url = new URL(`${this.baseUrl}/${table}`)

    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })


    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.getHeaders(accessToken)
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data }
    }

    return { data, error: null }
  }
}

export const fetchClient = new FetchSupabaseClient()
