/**
 * Safe fetch utility that handles JSON parsing errors
 * Prevents "Unexpected token 'I', 'Internal S'..." errors
 */

export interface FetchResult<T = unknown> {
  data: T | null
  error: string | null
  status: number
}

export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url, options)

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      // Try to parse error as JSON, fallback to status text
      let errorMessage: string
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || response.statusText
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`
      }

      return {
        data: null,
        error: errorMessage,
        status: response.status
      }
    }

    // Response is ok, safe to parse JSON
    const data = await response.json()
    return {
      data,
      error: null,
      status: response.status
    }

  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0
    }
  }
}

/**
 * Example usage:
 * 
 * const { data, error } = await safeFetch('/api/users')
 * if (error) {
 *   console.error('API Error:', error)
 *   return
 * }
 * 
 * // Safe to use data here
 * setUsers(data.users)
 */
