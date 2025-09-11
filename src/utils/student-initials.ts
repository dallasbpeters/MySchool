/**
 * Student Initials Generation Utility
 * Generates unique student initials with conflict resolution
 */

import { StudentInfo, StudentInitial, InitialGenerationResult } from '@/types/calendar-integration'

/**
 * Initial generation class with conflict resolution
 */
export class InitialGenerator {
  private usedInitials = new Set<string>()
  private cache = new Map<string, string>() // studentId -> initials
  
  /**
   * Generate unique initials for a list of students
   */
  generateInitials(students: StudentInfo[]): StudentInitial[] {
    // Reset for fresh generation
    this.usedInitials.clear()
    
    const results: StudentInitial[] = []
    
    for (const student of students) {
      // Check cache first for consistency
      const cachedInitials = this.cache.get(student.id)
      
      let initials: string
      if (cachedInitials && !this.usedInitials.has(cachedInitials)) {
        initials = cachedInitials
      } else {
        initials = this.generateUniqueInitials(student)
        this.cache.set(student.id, initials)
      }
      
      this.usedInitials.add(initials)
      results.push({
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        initials,
        displayName: `${student.firstName} ${student.lastName}`
      })
    }
    
    return results
  }
  
  /**
   * Generate initials with overflow handling for display
   */
  generateWithOverflow(students: StudentInfo[], maxDisplay: number = 3): InitialGenerationResult {
    const allInitials = this.generateInitials(students)
    const hasOverflow = allInitials.length > maxDisplay
    
    return {
      initials: allInitials,
      hasOverflow,
      overflowCount: Math.max(0, allInitials.length - maxDisplay),
      displayInitials: allInitials.slice(0, maxDisplay)
    }
  }
  
  /**
   * Generate unique initials for a single student with conflict resolution
   */
  private generateUniqueInitials(student: StudentInfo): string {
    let initials = this.tryBasicInitials(student)
    let attempt = 1
    
    // Try different conflict resolution strategies
    while (this.usedInitials.has(initials) && attempt <= 10) {
      initials = this.generateWithConflictResolution(student, attempt)
      attempt++
    }
    
    // Fallback to numeric suffix if all else fails
    if (this.usedInitials.has(initials)) {
      let counter = 2
      const baseInitials = this.tryBasicInitials(student)
      while (this.usedInitials.has(`${baseInitials}${counter}`)) {
        counter++
      }
      initials = `${baseInitials}${counter}`
    }
    
    return initials
  }
  
  /**
   * Generate basic first + last initial (e.g., "John Doe" → "JD", "Blaise" → "B")
   */
  private tryBasicInitials(student: StudentInfo): string {
    const first = student.firstName.charAt(0).toUpperCase()
    const last = student.lastName.charAt(0).toUpperCase()
    
    // If lastName is empty or same as firstName, just use single letter
    if (!student.lastName || student.lastName === student.firstName || student.lastName === '') {
      return first
    }
    
    return `${first}${last}`
  }
  
  /**
   * Apply conflict resolution strategies
   */
  private generateWithConflictResolution(student: StudentInfo, attempt: number): string {
    const first = student.firstName.charAt(0).toUpperCase()
    const last = student.lastName.charAt(0).toUpperCase()
    
    switch (attempt) {
      case 1:
        // Try middle name if available
        if (student.middleName && student.middleName.length > 0) {
          const middle = student.middleName.charAt(0).toUpperCase()
          return `${first}${middle}${last}`
        }
        // Fall through to next strategy
        
      case 2:
        // Try first two letters of first name + last initial
        if (student.firstName.length >= 2) {
          const firstTwo = student.firstName.substring(0, 2).toUpperCase()
          return `${firstTwo}${last}`
        }
        // Fall through to next strategy
        
      case 3:
        // Try first initial + first two letters of last name
        if (student.lastName.length >= 2) {
          const lastTwo = student.lastName.substring(0, 2).toUpperCase()
          return `${first}${lastTwo}`
        }
        // Fall through to next strategy
        
      default:
        // Numeric suffix
        const base = this.tryBasicInitials(student)
        return `${base}${attempt - 2}`
    }
  }
  
  /**
   * Clear the cache (useful for testing or fresh starts)
   */
  clearCache(): void {
    this.cache.clear()
    this.usedInitials.clear()
  }
  
  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

// Singleton instance for consistent behavior across the app
const initialGenerator = new InitialGenerator()

/**
 * Generate student initials with conflict resolution
 */
export function generateStudentInitials(students: StudentInfo[]): StudentInitial[] {
  return initialGenerator.generateInitials(students)
}

/**
 * Generate student initials with overflow handling for UI display
 */
export function generateInitialsWithOverflow(
  students: StudentInfo[], 
  maxDisplay: number = 3
): InitialGenerationResult {
  return initialGenerator.generateWithOverflow(students, maxDisplay)
}

/**
 * Clear initials cache (useful for testing)
 */
export function clearInitialsCache(): void {
  initialGenerator.clearCache()
}

/**
 * Validate student information for initial generation
 */
export function validateStudentInfo(student: StudentInfo): boolean {
  return !!(
    student.id &&
    student.firstName &&
    student.firstName.length > 0 &&
    student.lastName &&
    student.lastName.length > 0
  )
}

/**
 * Batch validate student information
 */
export function validateStudentInfoBatch(students: StudentInfo[]): {
  valid: StudentInfo[]
  invalid: StudentInfo[]
} {
  const valid: StudentInfo[] = []
  const invalid: StudentInfo[] = []
  
  for (const student of students) {
    if (validateStudentInfo(student)) {
      valid.push(student)
    } else {
      invalid.push(student)
    }
  }
  
  return { valid, invalid }
}