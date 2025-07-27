<template>
  <div class="dashboard">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">
          <i class="bi bi-speedometer2 me-2"></i>
          {{ $t('common.navigation.dashboard') }}
        </h2>
      </div>
      
      <div class="user-profile-mini">
        <div class="avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="user-info">
          <strong>{{ profile?.name || $t('common.common.customer') }}</strong>
          <small>{{ profile?.email || $t('common.common.noEmailProvided') }}</small>
        </div>
      </div>
      
      <ul class="nav-menu">
        <li @click="activeTab = 'profile'" :class="{active: activeTab === 'profile'}">
          <i class="bi bi-person-circle"></i>
          <span>{{ $t('common.common.profile') }}</span>
        </li>
        <li @click="activeTab = 'placeOrder'" :class="{active: activeTab === 'placeOrder'}">
          <i class="bi bi-bag-plus"></i>
          <span>{{ $t('common.common.placeOrder') }}</span>
        </li>
        <li @click="openCart" :class="{active: activeTab === 'cart'}">
          <i class="bi bi-cart"></i>
          <span>{{ $t('common.common.cart') }}</span>
          <span v-if="cartTotalItems > 0" class="cart-badge">{{ cartTotalItems }}</span>
        </li>
        <li @click="activeTab = 'orderHistory'" :class="{active: activeTab === 'orderHistory'}">
          <i class="bi bi-clock-history"></i>
          <span>{{ $t('common.common.orderHistory') }}</span>
        </li>
      </ul>
      
      <div class="language-section">
        <LanguageSwitcher context="sidebar" />
      </div>
      
      <div class="logout-section">
        <button class="btn-logout" @click="logout">
          <i class="bi bi-box-arrow-right"></i>
          <span>{{ $t('common.navigation.logout') }}</span>
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="content-header">
        <h1>{{ getTabTitle() }}</h1>
        <div class="actions-area">
          <LanguageSwitcher />
          
          <NotificationBell
            v-if="isAdmin"
            @notification-click="handleNotificationClick"
          />
          
          <button
            class="cart-button"
            @click="openCart"
            :class="{ 'has-items': cartTotalItems > 0 }"
          >
            <i class="bi bi-cart3"></i>
            <span v-if="cartTotalItems > 0" class="cart-count">{{ cartTotalItems }}</span>
          </button>
        </div>
      </div>
      
      <div class="content-body">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Loading your data...</p>
        </div>
        
        <!-- Profile Tab -->
        <div v-else-if="activeTab === 'profile'">
          <ProfileTab 
            :profile="profile" 
            :cart="cartStore.items || []"
            @update-profile="updateProfile"
            @cart-changed="loadOrderHistory"
            @update-cart="updateCart"
          />
        </div>
        
        <!-- Place Order Tab -->
        <div v-else-if="activeTab === 'placeOrder'">
          <PlaceOrderTab 
            :profile="profile" 
            :cart="cartStore.items || []"
            @update-profile="updateProfile"
            @cart-changed="loadOrderHistory"
            @update-cart="updateCart"
          />
        </div>
        
        <!-- Order History Tab -->
        <div v-else-if="activeTab === 'orderHistory'">
          <OrderHistoryTab 
            :profile="profile" 
            :cart="cartStore.items || []"
            @update-profile="updateProfile"
            @cart-changed="loadOrderHistory"
            @update-cart="updateCart"
          />
        </div>
        
        <!-- Default State -->
        <div v-else class="no-tab">
          <p>Select a tab to get started</p>
        </div>
      </div>
    </main>

    <!-- Cart Drawer -->
    <CartDrawer
      :is-open="isCartOpen"
      @close="closeCart"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { getCustomerByUserId, updateCustomer } from '@/services/customerService';
import { getOrdersByCustomer } from '@/services/orderService';
import ProfileTab from '@/components/ProfileTab.vue';
import PlaceOrderTab from '@/components/PlaceOrderTab.vue';
import OrderHistoryTab from '@/components/OrderHistoryTab.vue';
import CartDrawer from '@/features/cart/components/CartDrawer.vue';
import NotificationBell from '@/features/notifications/components/NotificationBell.vue';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();

const activeTab = ref('profile');
const profile = ref({});
const orders = ref([]);
const isLoading = ref(true);
const loadError = ref(null);
const isCartOpen = ref(false);

// Computed
const isAdmin = computed(() => {
  return authStore.user?.roles?.includes('ROLE_ADMIN');
});

const cartTotalItems = computed(() => cartStore.totalItems);

// Methods
const getTabTitle = () => {
  const titles = {
    profile: t('common.common.profile') || 'Profile',
    placeOrder: t('common.common.placeOrder') || 'Place Order',
    cart: t('common.common.cart') || 'Cart',
    orderHistory: t('common.common.orderHistory') || 'Order History'
  };
  return titles[activeTab.value] || 'Dashboard';
};

const loadProfile = async () => {
  try {
    if (!authStore.user || !authStore.user.id) {
      console.error('No user found');
      return;
    }
    isLoading.value = true;
    const response = await getCustomerByUserId(authStore.user.id);
    profile.value = response.data || {};
  } catch (error) {
    console.error('Error loading profile:', error);
    loadError.value = 'Failed to load profile';
    profile.value = {};
  } finally {
    isLoading.value = false;
  }
};

const handleTabFromUrl = () => {
  const tabParam = route.query.tab;
  if (tabParam && ['profile', 'placeOrder', 'orderHistory'].includes(tabParam)) {
    activeTab.value = tabParam;
  }
};

const updateProfile = async (updatedProfile) => {
  try {
    if (profile.value && profile.value.id) {
      const response = await updateCustomer(profile.value.id, updatedProfile);
      profile.value = response.data;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};

const loadOrderHistory = async () => {
  try {
    if (profile.value && profile.value.id) {
      const response = await getOrdersByCustomer(profile.value.id);
      orders.value = response.data;
    }
  } catch (error) {
    console.error('Error loading order history:', error);
  }
};

const updateCart = (newCart) => {
  // This method is kept for backward compatibility
  // The cart is now managed by the Pinia store
};

const openCart = () => {
  isCartOpen.value = true;
  activeTab.value = 'cart';
};

const closeCart = () => {
  isCartOpen.value = false;
};

const handleNotificationClick = (notification) => {
  console.log('Notification clicked:', notification);
};

const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Lifecycle
onMounted(async () => {
  // Check if user is admin and redirect to admin dashboard
  if (authStore.user?.roles?.includes('ROLE_ADMIN')) {
    router.push('/admin')
    return
  }
  
  // Ensure user is available before loading profile
  if (authStore.user && authStore.user.id) {
    await Promise.all([
      loadProfile(),
      cartStore.loadCart()
    ]);
  } else {
    console.warn('User not available, skipping profile load');
    await cartStore.loadCart();
  }
  handleTabFromUrl();
});

// Watch for profile changes to load order history
watch(() => profile.value?.id, (newId) => {
  if (newId) {
    loadOrderHistory();
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: var(--color-white);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: var(--z-sticky);
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sidebar-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.user-profile-mini {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  font-size: var(--font-size-lg);
}

.user-info {
  flex: 1;
}

.user-info strong {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.user-info small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.nav-menu {
  flex: 1;
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-menu li {
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color 0.2s ease;
  position: relative;
}

.nav-menu li:hover {
  background-color: var(--color-background-soft);
}

.nav-menu li.active {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.nav-menu li i {
  font-size: var(--font-size-lg);
}

.cart-badge {
  background: var(--color-accent);
  color: var(--color-white);
  border-radius: var(--radius-full);
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  margin-left: auto;
}

.language-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.logout-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.btn-logout {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color 0.2s ease;
}

.btn-logout:hover {
  background: var(--color-background-soft);
}

.main-content {
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;
}

.content-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-white);
}

.content-header h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.actions-area {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.cart-button {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius);
  color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all 0.2s ease;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.cart-button:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  color: var(--color-white);
}

.cart-button.has-items {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.cart-button.has-items:hover {
  background: var(--color-accent-dark);
  border-color: var(--color-accent-dark);
}

.cart-button i {
  color: var(--color-white);
  font-size: var(--font-size-lg);
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--color-accent);
  color: var(--color-white);
  border-radius: var(--radius-full);
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.content-body {
  flex: 1;
  padding: var(--spacing-lg);
  background: var(--color-background);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.loading-container p {
  margin-top: var(--spacing-md);
  color: var(--color-text-secondary);
}

.no-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.no-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
