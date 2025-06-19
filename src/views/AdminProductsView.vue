<template>
  <div class="dashboard">
    <!-- Persistent Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="header">
        <h1>Product Management</h1>
        <div class="header-actions">
          <input
              type="text"
              v-model="searchQuery"
              class="form-control search-field"
              placeholder="Search products..."
          />
          <button
              class="btn btn-primary create-btn"
              data-bs-toggle="modal"
              data-bs-target="#createProductModal"
          >
            Create Product
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading products...</p>
      </div>

      <!-- Products list -->
      <div v-else class="products-list">
        <table class="table table-striped">
          <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="product in filteredProducts" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>€ {{ product.price }}</td>
            <td>{{ product.stock_quantity }}</td>
            <td>
              <button
                  class="btn btn-warning btn-sm me-2"
                  @click="openEditModal(product)"
                  data-bs-toggle="modal"
                  data-bs-target="#editProductModal"
              >
                Edit
              </button>
              <button
                  class="btn btn-danger btn-sm"
                  @click="handleDeleteProduct(product.id)"
              >
                Delete
              </button>
            </td>
          </tr>
          </tbody>
        </table>
        <div v-if="filteredProducts.length === 0" class="empty-state">
          <i class="bi bi-box text-muted"></i>
          <h3>No Products Found</h3>
          <p>{{ searchQuery ? 'No products match your search criteria.' : 'There are no products in the system yet.' }}</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <EditProductModal
        v-if="selectedProduct"
        :product="selectedProduct"
        @updated="handleProductUpdated"
    />
    <CreateProductModal @created="handleProductCreated" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import EditProductModal from '@/components/EditProductModal.vue';
import CreateProductModal from '@/components/CreateProductModal.vue';
import { getAllProducts, deleteProduct } from '@/services/productService';

const products = ref([]);
const searchQuery = ref('');
const selectedProduct = ref(null);
const isLoading = ref(true);

const loadProducts = async () => {
  try {
    isLoading.value = true;
    const response = await getAllProducts();
    products.value = response.data;
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadProducts();
});

const filteredProducts = computed(() => {
  return products.value.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const openEditModal = (product) => {
  selectedProduct.value = { ...product };
};

const handleProductUpdated = () => {
  loadProducts();
  selectedProduct.value = null;
};

const handleDeleteProduct = async (id) => {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
};

const handleProductCreated = (newProduct) => {
  console.log('Product created:', newProduct);
  loadProducts();
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.search-field {
  min-width: 250px;
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
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-muted, #6c757d);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .search-field {
    width: 100%;
  }
  
  .create-btn {
    width: 100%;
  }
}
</style>
