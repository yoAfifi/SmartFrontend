# Analytics Dashboard - Live Data Mapping

## Current Static Data Inventory

### 1. KPI Tiles (Total Orders, Total Revenue, New Customers, Low-stock Items)
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** Computed from `orders`, `products`, `customers` arrays
**Current Shape:**
```javascript
{
  totalOrders: number,
  totalRevenue: number,
  newCustomers: number,
  lowStockItems: number,
  orderChange: number, // Mock: 12.5
  revenueChange: number, // Mock: 8.3
  customerChange: number, // Mock: 15.7
  stockChange: number // Mock: -5.2
}
```

### 2. Sales Trend Chart
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** `generateMockData()` function
**Current Shape:**
```javascript
{
  xAxis: { data: string[] }, // Date labels
  series: [
    { name: 'Orders', data: number[] },
    { name: 'Revenue', data: number[] }
  ]
}
```

### 3. Top Products Chart
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** `getTopProducts()` function
**Current Shape:**
```javascript
{
  yAxis: { data: string[] }, // Product names
  series: [{ data: number[] }] // Sales numbers
}
```

### 4. Customer Demographics Chart
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** Hardcoded array
**Current Shape:**
```javascript
{
  series: [{
    data: [
      { value: 335, name: 'New Customers' },
      { value: 310, name: 'Returning Customers' },
      { value: 234, name: 'VIP Customers' },
      { value: 135, name: 'Inactive Customers' }
    ]
  }]
}
```

### 5. Inventory Levels Chart
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** Hardcoded array
**Current Shape:**
```javascript
{
  series: [{
    data: [
      { value: 60, name: 'In Stock' },
      { value: 25, name: 'Low Stock' },
      { value: 10, name: 'Out of Stock' },
      { value: 5, name: 'Discontinued' }
    ]
  }]
}
```

### 6. Recent Activities Table
**File:** `src/features/admin/components/AnalyticsDashboard.vue`
**Current Data Source:** Hardcoded array
**Current Shape:**
```javascript
[
  {
    id: number,
    type: 'order' | 'product' | 'customer' | 'stock',
    description: string,
    amount: number,
    date: Date,
    status: 'completed' | 'pending' | 'warning' | 'error'
  }
]
```

## Planned Live Data Endpoints & Shapes

### API Endpoints to Use (Existing)
1. **Orders:** `GET /api/orders` (via `getAllOrders()`)
2. **Products:** `GET /api/products` (via `getAllProducts()`)
3. **Customers:** `GET /api/customers` (via `getAllCustomers()`)

### Required Data Transformations

#### KPI Tiles
**Source:** Orders, Products, Customers APIs
**Transform:**
- Total Orders: `orders.length`
- Total Revenue: `orders.reduce((sum, order) => sum + order.totalAmount, 0)`
- New Customers: Filter customers by `createdAt` within date range
- Low Stock Items: Filter products where `stockQuantity < minStockLevel`

#### Sales Trend
**Source:** Orders API
**Transform:** Group orders by date, aggregate orders count and revenue
**Expected Shape:**
```javascript
[
  { date: '2024-01-01', orders: 15, revenue: 1250.50 },
  { date: '2024-01-02', orders: 23, revenue: 1890.75 }
]
```

#### Top Products
**Source:** Orders API (extract product data from order items)
**Transform:** Group by product, sum quantities and revenue
**Expected Shape:**
```javascript
[
  { productName: 'Product A', units: 150, revenue: 2250.00 },
  { productName: 'Product B', units: 120, revenue: 1800.00 }
]
```

#### Customer Demographics
**Source:** Customers API
**Transform:** Categorize customers based on order frequency and recency
**Expected Shape:**
```javascript
{
  new: 45,      // Registered in last 30 days
  returning: 120, // 2-10 orders
  vip: 25,      // 10+ orders or high value
  inactive: 30   // No orders in last 90 days
}
```

#### Inventory Levels
**Source:** Products API
**Transform:** Categorize products by stock levels
**Expected Shape:**
```javascript
{
  inStock: 85,      // stockQuantity >= minStockLevel
  lowStock: 12,     // stockQuantity < minStockLevel && > 0
  outOfStock: 8,    // stockQuantity === 0
  discontinued: 5   // status === 'discontinued'
}
```

#### Recent Activities
**Source:** Orders, Products, Customers APIs
**Transform:** Combine recent events from all sources
**Expected Shape:**
```javascript
[
  {
    id: 1,
    type: 'order',
    description: 'New order #1234 placed',
    amount: 299.99,
    timestamp: '2024-01-15T10:30:00Z',
    status: 'completed'
  }
]
```

## Implementation Plan

1. **Create Analytics Data Facade** (`src/lib/analytics/`)
2. **Build Data Transform Functions**
3. **Implement SWR Pattern** with stale-while-revalidate
4. **Add Loading/Error States**
5. **Wire Up Charts** to live data
6. **Add Cross-filtering** functionality
7. **Implement Performance Optimizations** 