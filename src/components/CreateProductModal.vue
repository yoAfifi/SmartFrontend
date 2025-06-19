<template>
  <!-- Bootstrap Modal for Creating Product -->
  <div class="modal fade" id="createProductModal" tabindex="-1" aria-labelledby="createProductModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form @submit.prevent="submitCreate">
          <div class="modal-header">
            <h5 class="modal-title" id="createProductModalLabel">Create Product</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="createName" class="form-label">Product Name</label>
              <input type="text" id="createName" class="form-control" v-model="createData.name" required>
            </div>
            <div class="mb-3">
              <label for="createPrice" class="form-label">Price (€)</label>
              <input type="number" id="createPrice" class="form-control" v-model.number="createData.price" step="0.01" required>
            </div>
            <div class="mb-3">
              <label for="createStock" class="form-label">Stock Quantity</label>
              <input type="number" id="createStock" class="form-control" v-model.number="createData.stock_quantity" required>
            </div>
            <div class="mb-3">
              <label for="createDescription" class="form-label">Description</label>
              <textarea id="createDescription" class="form-control" v-model="createData.description"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { createProduct } from '@/services/productService';

const emit = defineEmits(['created']);
const createData = ref({ name: '', price: 0, stock_quantity: 0, description: '' });
const isSubmitting = ref(false);
let modalInstance = null;

onMounted(() => {
  // Get the modal element
  const modalElement = document.getElementById('createProductModal');
  
  // Initialize the Bootstrap modal
  if (modalElement) {
    modalInstance = new bootstrap.Modal(modalElement);
    
    // Add event listener for when modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      // Reset form data when modal is closed
      createData.value = { name: '', price: 0, stock_quantity: 0, description: '' };
    });
  }
});

const submitCreate = async () => {
  try {
    isSubmitting.value = true;
    
    // Create the product
    const response = await createProduct(createData.value);
    
    // Emit the created event with the new product data
    emit('created', response.data);
    
    // Close the modal
    if (modalInstance) {
      modalInstance.hide();
    }
    
    // Reset the form data
    createData.value = { name: '', price: 0, stock_quantity: 0, description: '' };
  } catch (error) {
    console.error('Error creating product:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
