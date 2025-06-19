<template>
  <div class="dashboard">
    <Sidebar />

    <main class="main-content">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div class="user-welcome">
          <span>Welcome,</span>
          <strong>{{ user.username }}</strong>
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading dashboard data...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="alert alert-danger my-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {{ loadError }}
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>

      <!-- Dashboard content -->
      <div v-else>
        <!-- Quick Overview Cards -->
        <section class="overview-cards">
          <div class="overview-card products-card">
            <div class="overview-card-icon">
              <i class="bi bi-box"></i>
            </div>
            <div class="overview-card-content">
              <h3>Total Products</h3>
              <p>{{ totalProducts }}</p>
            </div>
          </div>
          
          <div class="overview-card customers-card">
            <div class="overview-card-icon">
              <i class="bi bi-people"></i>
            </div>
            <div class="overview-card-content">
              <h3>Total Customers</h3>
              <p>{{ totalCustomers }}</p>
            </div>
          </div>
          
          <div class="overview-card pending-card">
            <div class="overview-card-icon">
              <i class="bi bi-hourglass-split"></i>
            </div>
            <div class="overview-card-content">
              <h3>Pending Orders</h3>
              <p>{{ pendingOrders }}</p>
            </div>
          </div>
          
          <div class="overview-card revenue-card">
            <div class="overview-card-icon">
              <i class="bi bi-currency-euro"></i>
            </div>
            <div class="overview-card-content">
              <h3>Total Revenue</h3>
              <p>€{{ totalRevenue }}</p>
            </div>
          </div>
        </section>

        <!-- Recent Activities -->
        <section class="recent-activities">
          <div class="section-header">
            <h2><i class="bi bi-clock-history me-2"></i>Recent Orders</h2>
            <router-link to="/admin-orders" class="btn btn-sm btn-outline-primary">
              View All <i class="bi bi-arrow-right ms-1"></i>
            </router-link>
          </div>
          
          <div class="card">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in recentOrders" :key="order.id">
                      <td><span class="order-id">#{{ order.id }}</span></td>
                      <td>{{ order.customerName }}</td>
                      <td>{{ formatDate(order.orderDate) }}</td>
                      <td>
                        <span :class="getStatusBadgeClass(order.status)">
                          {{ order.status }}
                        </span>
                      </td>
                      <td><strong>€{{ order.totalAmount }}</strong></td>
                    </tr>
                    <tr v-if="recentOrders.length === 0">
                      <td colspan="5" class="text-center py-4">
                        <i class="bi bi-inbox text-muted d-block mb-2" style="font-size: 2rem;"></i>
                        <p class="mb-0">No recent orders found</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <div class="section-header">
            <h2><i class="bi bi-lightning-charge me-2"></i>Quick Actions</h2>
          </div>
          
          <div class="action-buttons">
            <router-link to="/admin-products" class="action-button">
              <i class="bi bi-box-seam"></i>
              <span>Manage Products</span>
            </router-link>
            
            <router-link to="/admin-orders" class="action-button">
              <i class="bi bi-list-check"></i>
              <span>Manage Orders</span>
            </router-link>
            
            <router-link to="/admin-customers" class="action-button">
              <i class="bi bi-people"></i>
              <span>Manage Customers</span>
            </router-link>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { useAuthStore } from '@/stores/auth';
import { getAllProducts } from '@/services/productService';
import { getAllCustomers } from '@/services/customerService';
import { getAllOrders } from '@/services/orderService';

const authStore = useAuthStore();
const user = computed(() => authStore.user || { username: 'Admin' });

const products = ref([]);
const customers = ref([]);
const orders = ref([]);
const isLoading = ref(true);
const loadError = ref(null);

// Computed values
const totalProducts = computed(() => products.value.length);
const totalCustomers = computed(() => customers.value.length);
const totalOrders = computed(() => orders.value.length);
const pendingOrders = computed(() => 
  orders.value.filter(order => order.status === 'PENDING').length
);
const totalRevenue = computed(() => {
  return orders.value
    .filter(order => ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status))
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    .toFixed(2);
});

const recentOrders = computed(() => {
  return orders.value
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .slice(0, 5);
});

onMounted(async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    try {
      products.value = (await getAllProducts()).data;
    } catch (error) {
      console.error('Error fetching products:', error);
      products.value = [];
    }
    
    try {
      customers.value = (await getAllCustomers()).data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      customers.value = [];
    }
    
    try {
      orders.value = (await getAllOrders()).data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      orders.value = [];
    }
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    loadError.value = error.message || 'Failed to load dashboard data';
  } finally {
    isLoading.value = false;
  }
});

// Helper functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusBadgeClass(status) {
  const statusMap = {
    'PENDING': 'badge-pending',
    'CONFIRMED': 'badge-confirmed',
    'SHIPPED': 'badge-shipped',
    'DELIVERED': 'badge-delivered',
    'CANCELLED': 'badge-cancelled'
  };
  return statusMap[status] || 'badge-secondary';
}
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
}

.main-content {
  margin-left: 250px;
  padding: 2rem;
  background-color: var(--bg-muted, #f8f9fa);
  flex-grow: 1;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
  margin: 0;
}

.user-welcome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.user-welcome span {
  color: var(--text-muted, #6c757d);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-light, #a9dfbf);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
}

.user-avatar i {
  color: var(--primary-color, #2ecc71);
  font-size: 1.2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-dark, #2c3e50);
}

/* Overview Cards */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.overview-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid var(--primary-color, #2ecc71);
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.products-card {
  border-left-color: var(--primary-color, #2ecc71);
}

.customers-card {
  border-left-color: var(--secondary-color, #3498db);
}

.pending-card {
  border-left-color: var(--warning-color, #f39c12);
}

.revenue-card {
  border-left-color: var(--success-color, #2ecc71);
}

.overview-card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
}

.products-card .overview-card-icon {
  background-color: rgba(46, 204, 113, 0.1);
  color: var(--primary-color, #2ecc71);
}

.customers-card .overview-card-icon {
  background-color: rgba(52, 152, 219, 0.1);
  color: var(--secondary-color, #3498db);
}

.pending-card .overview-card-icon {
  background-color: rgba(243, 156, 18, 0.1);
  color: var(--warning-color, #f39c12);
}

.revenue-card .overview-card-icon {
  background-color: rgba(46, 204, 113, 0.1);
  color: var(--success-color, #2ecc71);
}

.overview-card-content {
  flex: 1;
}

.overview-card-content h3 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted, #6c757d);
  margin: 0 0 0.5rem 0;
}

.overview-card-content p {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-dark, #2c3e50);
}

/* Recent Activities */
.recent-activities {
  margin-bottom: 2.5rem;
}

.order-id {
  font-weight: 600;
  color: var(--primary-color, #2ecc71);
}

/* Quick Actions */
.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-dark, #2c3e50);
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.action-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.action-button i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-color, #2ecc71);
  transition: transform 0.3s ease;
}

.action-button:hover i {
  transform: scale(1.2);
}

.action-button span {
  font-weight: 500;
}

@media (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .action-buttons {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .user-welcome {
    width: 100%;
    justify-content: space-between;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
