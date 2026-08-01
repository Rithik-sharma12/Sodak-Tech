import { apiClient } from './client'
import { mockAPI } from './mock'

/**
 * API module selection:
 * - If NEXT_PUBLIC_USE_MOCKS=true: Uses mock data (development)
 * - If NEXT_PUBLIC_USE_MOCKS=false or undefined: Uses real Django API (production)
 */
const api = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' ? mockAPI : apiClient

export const API = api

export type * from './types'
