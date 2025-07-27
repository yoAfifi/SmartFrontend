import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import BackendHealthCheck from '@/components/BackendHealthCheck.vue'

describe('BackendHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn()
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render health check when showHealthCheck is true', () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
      
      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      expect(screen.getByText('Checking backend connectivity...')).toBeInTheDocument()
    })

    it('should not render when showHealthCheck is false', () => {
      render(BackendHealthCheck, {
        props: { showHealthCheck: false }
      })

      expect(screen.queryByText('Checking backend connectivity...')).not.toBeInTheDocument()
    })

    it('should show checking status initially', () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
      
      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      const statusElement = screen.getByText('Checking backend connectivity...')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement.closest('.health-status')).toHaveClass('checking')
    })
  })

  describe('Health Check Logic', () => {
    it('should show healthy status when API returns 200', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Backend services are running')).toBeInTheDocument()
      })

      const statusElement = screen.getByText('Backend services are running')
      expect(statusElement.closest('.health-status')).toHaveClass('healthy')
    })

    it('should show unhealthy status when API returns error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Backend error: 500 Internal Server Error')).toBeInTheDocument()
      })

      const statusElement = screen.getByText('Backend error: 500 Internal Server Error')
      expect(statusElement.closest('.health-status')).toHaveClass('unhealthy')
    })

    it('should show unhealthy status when fetch throws error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Backend services are offline')).toBeInTheDocument()
      })

      const statusElement = screen.getByText('Backend services are offline')
      expect(statusElement.closest('.health-status')).toHaveClass('unhealthy')
    })

    it('should call fetch with correct parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      })
    })
  })

  describe('Periodic Health Checks', () => {
    it('should set up interval for periodic health checks', () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000)
    })

    it('should perform periodic health checks', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK'
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      // Wait for initial check
      await waitFor(() => {
        expect(screen.getByText('Backend services are running')).toBeInTheDocument()
      })

      // Fast-forward time to trigger next check
      vi.advanceTimersByTime(30000)

      // Wait for the periodic check
      await waitFor(() => {
        expect(screen.getByText('Backend error: 500 Internal Server Error')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Status Classes and Icons', () => {
    it('should apply correct CSS classes for different statuses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      // Initially checking
      let statusElement = screen.getByText('Checking backend connectivity...')
      expect(statusElement.closest('.health-status')).toHaveClass('checking')

      // After successful check
      await waitFor(() => {
        statusElement = screen.getByText('Backend services are running')
        expect(statusElement.closest('.health-status')).toHaveClass('healthy')
      })
    })

    it('should show correct icons for different statuses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      // Initially checking
      expect(screen.getByText('Checking backend connectivity...').closest('.health-status')).toHaveClass('checking')

      // After successful check
      await waitFor(() => {
        const statusElement = screen.getByText('Backend services are running').closest('.health-status')
        expect(statusElement).toHaveClass('healthy')
      })
    })
  })

  describe('Error Handling', () => {
    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Network error')
      
      global.fetch.mockRejectedValueOnce(error)

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Health check failed:', error)
      })

      consoleSpy.mockRestore()
    })

    it('should handle different types of network errors', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      render(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Backend services are offline')).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    it('should work with renderWithProviders utility', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      })

      renderWithProviders(BackendHealthCheck, {
        props: { showHealthCheck: true }
      })

      await waitFor(() => {
        expect(screen.getByText('Backend services are running')).toBeInTheDocument()
      })
    })
  })
}) 