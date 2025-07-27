<template>
  <div class="dashboard">
    <Sidebar />
    <BackendHealthCheck />

    <main class="main-content">
      <div class="dashboard-header">
        <h1>{{ $t('dashboard.dashboard.overview') }}</h1>
        <div class="user-welcome">
          <span>{{ $t('dashboard.dashboard.welcome') }},</span>
          <strong>{{ user.username }}</strong>
          <div class="user-avatar">
            <i class="bi bi-person-circle"></i>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      
      <!-- Show loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-grow text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading dashboard data...</p>
      </div>
      
      <!-- Show error state -->
      <div v-else-if="loadError" class="alert alert-danger my-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {{ loadError }}
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
      
      <!-- Show dashboard data -->
      <div v-else>
        <div class="overview-cards">
          <div class="overview-card">
            <div class="overview-card-icon products-icon">
              <i class="bi bi-box"></i>
            </div>
            <div class="overview-card-content">
              <h3>{{ $t('dashboard.stats.totalProducts') }}</h3>
              <p>{{ totalProducts }}</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-card-icon orders-icon">
              <i class="bi bi-cart"></i>
            </div>
            <div class="overview-card-content">
              <h3>{{ $t('dashboard.stats.totalOrders') }}</h3>
              <p>{{ totalOrders }}</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-card-icon customers-icon">
              <i class="bi bi-people"></i>
            </div>
            <div class="overview-card-content">
              <h3>{{ $t('dashboard.stats.totalCustomers') }}</h3>
              <p>{{ totalCustomers }}</p>
            </div>
          </div>
          
          <div class="overview-card notifications-card" :class="{ 'has-critical': criticalStockCount > 0, 'has-low-stock': lowStockCount > 0 }">
            <div class="overview-card-icon notifications-icon">
              <i class="bi bi-bell"></i>
              <span v-if="unreadCount > 0" class="notification-badge">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </div>
            <div class="overview-card-content">
              <h3>Notifications</h3>
              <p>{{ unreadCount }} unread</p>
              <div v-if="criticalStockCount > 0" class="critical-alert">
                <i class="bi bi-exclamation-triangle-fill"></i>
                {{ criticalStockCount }} critical stock alerts
              </div>
              <div v-else-if="lowStockCount > 0" class="low-stock-alert">
                <i class="bi bi-exclamation-circle"></i>
                {{ lowStockCount }} low stock alerts
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-actions mt-5">
          <h2>{{ $t('dashboard.dashboard.quickActions') }}</h2>
          <div class="action-buttons">
            <router-link to="/admin/products" class="action-button">
              <i class="bi bi-plus-circle"></i>
              <span>{{ $t('dashboard.admin.manageProducts') }}</span>
            </router-link>
            
            <router-link to="/admin/orders" class="action-button">
              <i class="bi bi-list-check"></i>
              <span>{{ $t('dashboard.admin.manageOrders') }}</span>
            </router-link>
            
            <router-link to="/admin/customers" class="action-button">
              <i class="bi bi-person-plus"></i>
              <span>{{ $t('dashboard.admin.manageCustomers') }}</span>
            </router-link>
            
            <router-link to="/admin/notifications" class="action-button notifications-action" :class="{ 'has-alerts': unreadCount > 0 }">
              <i class="bi bi-bell"></i>
              <span>View Notifications</span>
              <span v-if="unreadCount > 0" class="action-badge">{{ unreadCount }}</span>
            </router-link>
            
            <button @click="checkLowStock" class="action-button check-stock-action" :disabled="isCheckingStock">
              <i class="bi bi-search"></i>
              <span>{{ isCheckingStock ? 'Checking...' : 'Check Low Stock' }}</span>
            </button>
            
            <button @click="testNotificationEndpoint" class="action-button test-action">
              <i class="bi bi-bug"></i>
              <span>Test Endpoint</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import Sidebar from '@/components/Sidebar.vue';
import BackendHealthCheck from '@/components/BackendHealthCheck.vue';

// Services
import { getAllProducts } from '@/services/productservice';
import { getAllOrders } from '@/services/orderService';
import { getAllCustomers } from '@/services/customerService';
import { checkLowStockNotifications } from '@/services/notificationService';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

// Get stores, router, route
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Grab the user (or default to 'Admin' if not set)
const user = computed(() => authStore.user || { username: 'Admin' });

// Reactive state for total counts
const totalProducts = ref(0);
const totalOrders = ref(0);
const totalCustomers = ref(0);

// Notification computed properties
const unreadCount = computed(() => notificationStore.unreadCount);
const criticalStockCount = computed(() => notificationStore.criticalStockNotifications.length);
const lowStockCount = computed(() => notificationStore.lowStockNotifications.length);

// Add loading and error states
const isLoading = ref(true);
const loadError = ref(null);
const isCheckingStock = ref(false);

// Fetch data on mount
onMounted(async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    // Initialize notifications
    await notificationStore.initialize();
    
    try {
      // Fetch products data
      const productsResponse = await getAllProducts();
      totalProducts.value = productsResponse.data.length;
    } catch (error) {
      console.error('Error fetching products:', error);
      totalProducts.value = 0;
    }
    
    try {
      // Fetch orders data
      const ordersResponse = await getAllOrders();
      totalOrders.value = ordersResponse.data.length;
    } catch (error) {
      console.error('Error fetching orders:', error);
      totalOrders.value = 0;
    }
    
    try {
      // Fetch customers data
      const customersResponse = await getAllCustomers();
      totalCustomers.value = customersResponse.data.length;
    } catch (error) {
      console.error('Error fetching customers:', error);
      totalCustomers.value = 0;
    }
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    loadError.value = error.message || 'Failed to load dashboard data';
  } finally {
    isLoading.value = false;
  }
});

// Method to manually check for low stock notifications
const checkLowStock = async () => {
  try {
    isCheckingStock.value = true;
    
    // Call the backend endpoint to check for low stock
    await checkLowStockNotifications();
    
    // Refresh notifications after checking
    await notificationStore.loadNotifications();
    await notificationStore.loadUnreadCount();
    
    // Show success message
    alert('Low stock check completed successfully!');
  } catch (error) {
    console.error('Error checking low stock:', error);
    alert('Error checking low stock: ' + error.message);
  } finally {
    isCheckingStock.value = false;
  }
};

// Method to test notification endpoint
const testNotificationEndpoint = async () => {
  try {
    console.log('Testing notification endpoint...');
    
    // Test through Vite proxy
    const response = await fetch('/api/admin/notifications/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('Test endpoint response:', result);
      alert('Test endpoint working! Response: ' + result);
    } else {
      console.error('Test endpoint failed:', response.status, response.statusText);
      alert('Test endpoint failed: ' + response.status + ' ' + response.statusText);
    }
  } catch (error) {
    console.error('Error testing endpoint:', error);
    alert('Error testing endpoint: ' + error.message);
  }
};
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
}

.main-content {
  margin-left: 250px;
  padding: 2rem;
  background-color: var(--bg-muted);
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
  color: var(--text-dark);
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
  color: var(--text-muted);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
}

.user-avatar i {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.overview-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.overview-card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.overview-card-icon i {
  font-size: 1.8rem;
  color: white;
}

.products-icon {
  background-color: var(--primary-color);
}

.orders-icon {
  background-color: var(--info-color);
}

.customers-icon {
  background-color: var(--warning-color);
}

.notifications-icon {
  background-color: var(--danger-color);
  position: relative;
}

.notifications-card.has-critical {
  border: 2px solid var(--danger-color);
  animation: pulse 2s infinite;
}

.notifications-card.has-low-stock {
  border: 2px solid var(--warning-color);
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--danger-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.critical-alert,
.low-stock-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.critical-alert {
  color: var(--danger-color);
  background-color: rgba(220, 53, 69, 0.1);
}

.low-stock-alert {
  color: var(--warning-color);
  background-color: rgba(255, 193, 7, 0.1);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.overview-card-content h3 {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0;
}

.overview-card-content p {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-dark);
  margin: 0;
}

.dashboard-actions {
  margin-top: 2rem;
}

.dashboard-actions h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.dashboard-actions h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-dark);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.action-button:hover {
  background-color: var(--primary-light);
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.action-button i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
  transition: transform 0.3s ease;
}

.action-button:hover i {
  transform: scale(1.2);
}

.action-button span {
  font-weight: 500;
}

.notifications-action {
  position: relative;
}

.notifications-action.has-alerts {
  border: 2px solid var(--danger-color);
  background-color: rgba(220, 53, 69, 0.05);
}

.action-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--danger-color);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.check-stock-action {
  background-color: rgba(255, 193, 7, 0.1);
  border: 2px solid var(--warning-color, #ffc107);
  color: var(--warning-color, #ffc107);
}

.check-stock-action:hover:not(:disabled) {
  background-color: var(--warning-color, #ffc107);
  color: white;
}

.check-stock-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-action {
  background-color: rgba(108, 117, 125, 0.1);
  border: 2px solid var(--secondary-color, #6c757d);
  color: var(--secondary-color, #6c757d);
}

.test-action:hover {
  background-color: var(--secondary-color, #6c757d);
  color: white;
}

@media (max-width: 992px) {
  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
  
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
}
</style>
