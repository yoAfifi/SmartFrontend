<template>
  <!-- Bootstrap Modal -->
  <div class="modal fade" id="editProductModal" tabindex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <form @submit.prevent="submitEdit">
          <div class="modal-header">
            <h5 class="modal-title" id="editProductModalLabel">Edit Product</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="editName" class="form-label">Product Name</label>
              <input type="text" id="editName" class="form-control" v-model="editData.name" required>
            </div>
            <div class="mb-3">
              <label for="editPrice" class="form-label">Price (€)</label>
              <input type="number" id="editPrice" class="form-control" v-model.number="editData.price" step="0.01" required>
            </div>
            <div class="mb-3">
              <label for="editStock" class="form-label">Stock Quantity</label>
              <input type="number" id="editStock" class="form-control" v-model.number="editData.stock_quantity" required>
            </div>
            <div class="mb-3">
              <label for="editDescription" class="form-label">Description</label>
              <textarea id="editDescription" class="form-control" v-model="editData.description"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue';
import { updateProduct as updateProductService } from '@/services/productService';

const props = defineProps({
  product: Object
});
const emit = defineEmits(['updated']);

const editData = ref({
  id: null,
  name: '',
  price: 0,
  stock_quantity: 0,
  description: ''
});

// Watch for changes in the product prop and update editData accordingly.
watch(
    () => props.product,
    (newProduct) => {
      if (newProduct) {
        editData.value = { ...newProduct };
      }
    },
    { immediate: true }
);

const submitEdit = async () => {
  try {
    await updateProductService(editData.value.id, editData.value);
    emit('updated', editData.value);
    // Hide the modal using Bootstrap's modal API
    const modalEl = document.getElementById('editProductModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
      modalInstance.hide();
    }
  } catch (error) {
    console.error('Error updating product:', error);
  }
};

onMounted(() => {
  const modalEl = document.getElementById('editProductModal');
  if (!bootstrap.Modal.getInstance(modalEl)) {
    new bootstrap.Modal(modalEl);
  }
});
</script>

<style scoped>
/* Adjust modal styling as needed */
</style>
