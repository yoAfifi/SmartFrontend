// Simple debug script to test API exports
import { ErrorTypes, mapErrorToType, getErrorMessage } from './src/services/api.js'

console.log('ErrorTypes:', ErrorTypes)
console.log('mapErrorToType function:', typeof mapErrorToType)
console.log('getErrorMessage function:', typeof getErrorMessage)

// Test the functions
const testError = { response: { status: 401 } }
console.log('mapErrorToType result:', mapErrorToType(testError))
console.log('getErrorMessage result:', getErrorMessage(ErrorTypes.AUTHENTICATION)) 