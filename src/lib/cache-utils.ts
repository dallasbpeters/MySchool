import { cache } from 'react'

// Cached data fetching functions using React's cache
export const fetchAssignmentsCached = cache(async (childId?: string) => {
  const url = childId ? `/api/assignments?childId=${childId}` : '/api/assignments'
  const response = await fetch(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
  })
  return response.json()
})

export const fetchChildrenCached = cache(async () => {
  const response = await fetch('/api/children', {
    next: { revalidate: 600 }, // Cache for 10 minutes
  })
  return response.json()
})

export const fetchCategoriesCached = cache(async () => {
  const response = await fetch('/api/assignments', {
    next: { revalidate: 600 }, // Cache for 10 minutes
  })
  return response.json()
})

export const fetchRecommendationsCached = cache(async () => {
  const response = await fetch('/api/recommendations', {
    next: { revalidate: 300 }, // Cache for 5 minutes
  })
  return response.json()
})

export const fetchRecommendationCategoriesCached = cache(async () => {
  const response = await fetch('/api/recommendations/categories', {
    next: { revalidate: 600 }, // Cache for 10 minutes
  })
  return response.json()
})

// Force refresh functions for when data needs to be updated immediately
export const refreshAssignments = async (childId?: string) => {
  const url = childId ? `/api/assignments?childId=${childId}` : '/api/assignments'
  const response = await fetch(url, {
    next: { revalidate: 0 }, // Force refresh
  })
  return response.json()
}

export const refreshRecommendations = async () => {
  const response = await fetch('/api/recommendations', {
    next: { revalidate: 0 }, // Force refresh
  })
  return response.json()
}
