<template>
  <div class="admin-dashboard">
    <!-- Your persistent sidebar -->
    <Sidebar />

    <div class="main-content">
      <div class="header">
        <h1>Order Management</h1>
        <p class="text-muted">Manage and track all customer orders</p>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading orders...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ loadError }}
      </div>

      <!-- Empty state -->
      <div v-else-if="orders.length === 0" class="empty-state">
        <i class="bi bi-inbox text-muted"></i>
        <h3>No Orders Found</h3>
        <p>There are no orders in the system yet.</p>
      </div>

      <!-- Orders table -->
      <div v-else class="orders-list card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer ID</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th style="min-width: 180px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id">
                  <td><span class="order-id">#{{ order.id }}</span></td>
                  <td>{{ order.customerId }}</td>
                  <td>{{ formatDate(order.orderDate) }}</td>
                  <td>
                    <span :class="getStatusBadgeClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <!-- Confirm button -->
                      <button 
                        class="btn btn-sm btn-outline-primary" 
                        @click="confirmOrder(order)"
                        :disabled="order.status === 'CONFIRMED'"
                      >
                        <i class="bi bi-check-circle me-1"></i>
                        Confirm
                      </button>

                      <!-- Delete button -->
                      <button class="btn btn-sm btn-outline-danger ms-2" @click="handleDeleteOrder(order.id)">
                        <i class="bi bi-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { getAllOrders, deleteOrder, updateOrder } from '@/services/orderService';
import { getAllCustomers } from '@/services/customerService';

// Reactive array of orders
const orders = ref([]);
const isLoading = ref(true);
const loadError = ref(null);

// Format date strings
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Get status badge class based on order status
const getStatusBadgeClass = (status) => {
  const statusMap = {
    'PENDING': 'badge bg-warning',
    'CONFIRMED': 'badge bg-success',
    'CANCELLED': 'badge bg-danger',
    'DELIVERED': 'badge bg-info'
  };
  
  return statusMap[status] || 'badge bg-secondary';
};

// Load orders from server
const loadOrders = async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    const response = await getAllOrders();
    orders.value = response.data;
  } catch (error) {
    console.error('Error loading orders:', error);
    loadError.value = 'Failed to load orders. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await loadOrders();
});

async function handleDeleteOrder(id) {
  if (!confirm('Are you sure you want to delete this order?')) {
    return;
  }
  
  try {
    await deleteOrder(id);
    await loadOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
    alert('Failed to delete order. Please try again.');
  }
}

// Confirm order -> sets status to 'CONFIRMED'
async function confirmOrder(order) {
  try {
    const updatedOrder = {
      id: order.id,
      status: 'CONFIRMED',
    };
    await updateOrder(order.id, updatedOrder);
    await loadOrders();
  } catch (error) {
    console.error('Error confirming order:', error);
    alert('Failed to confirm order. Please try again.');
  }
}
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  margin-left: 250px;
  padding: 2rem;
  background-color: var(--bg-muted);
  flex-grow: 1;
  overflow-y: auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.loading-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.card {
  border: none;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}

.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  color: var(--text-dark);
  border-top: none;
  background-color: rgba(0, 0, 0, 0.02);
}

.table td {
  vertical-align: middle;
}

.order-id {
  font-weight: 600;
  color: var(--primary-color);
}

.badge {
  padding: 0.5rem 0.75rem;
  font-weight: 500;
  border-radius: 30px;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.btn-outline-primary {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-outline-primary:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-outline-danger {
  color: var(--danger-color);
  border-color: var(--danger-color);
}

.btn-outline-danger:hover {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-buttons .btn {
    margin: 0.25rem 0;
    width: 100%;
  }
}
</style>
