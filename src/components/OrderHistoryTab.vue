<template>
  <div>
    <h3>Order History</h3>
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Date</th>
        <th>Status</th>
        <th>Total (€)</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="order in orders" :key="order.id" @click="showDetails(order)">
        <td>{{ order.id }}</td>
        <td>{{ formatDate(order.orderDate) }}</td>
        <td>{{ order.status }}</td>
        <td>{{ order.totalAmount }}</td>
      </tr>
      <tr v-if="!orders.length"><td colspan="4">No orders found.</td></tr>
      </tbody>
    </table>

    <OrderDetailsModal v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder=null"/>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getOrdersByCustomer } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import OrderDetailsModal from '@/components/OrderDetailsModal.vue';

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const orders = ref([]);
const selectedOrder = ref(null);
const authStore = useAuthStore();
const isLoading = ref(true);
const loadError = ref(null);

// Load orders when component mounts or profile changes
watch(() => props.profile.id, async (newId) => {
  if (newId) {
    await loadOrders();
  }
}, { immediate: true });

async function loadOrders() {
  if (!props.profile.id) {
    console.warn('Cannot load orders: No customer ID available');
    orders.value = [];
    isLoading.value = false;
    return;
  }
  
  try {
    isLoading.value = true;
    loadError.value = null;
    console.log('Loading orders for customer ID:', props.profile.id);
    
    const response = await getOrdersByCustomer(props.profile.id);
    orders.value = response.data || [];
    console.log('Orders loaded successfully:', orders.value.length);
  } catch (error) {
    console.error('Error loading orders:', error);
    loadError.value = 'Failed to load your order history. Please try again later.';
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
}

function showDetails(order) {
  selectedOrder.value = order;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get appropriate badge class based on order status
function getStatusBadgeClass(status) {
  const statusMap = {
    'PENDING': 'badge-warning',
    'CONFIRMED': 'badge-info',
    'SHIPPED': 'badge-primary',
    'DELIVERED': 'badge-success',
    'CANCELLED': 'badge-danger'
  };
  return statusMap[status] || 'badge-secondary';
}
</script>
