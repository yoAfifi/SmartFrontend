<template>
  <div class="dashboard">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="dashboard-header">
        <h1>Customer Management</h1>
        <div class="header-actions">
          <input
            type="text"
            v-model="searchQuery"
            class="form-control search-field"
            placeholder="Search customers..."
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading customers...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="alert alert-danger my-3">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <strong>Error:</strong> {{ loadError }}
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>

      <!-- Customers Table -->
      <div v-else class="customers-list card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th style="min-width: 180px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="customer in filteredCustomers" :key="customer.id">
                  <td><span class="customer-id">#{{ customer.id }}</span></td>
                  <td>{{ customer.name }}</td>
                  <td>{{ customer.email }}</td>
                  <td>{{ customer.phone || 'N/A' }}</td>
                  <td>{{ customer.address || 'N/A' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn btn-sm btn-outline-primary"
                        @click="openEditModal(customer)"
                        data-bs-toggle="modal"
                        data-bs-target="#editCustomerModal"
                      >
                        <i class="bi bi-pencil-square me-1"></i>
                        Edit
                      </button>
                      <button
                        class="btn btn-sm btn-outline-danger ms-2"
                        @click="handleDeleteCustomer(customer.id)"
                      >
                        <i class="bi bi-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Empty state -->
          <div v-if="filteredCustomers.length === 0" class="empty-state">
            <i class="bi bi-people text-muted"></i>
            <h3>No Customers Found</h3>
            <p>{{ searchQuery ? 'No customers match your search criteria.' : 'There are no customers in the system yet.' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Customer Modal -->
    <EditCustomerModal
      v-if="selectedCustomer"
      :customer="selectedCustomer"
      @updated="handleCustomerUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import EditCustomerModal from '@/components/EditCustomerModal.vue';
import { getAllCustomers, deleteCustomer } from '@/services/customerService';

const customers = ref([]);
const searchQuery = ref('');
const selectedCustomer = ref(null);
const isLoading = ref(true);
const loadError = ref(null);

const loadCustomers = async () => {
  try {
    isLoading.value = true;
    loadError.value = null;
    
    const response = await getAllCustomers();
    customers.value = response.data;
  } catch (error) {
    console.error('Error loading customers:', error);
    loadError.value = 'Failed to load customers. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadCustomers();
});

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value;
  
  const query = searchQuery.value.toLowerCase();
  return customers.value.filter(customer => 
    customer.name?.toLowerCase().includes(query) ||
    customer.email?.toLowerCase().includes(query) ||
    customer.phone?.toLowerCase().includes(query) ||
    customer.address?.toLowerCase().includes(query)
  );
});

const openEditModal = (customer) => {
  selectedCustomer.value = { ...customer };
};

const handleCustomerUpdated = async () => {
  await loadCustomers();
};

const handleDeleteCustomer = async (id) => {
  if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
    return;
  }
  
  try {
    await deleteCustomer(id);
    await loadCustomers();
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('Failed to delete customer. Please try again.');
  }
};
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
  overflow: hidden;
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-field {
  min-width: 300px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-muted, #6c757d);
}

.customer-id {
  font-weight: 500;
  color: var(--primary-color, #2ecc71);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 992px) {
  .search-field {
    min-width: 200px;
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
  
  .header-actions {
    width: 100%;
  }
  
  .search-field {
    width: 100%;
    min-width: unset;
  }
}
</style>
