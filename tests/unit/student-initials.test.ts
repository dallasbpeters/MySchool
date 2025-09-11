/**
 * Unit tests for student initials generation utility
 * Tests the initial generation algorithm with conflict resolution
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  InitialGenerator,
  generateStudentInitials,
  generateInitialsWithOverflow,
  clearInitialsCache,
  validateStudentInfo,
  validateStudentInfoBatch
} from '@/utils/student-initials'
import { StudentInfo } from '@/types/calendar-integration'

describe('Student Initials Generation', () => {
  beforeEach(() => {
    clearInitialsCache()
  })
  
  afterEach(() => {
    clearInitialsCache()
  })
  
  describe('InitialGenerator class', () => {
    let generator: InitialGenerator
    
    beforeEach(() => {
      generator = new InitialGenerator()
    })
    
    it('should generate basic initials correctly', () => {
      // This test MUST FAIL initially - implementation doesn't exist
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' }
      ]
      
      const result = generator.generateInitials(students)
      
      expect(result).toHaveLength(2)
      
      const john = result.find(s => s.studentId === '1')
      const jane = result.find(s => s.studentId === '2')
      
      expect(john?.initials).toBe('JD')
      expect(jane?.initials).toBe('JS')
      
      expect(john?.fullName).toBe('John Doe')
      expect(jane?.fullName).toBe('Jane Smith')
      
      expect(john?.displayName).toBe('John Doe')
      expect(jane?.displayName).toBe('Jane Smith')
    })
    
    it('should handle name conflicts with numeric suffix', () => {
      // This test MUST FAIL initially - conflict resolution not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Doe' }, // Same last name
        { id: '3', firstName: 'James', lastName: 'Davis' }
      ]
      
      const result = generator.generateInitials(students)
      
      expect(result).toHaveLength(3)
      
      // All initials should be unique
      const initials = result.map(s => s.initials)
      const uniqueInitials = new Set(initials)
      expect(uniqueInitials.size).toBe(3)
      
      // First come, first served for JD
      const john = result.find(s => s.studentId === '1')
      const jane = result.find(s => s.studentId === '2')
      const james = result.find(s => s.studentId === '3')
      
      expect(john?.initials).toBe('JD')
      expect(jane?.initials).toBe('JD2') // Conflict resolution
      expect(james?.initials).toBe('JD3') // Another conflict
    })
    
    it('should use middle names for conflict resolution', () => {
      // This test MUST FAIL initially - middle name logic not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'John', lastName: 'Doe', middleName: 'Michael' }
      ]
      
      const result = generator.generateInitials(students)
      
      const john1 = result.find(s => s.studentId === '1')
      const john2 = result.find(s => s.studentId === '2')
      
      expect(john1?.initials).toBe('JD')
      expect(john2?.initials).toBe('JMD') // Used middle name
    })
    
    it('should handle students with same first and last names', () => {
      // This test MUST FAIL initially - complex conflict resolution not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Smith' },
        { id: '2', firstName: 'John', lastName: 'Smith' },
        { id: '3', firstName: 'John', lastName: 'Smith', middleName: 'Michael' }
      ]
      
      const result = generator.generateInitials(students)
      
      // All should have unique initials
      const initials = result.map(s => s.initials)
      const uniqueInitials = new Set(initials)
      expect(uniqueInitials.size).toBe(3)
      
      const john1 = result.find(s => s.studentId === '1')
      const john2 = result.find(s => s.studentId === '2')
      const john3 = result.find(s => s.studentId === '3')
      
      expect(john1?.initials).toBe('JS')
      expect(john2?.initials).toBe('JS2')
      expect(john3?.initials).toBe('JMS') // Used middle name
    })
    
    it('should be consistent across multiple calls', () => {
      // This test MUST FAIL initially - caching not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Doe' }
      ]
      
      const result1 = generator.generateInitials(students)
      const result2 = generator.generateInitials(students)
      
      expect(result1).toEqual(result2)
      
      // Same students should get same initials
      const john1 = result1.find(s => s.studentId === '1')
      const john2 = result2.find(s => s.studentId === '1')
      
      expect(john1?.initials).toBe(john2?.initials)
    })
    
    it('should handle empty input', () => {
      // This test MUST FAIL initially - edge case handling not implemented
      const result = generator.generateInitials([])
      
      expect(result).toEqual([])
    })
    
    it('should handle single character names', () => {
      // This test MUST FAIL initially - edge case handling not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'A', lastName: 'B' },
        { id: '2', firstName: 'X', lastName: 'Y' }
      ]
      
      const result = generator.generateInitials(students)
      
      expect(result).toHaveLength(2)
      
      const student1 = result.find(s => s.studentId === '1')
      const student2 = result.find(s => s.studentId === '2')
      
      expect(student1?.initials).toBe('AB')
      expect(student2?.initials).toBe('XY')
    })
    
    it('should clear cache correctly', () => {
      // This test MUST FAIL initially - cache management not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' }
      ]
      
      generator.generateInitials(students)
      expect(generator.getCacheSize()).toBe(1)
      
      generator.clearCache()
      expect(generator.getCacheSize()).toBe(0)
    })
  })
  
  describe('generateInitialsWithOverflow', () => {
    it('should handle overflow correctly', () => {
      // This test MUST FAIL initially - overflow handling not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
        { id: '3', firstName: 'Bob', lastName: 'Johnson' },
        { id: '4', firstName: 'Alice', lastName: 'Brown' },
        { id: '5', firstName: 'Charlie', lastName: 'Wilson' }
      ]
      
      const result = generateInitialsWithOverflow(students, 3)
      
      expect(result.initials).toHaveLength(5) // All students
      expect(result.displayInitials).toHaveLength(3) // Limited display
      expect(result.hasOverflow).toBe(true)
      expect(result.overflowCount).toBe(2)
      
      // Display initials should be first 3
      expect(result.displayInitials[0].studentId).toBe('1')
      expect(result.displayInitials[1].studentId).toBe('2')
      expect(result.displayInitials[2].studentId).toBe('3')
    })
    
    it('should handle no overflow case', () => {
      // This test MUST FAIL initially - overflow handling not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' }
      ]
      
      const result = generateInitialsWithOverflow(students, 3)
      
      expect(result.hasOverflow).toBe(false)
      expect(result.overflowCount).toBe(0)
      expect(result.displayInitials).toHaveLength(2)
      expect(result.initials).toHaveLength(2)
    })
  })
  
  describe('validation functions', () => {
    it('should validate student info correctly', () => {
      // This test MUST FAIL initially - validation not implemented
      const validStudent: StudentInfo = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe'
      }
      
      const invalidStudent1: StudentInfo = {
        id: '',
        firstName: 'John',
        lastName: 'Doe'
      }
      
      const invalidStudent2: StudentInfo = {
        id: '1',
        firstName: '',
        lastName: 'Doe'
      }
      
      const invalidStudent3: StudentInfo = {
        id: '1',
        firstName: 'John',
        lastName: ''
      }
      
      expect(validateStudentInfo(validStudent)).toBe(true)
      expect(validateStudentInfo(invalidStudent1)).toBe(false)
      expect(validateStudentInfo(invalidStudent2)).toBe(false)
      expect(validateStudentInfo(invalidStudent3)).toBe(false)
    })
    
    it('should batch validate student info', () => {
      // This test MUST FAIL initially - batch validation not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'John', lastName: 'Doe' }, // Valid
        { id: '', firstName: 'Jane', lastName: 'Smith' }, // Invalid ID
        { id: '3', firstName: 'Bob', lastName: 'Johnson' }, // Valid
        { id: '4', firstName: '', lastName: 'Brown' } // Invalid firstName
      ]
      
      const result = validateStudentInfoBatch(students)
      
      expect(result.valid).toHaveLength(2)
      expect(result.invalid).toHaveLength(2)
      
      expect(result.valid[0].id).toBe('1')
      expect(result.valid[1].id).toBe('3')
      
      expect(result.invalid[0].id).toBe('')
      expect(result.invalid[1].firstName).toBe('')
    })
  })
  
  describe('performance tests', () => {
    it('should handle large number of students efficiently', () => {
      // This test MUST FAIL initially - performance optimization not implemented
      const manyStudents: StudentInfo[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `student${i}`,
        firstName: `First${i}`,
        lastName: `Last${i % 100}` // Some conflicts
      }))
      
      const startTime = Date.now()
      const result = generateStudentInitials(manyStudents)
      const endTime = Date.now()
      
      expect(result).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should be under 1 second
      
      // All initials should be unique
      const initials = result.map(s => s.initials)
      const uniqueInitials = new Set(initials)
      expect(uniqueInitials.size).toBe(1000)
    })
  })
  
  describe('edge cases', () => {
    it('should handle special characters in names', () => {
      // This test MUST FAIL initially - special character handling not implemented
      const students: StudentInfo[] = [
        { id: '1', firstName: 'José', lastName: 'García' },
        { id: '2', firstName: 'François', lastName: 'Müller' },
        { id: '3', firstName: "O'Connor", lastName: 'Smith' }
      ]
      
      const result = generateStudentInitials(students)
      
      expect(result).toHaveLength(3)
      
      // Should handle accented characters
      const jose = result.find(s => s.studentId === '1')
      expect(jose?.initials).toMatch(/^[A-Z]{2}[0-9]*$/) // Should be normalized
      
      // Should handle apostrophes
      const oconnor = result.find(s => s.studentId === '3')
      expect(oconnor?.initials).toMatch(/^[A-Z]{2}[0-9]*$/)
    })
    
    it('should handle very long names', () => {
      // This test MUST FAIL initially - long name handling not implemented
      const students: StudentInfo[] = [
        { 
          id: '1', 
          firstName: 'Verylongfirstnamethatexceedsnormallimits', 
          lastName: 'Verylonglastnamethatexceedsnormallimits'
        }
      ]
      
      const result = generateStudentInitials(students)
      
      expect(result).toHaveLength(1)
      expect(result[0].initials).toMatch(/^[A-Z]{2}[0-9]*$/)
      expect(result[0].initials.length).toBeLessThanOrEqual(5) // Reasonable limit
    })
  })
})