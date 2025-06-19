<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">
        <i class="bi bi-speedometer2 me-2"></i>
        Admin Dashboard
      </h2>
    </div>
    
    <div class="sidebar-content">
      <ul class="sidebar-nav">
        <li class="sidebar-item">
          <router-link to="/admin-dashboard" class="sidebar-link" active-class="active-link">
            <i class="bi bi-house-door me-2"></i>
            Home
          </router-link>
        </li>
        <li class="sidebar-item">
          <router-link to="/admin-products" class="sidebar-link" active-class="active-link">
            <i class="bi bi-box me-2"></i>
            Products
          </router-link>
        </li>
        <li class="sidebar-item">
          <router-link to="/admin-orders" class="sidebar-link" active-class="active-link">
            <i class="bi bi-cart me-2"></i>
            Orders
          </router-link>
        </li>
        <li class="sidebar-item">
          <router-link to="/admin-customers" class="sidebar-link" active-class="active-link">
            <i class="bi bi-people me-2"></i>
            Customers
          </router-link>
        </li>
      </ul>
    </div>
    
    <div class="logout-section">
      <button class="btn btn-danger w-100" @click="logout">
        <i class="bi bi-box-arrow-right me-2"></i>
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: var(--neutral-dark);
  color: white;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-nav {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-item {
  margin-bottom: 0.25rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.active-link {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 3px solid var(--primary-color);
}

.logout-section {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .sidebar-content {
    max-height: 300px;
  }
}
</style>
