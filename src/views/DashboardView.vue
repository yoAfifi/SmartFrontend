<template>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="sidebar-header">
        <i class="bi bi-speedometer2"></i>
        <h2 class="sidebar-title">Customer Dashboard</h2>
      </div>
      
      <div class="user-profile-mini">
        <div class="avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="user-info">
          <strong>{{ profile.name || 'Customer' }}</strong>
          <small>{{ profile.email || 'No email' }}</small>
        </div>
      </div>
      
      <ul class="nav-menu">
        <li @click="activeTab = 'profile'" :class="{active: activeTab === 'profile'}">
          <i class="bi bi-person-circle"></i>
          <span>Profile</span>
        </li>
        <li @click="activeTab = 'placeOrder'" :class="{active: activeTab === 'placeOrder'}">
          <i class="bi bi-bag-plus"></i>
          <span>Place Order</span>
        </li>
        <li @click="activeTab = 'cart'" :class="{active: activeTab === 'cart'}">
          <i class="bi bi-cart"></i>
          <span>Cart</span>
          <span v-if="cart.length" class="cart-badge">{{ cart.length }}</span>
        </li>
        <li @click="activeTab = 'orderHistory'" :class="{active: activeTab === 'orderHistory'}">
          <i class="bi bi-clock-history"></i>
          <span>Order History</span>
        </li>
      </ul>
      
      <div class="logout-section">
        <button class="btn-logout" @click="logout">
          <i class="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-header">
        <h1>{{ tabTitles[activeTab] }}</h1>
        <div class="actions-area">
          <div class="notification-bell">
            <i class="bi bi-bell"></i>
            <span v-if="pendingOrders > 0" class="notification-badge">{{ pendingOrders }}</span>
          </div>
        </div>
      </div>
      
      <div class="content-body">
        <div v-if="isLoading" class="loading-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading your data...</p>
        </div>
        
        <component
          v-else
          :is="currentTabComponent"
          :profile="profile"
          :cart="cart"
          @update-profile="updateProfile"
          @cart-changed="loadOrderHistory"
          @update-cart="updateCart"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getCustomerByUserId, updateCustomer } from '@/services/customerService';
import { getOrdersByCustomer } from '@/services/orderService';
import ProfileTab from '@/components/ProfileTab.vue';
import PlaceOrderTab from '@/components/PlaceOrderTab.vue';
import CartTab from '@/components/CartTab.vue';
import OrderHistoryTab from '@/components/OrderHistoryTab.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const activeTab = ref('profile');
const profile = ref({});
const cart = ref([]);
const orders = ref([]);
const isLoading = ref(true);
const loadError = ref(null);

// Check authentication status
if (!authStore.isAuthenticated) {
  router.push('/login');
}

const pendingOrders = computed(() => 
  orders.value.filter(order => order.status === 'PENDING').length
);

// Set active tab based on query parameter
onMounted(() => {
  if (route.query.tab && ['profile', 'placeOrder', 'cart', 'orderHistory'].includes(route.query.tab)) {
    activeTab.value = route.query.tab;
  }
  
  loadCustomerProfile();
});

// Update URL when tab changes
watch(activeTab, (newTab) => {
  router.push({ query: { tab: newTab } });
});

const tabTitles = {
  profile: 'My Profile',
  placeOrder: 'Shop Products',
  cart: 'Shopping Cart',
  orderHistory: 'Order History'
};

const currentTabComponent = computed(() => {
  switch (activeTab.value) {
    case 'profile':
      return ProfileTab;
    case 'placeOrder':
      return PlaceOrderTab;
    case 'cart':
      return CartTab;
    case 'orderHistory':
      return OrderHistoryTab;
    default:
      return ProfileTab;
  }
});

async function loadCustomerProfile() {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    if (!authStore.user || !authStore.user.id) {
      console.error('No user ID found in auth store');
      loadError.value = 'Authentication error. Please log in again.';
      router.push('/login');
      return;
    }
    
    const userId = authStore.user.id;
    console.log('Loading profile for user ID:', userId);
    
    const response = await getCustomerByUserId(userId);
    console.log('Customer profile loaded:', response.data);
    
    if (response.data) {
      profile.value = response.data;
      // After profile is loaded, load orders
      await loadOrderHistory();
    } else {
      console.error('No customer profile found for user ID:', userId);
      loadError.value = 'Customer profile not found.';
    }
  } catch (error) {
    console.error('Error loading customer profile:', error);
    loadError.value = 'Failed to load profile data. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

async function loadOrderHistory() {
  try {
    if (profile.value && profile.value.id) {
      console.log('Loading orders for customer ID:', profile.value.id);
      const response = await getOrdersByCustomer(profile.value.id);
      orders.value = response.data || [];
      console.log('Orders loaded:', orders.value);
    } else {
      console.warn('Cannot load orders: No customer ID available');
      orders.value = [];
    }
  } catch (error) {
    console.error('Error loading order history:', error);
    // Don't set loading error for orders, as it's secondary data
  }
}

async function updateProfile(updatedProfile) {
  try {
    await updateCustomer(updatedProfile.id, updatedProfile);
    profile.value = updatedProfile;
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  }
}

function updateCart(newCart) {
  cart.value = newCart;
}

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
}

.sidebar {
  width: 280px;
  background: linear-gradient(to bottom, #2c3e50, #34495e);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header i {
  font-size: 1.5rem;
}

.sidebar-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.user-profile-mini {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar i {
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info strong {
  font-size: 0.9rem;
}

.user-info small {
  font-size: 0.75rem;
  opacity: 0.7;
}

.nav-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}

.nav-menu li {
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.nav-menu li i {
  font-size: 1.2rem;
  width: 24px;
}

.nav-menu li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-menu li.active {
  background-color: rgba(255, 255, 255, 0.2);
  border-left: 4px solid #2ecc71;
}

.cart-badge {
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  position: absolute;
  right: 1.5rem;
}

.logout-section {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-logout {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(231, 76, 60, 0.2);
  color: white;
  border: 1px solid rgba(231, 76, 60, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background-color: rgba(231, 76, 60, 0.4);
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.content-header {
  background-color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.content-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.actions-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-bell {
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
}

.notification-bell i {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-body {
  padding: 2rem;
  flex-grow: 1;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

@media (max-width: 992px) {
  .sidebar {
    width: 70px;
  }
  
  .sidebar-title, .user-info, .nav-menu li span, .btn-logout span {
    display: none;
  }
  
  .nav-menu li {
    padding: 1rem;
    justify-content: center;
  }
  
  .nav-menu li i {
    margin: 0;
  }
  
  .cart-badge {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .main-content {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .content-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .content-body {
    padding: 1rem;
  }
}
</style>
