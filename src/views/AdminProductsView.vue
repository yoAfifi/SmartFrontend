<template>
  <div class="dashboard">
    <!-- Persistent Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="header">
        <h1>Product Management</h1>
        <div class="header-actions">
          <AppButton
            variant="primary"
            icon="bi-plus-lg"
            @click="openCreateModal"
          >
            Create Product
          </AppButton>
        </div>
      </div>

      <!-- Low Stock Alert Banner -->
      <div v-if="lowStockProducts.length > 0" class="low-stock-alert">
        <div class="alert alert-warning d-flex align-items-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div class="flex-grow-1">
            <strong>Low Stock Alert!</strong> 
            {{ lowStockProducts.length }} product{{ lowStockProducts.length > 1 ? 's' : '' }} 
            {{ lowStockProducts.length > 1 ? 'have' : 'has' }} less than 5 items in stock.
          </div>
          <button 
            class="btn btn-sm btn-outline-warning ms-3"
            @click="showLowStockModal = true"
          >
            View Details
          </button>
        </div>
      </div>

      <!-- Zero Stock Alert Banner -->
      <div v-if="zeroStockProducts.length > 0" class="zero-stock-alert">
        <div class="alert alert-danger d-flex align-items-center" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div class="flex-grow-1">
            <strong>Zero Stock Alert!</strong> 
            {{ zeroStockProducts.length }} product{{ zeroStockProducts.length > 1 ? 's' : '' }} 
            {{ zeroStockProducts.length > 1 ? 'have' : 'has' }} no stock and are hidden from customers.
          </div>
          <button 
            class="btn btn-sm btn-outline-danger ms-3"
            @click="showZeroStockModal = true"
          >
            Manage Zero Stock
          </button>
        </div>
      </div>

      <!-- Products List -->
      <ProductList
        :show-add-to-cart="false"
        @product-click="openEditModal"
      />
    </div>

    <!-- Create Product Modal -->
    <div
      v-if="showCreateModal"
      class="custom-modal"
      @click.self="closeCreateModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Product</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeCreateModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <ProductForm
              @submit="handleCreateProduct"
              @cancel="closeCreateModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Product Modal -->
    <div
      v-if="showEditModal && selectedProduct"
      class="custom-modal"
      @click.self="closeEditModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Product</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeEditModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <ProductForm
              :product="selectedProduct"
              :is-edit="true"
              @submit="handleUpdateProduct"
              @cancel="closeEditModal"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Zero Stock Modal -->
    <div
      v-if="showZeroStockModal"
      class="custom-modal"
      @click.self="closeZeroStockModal"
    >
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              Zero Stock Products Management
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeZeroStockModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="zero-stock-intro mb-4">
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> These products have 0 stock and are automatically hidden from customers. 
                You can either restock them or delete them permanently.
              </div>
            </div>
            
            <div class="zero-stock-table">
              <table class="table table-hover">
                <thead class="table-dark">
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in zeroStockProducts" :key="product.id">
                    <td>
                      <div class="product-info-cell">
                        <img 
                          :src="getProductImage(product)" 
                          :alt="product.name"
                          class="product-thumbnail"
                        />
                        <div>
                          <strong>{{ product.name }}</strong>
                          <br>
                          <small class="text-muted">{{ product.description }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-secondary">
                        {{ getCategoryName(product.categoryId) }}
                      </span>
                    </td>
                    <td>
                      <strong>€{{ formatPrice(product.price) }}</strong>
                    </td>
                    <td>
                      <small>{{ formatDate(product.modifiedDate) }}</small>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button
                          class="btn btn-sm btn-success me-2"
                          @click="restockProduct(product)"
                          title="Restock Product"
                        >
                          <i class="bi bi-plus-circle"></i>
                          Restock
                        </button>
                        <button
                          class="btn btn-sm btn-danger"
                          @click="deleteZeroStockProduct(product)"
                          title="Delete Product"
                        >
                          <i class="bi bi-trash"></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeZeroStockModal"
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Modal -->
    <div
      v-if="showLowStockModal"
      class="custom-modal"
      @click.self="closeLowStockModal"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
              Low Stock Products
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeLowStockModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="low-stock-products">
              <div
                v-for="product in lowStockProducts"
                :key="product.id"
                class="low-stock-item"
              >
                <div class="product-info">
                  <div class="product-details">
                    <h6 class="product-name">{{ product.name }}</h6>
                    <p class="product-category">
                      Category: {{ getCategoryName(product.categoryId) }}
                    </p>
                    <p class="product-price">€{{ formatPrice(product.price) }}</p>
                  </div>
                  <div class="stock-info">
                    <div class="stock-badge" :class="getStockBadgeClass(product.stockQuantity)">
                      {{ product.stockQuantity }} in stock
                    </div>
                    <div class="stock-actions">
                      <button
                        class="btn btn-sm btn-primary"
                        @click="editLowStockProduct(product)"
                      >
                        <i class="bi bi-pencil"></i>
                        Edit Stock
                      </button>
                      <button
                        class="btn btn-sm btn-danger"
                        @click="deleteLowStockProduct(product)"
                      >
                        <i class="bi bi-trash"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeLowStockModal"
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="custom-modal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeDeleteModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete "<strong>{{ selectedProduct?.name }}</strong>"?</p>
            <p class="text-danger">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <AppButton
              variant="outline-secondary"
              @click="closeDeleteModal"
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              :loading="isDeleting"
              @click="confirmDelete"
            >
              Delete Product
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ProductList from '@/features/products/components/ProductList.vue'
import ProductForm from '@/features/products/components/ProductForm.vue'
import AppButton from '@/ui/atoms/AppButton.vue'
import { useProductStore } from '@/stores/products'
import { showSuccessToast, showWarningToast } from '@/services/api'

const productStore = useProductStore()

// Computed properties
const lowStockProducts = computed(() => {
  return productStore.products.filter(product => product.stockQuantity < 5 && product.stockQuantity > 0)
})

const zeroStockProducts = computed(() => {
  return productStore.products.filter(product => product.stockQuantity === 0)
})

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showLowStockModal = ref(false)
const showZeroStockModal = ref(false)
const selectedProduct = ref(null)
const isDeleting = ref(false)

// Methods
const openCreateModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const openEditModal = (product) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const closeEditModal = () => {
  selectedProduct.value = null
  showEditModal.value = false
}

const openDeleteModal = (product) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  selectedProduct.value = null
  showDeleteModal.value = false
}

const handleCreateProduct = async ({ productData, imageFile }) => {
  try {
    await productStore.createNewProduct(productData, imageFile)
    closeCreateModal()
    showSuccessToast('Product created successfully!')
  } catch (error) {
    console.error('Error creating product:', error)
    showWarningToast('Failed to create product')
  }
}

const handleUpdateProduct = async ({ productData, imageFile }) => {
  try {
    await productStore.updateExistingProduct(selectedProduct.value.id, productData, imageFile)
    closeEditModal()
    showSuccessToast('Product updated successfully!')
  } catch (error) {
    console.error('Error updating product:', error)
    showWarningToast('Failed to update product')
  }
}

const confirmDelete = async () => {
  if (!selectedProduct.value) return

  try {
    isDeleting.value = true
    await productStore.deleteExistingProduct(selectedProduct.value.id)
    closeDeleteModal()
    showSuccessToast('Product deleted successfully!')
  } catch (error) {
    console.error('Error deleting product:', error)
    showWarningToast('Failed to delete product')
  } finally {
    isDeleting.value = false
  }
}

// Low stock methods
const closeLowStockModal = () => {
  showLowStockModal.value = false
}

const editLowStockProduct = (product) => {
  selectedProduct.value = product
  showLowStockModal.value = false
  showEditModal.value = true
}

const deleteLowStockProduct = (product) => {
  selectedProduct.value = product
  showLowStockModal.value = false
  showDeleteModal.value = true
}

const getCategoryName = (categoryId) => {
  const category = productStore.categories.find(cat => cat.id === categoryId)
  return category ? category.name : 'Unknown Category'
}

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const getStockBadgeClass = (stockQuantity) => {
  if (stockQuantity === 0) return 'out-of-stock'
  if (stockQuantity <= 2) return 'critical-stock'
  if (stockQuantity <= 5) return 'low-stock'
  return 'normal-stock'
}

const closeZeroStockModal = () => {
  showZeroStockModal.value = false
}

const restockProduct = (product) => {
  selectedProduct.value = product
  showZeroStockModal.value = false
  showEditModal.value = true
}

const deleteZeroStockProduct = (product) => {
  selectedProduct.value = product
  showZeroStockModal.value = false
  showDeleteModal.value = true
}

const getProductImage = (product) => {
  return product.imageUrl || product.image_url || '/placeholder-product.jpg'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  await productStore.initialize()
  
  // Show low stock notification if there are low stock products
  if (lowStockProducts.value.length > 0) {
    showWarningToast(`⚠️ Low Stock Alert: ${lowStockProducts.value.length} product${lowStockProducts.value.length > 1 ? 's' : ''} have less than 5 items in stock!`)
  }
  
  // Show zero stock notification if there are zero stock products
  if (zeroStockProducts.value.length > 0) {
    showWarningToast(`🚨 Zero Stock Alert: ${zeroStockProducts.value.length} product${zeroStockProducts.value.length > 1 ? 's' : ''} have no stock and are hidden from customers!`)
  }
})

// Watch for modal state changes to manage body scroll
watch(showCreateModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(showEditModal, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  background: var(--color-bg-secondary);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}

.header h1 {
  margin: 0;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Custom Modal Styles */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.custom-modal .modal-dialog {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
}

.custom-modal .modal-content {
  border: none;
  border-radius: var(--radius-lg);
}

.custom-modal .modal-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-modal .modal-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.custom-modal .modal-body {
  padding: var(--spacing-lg);
}

.custom-modal .modal-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.custom-modal .btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: var(--transition-fast);
}

.custom-modal .btn-close:hover {
  color: var(--color-text-primary);
}

/* Low Stock Alert Styles */
.low-stock-alert,
.zero-stock-alert {
  margin-bottom: var(--spacing-lg);
}

.low-stock-alert .alert {
  border: none;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.low-stock-products {
  max-height: 400px;
  overflow-y: auto;
}

.low-stock-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  background: var(--color-white);
  transition: var(--transition-fast);
}

.low-stock-item:hover {
  box-shadow: var(--shadow-sm);
}

.low-stock-item .product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.low-stock-item .product-details {
  flex: 1;
}

.low-stock-item .product-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.low-stock-item .product-category,
.low-stock-item .product-price {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.low-stock-item .stock-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.low-stock-item .stock-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.low-stock-item .stock-badge.critical-stock {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.low-stock-item .stock-badge.low-stock {
  background-color: var(--color-warning);
  color: var(--color-white);
}

.low-stock-item .stock-badge.out-of-stock {
  background-color: var(--color-gray-500);
  color: var(--color-white);
}

.low-stock-item .stock-actions {
  display: flex;
  gap: var(--spacing-xs);
}

@media (max-width: 768px) {
  .low-stock-item .product-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .low-stock-item .stock-info {
    align-items: flex-start;
    width: 100%;
  }
  
  .low-stock-item .stock-actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* Zero Stock Table Styles */
.zero-stock-table {
  max-height: 500px;
  overflow-y: auto;
}

.product-info-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.product-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
}

.table th {
  position: sticky;
  top: 0;
  background: var(--color-gray-800);
  color: var(--color-white);
  z-index: 1;
}

.table tbody tr:hover {
  background-color: var(--color-gray-50);
}

/* Ensure modal content is interactive */
.custom-modal .modal-content {
  position: relative;
  z-index: 1;
}

.custom-modal .modal-body {
  position: relative;
  z-index: 1;
}

/* Ensure form inputs are focusable */
.custom-modal input,
.custom-modal textarea,
.custom-modal select {
  position: relative;
  z-index: 2;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
  }
  
  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .modal-xl {
    max-width: 95%;
    margin: var(--spacing-sm);
  }
}
</style>
