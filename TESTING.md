# Testing Setup and Guide

This document provides a comprehensive guide to the testing setup for the SmartStock Vue frontend application.

## Overview

The testing setup uses the following technologies:

- **Vitest** - Fast unit test runner
- **@vue/test-utils** - Vue component testing utilities
- **@testing-library/vue** - Testing library for Vue components
- **MSW (Mock Service Worker)** - API mocking for unit tests
- **jsdom** - DOM environment for tests
- **Pinia** - State management testing utilities

## Quick Start

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test File Structure

```
src/
├── test/
│   ├── setup.js                 # Global test setup
│   ├── mocks/
│   │   ├── server.js           # MSW server setup
│   │   ├── handlers.js         # API mock handlers
│   │   └── bootstrap.js        # Bootstrap component mocks
│   ├── utils/
│   │   └── test-utils.js       # Test utilities and helpers
│   ├── components/             # Component tests
│   ├── stores/                 # Store tests
│   ├── services/               # Service tests
│   └── composables/            # Composable tests
```

## Writing Tests

### Component Tests

Use `@testing-library/vue` for component testing:

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import { renderWithProviders } from '@/test/utils/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(MyComponent)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    render(MyComponent)
    const button = screen.getByRole('button')
    await fireEvent.click(button)
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })

  it('works with providers', () => {
    renderWithProviders(MyComponent, {
      props: { title: 'Test' },
      global: {
        stubs: { RouterLink: true }
      }
    })
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Store Tests

Test Pinia stores with proper mocking:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '@/stores/myStore'

// Mock dependencies
vi.mock('@/services/api', () => ({
  fetchData: vi.fn()
}))

describe('MyStore', () => {
  let store

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useMyStore()
  })

  it('initializes with default state', () => {
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('loads data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    vi.mocked(fetchData).mockResolvedValue(mockData)

    await store.loadItems()

    expect(store.items).toEqual(mockData)
    expect(store.loading).toBe(false)
  })
})
```

### Service Tests

Test API services with MSW:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { rest } from 'msw'
import { server } from '@/test/mocks/server'
import { fetchProducts } from '@/services/productService'

describe('ProductService', () => {
  it('fetches products successfully', async () => {
    const mockProducts = [{ id: 1, name: 'Product 1' }]
    
    server.use(
      rest.get('/api/products', (req, res, ctx) => {
        return res(ctx.json(mockProducts))
      })
    )

    const result = await fetchProducts()
    expect(result).toEqual(mockProducts)
  })

  it('handles API errors', async () => {
    server.use(
      rest.get('/api/products', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    await expect(fetchProducts()).rejects.toThrow()
  })
})
```

### Composable Tests

Test Vue composables:

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { useMyComposable } from '@/composables/useMyComposable'

describe('useMyComposable', () => {
  let app
  let composable

  beforeEach(() => {
    app = createApp({})
    const TestComponent = {
      setup() {
        return useMyComposable()
      },
      template: '<div></div>'
    }
    const instance = app.mount(TestComponent)
    composable = instance
  })

  it('returns expected values', () => {
    expect(composable.count.value).toBe(0)
    expect(typeof composable.increment).toBe('function')
  })

  it('increments count', () => {
    composable.increment()
    expect(composable.count.value).toBe(1)
  })
})
```

## Test Utilities

### renderWithProviders

A utility function that provides common providers (Pinia, Router, i18n):

```javascript
import { renderWithProviders } from '@/test/utils/test-utils'

renderWithProviders(MyComponent, {
  props: { title: 'Test' },
  global: {
    stubs: { RouterLink: true }
  }
})
```

### createTestStore

Create a test Pinia store with initial state:

```javascript
import { createTestStore } from '@/test/utils/test-utils'

const { store, pinia } = createTestStore(useMyStore, {
  items: [{ id: 1, name: 'Test' }],
  loading: false
})
```

### Mock Utilities

Various mock utilities are available:

```javascript
import { 
  mockLocalStorage, 
  mockSessionStorage,
  mockWindowLocation,
  mockIntersectionObserver 
} from '@/test/utils/test-utils'

// Use in tests
mockLocalStorage()
mockWindowLocation('http://localhost:3000')
```

## API Mocking with MSW

MSW is configured to mock API calls in tests. Handlers are defined in `src/test/mocks/handlers.js`:

```javascript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' }
    ])
  }),

  http.post('/api/products', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 3, ...body })
  })
]
```

## Bootstrap Component Mocking

Bootstrap components are mocked to prevent crashes in tests:

```javascript
// Bootstrap Modal mock
const modal = new bootstrap.Modal(element)
modal.show() // Won't crash in tests
```

## Testing Best Practices

### 1. Test Structure

- Use descriptive test names
- Group related tests with `describe` blocks
- Test one thing per test case
- Use `beforeEach` for setup
- Clean up in `afterEach` if needed

### 2. Component Testing

- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock external dependencies

### 3. Store Testing

- Test state changes
- Test actions and mutations
- Mock API calls
- Test computed properties

### 4. Service Testing

- Mock HTTP requests with MSW
- Test success and error cases
- Test request/response formats
- Test error handling

### 5. Async Testing

```javascript
it('handles async operations', async () => {
  render(MyComponent)
  
  await fireEvent.click(screen.getByRole('button'))
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### 6. Mocking

- Mock external dependencies
- Use `vi.fn()` for function mocks
- Use `vi.mock()` for module mocks
- Reset mocks between tests

## Coverage

Run coverage to see test coverage:

```bash
npm run test:coverage
```

Coverage reports are generated in:
- Console output
- HTML report in `coverage/` directory
- JSON report for CI/CD

## Continuous Integration

The testing setup is configured for CI/CD:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run

- name: Run tests with coverage
  run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Bootstrap Modal errors**: Ensure Bootstrap mocks are imported
2. **Router errors**: Use `renderWithProviders` or mock router
3. **i18n errors**: Use `renderWithProviders` or mock i18n
4. **API errors**: Check MSW handlers are correct
5. **Timing issues**: Use `waitFor` for async operations

### Debug Tips

- Use `console.log` in tests (mocked by default)
- Use `screen.debug()` to see rendered output
- Use `--reporter=verbose` for detailed output
- Use `--ui` for interactive test runner

## Examples

See the following example test files:

- `src/test/components/BackendHealthCheck.test.js` - Component testing
- `src/test/stores/auth.test.js` - Store testing
- `src/test/services/api.test.js` - Service testing
- `src/test/composables/useI18nFormatters.test.js` - Composable testing

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html) 