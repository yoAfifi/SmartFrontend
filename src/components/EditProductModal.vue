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
            <div class="mb-3">
              <label class="form-label">Replace image (optional)</label>
              <input type="file" class="form-control" accept="image/*" @change="onFile">
            </div>

            <!-- Optional live preview of the new image -->
            <div v-if="preview" class="mb-2">
              <img :src="preview" class="rounded" style="height:100px;object-fit:cover">
            </div>

            <!-- Show current image if exists and no new preview selected -->
            <div v-else-if="editData.imageUrl" class="mb-2">
              <img :src="editData.imageUrl" class="rounded" style="height:100px;object-fit:cover">
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
/* global bootstrap */
import { ref, watch, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue'
import { updateProduct } from '@/services/productservice'

const props = defineProps({
  product: { type: Object, default: null }
})
const emit = defineEmits(['updated'])

const editData = ref({
  id: null,
  name: '',
  price: 0,
  stock_quantity: 0,
  description: ''
})

// NEW: files & previews for multi‑image upload
const files = ref([])     // File[]
const previews = ref([])  // string[] (Object URLs)

function onFiles (e) {
  // revoke previous previews
  previews.value.forEach(URL.revokeObjectURL)
  files.value = [...(e.target.files || [])]
  previews.value = files.value.map(f => URL.createObjectURL(f))
}

// keep your watcher to fill the form when product changes
watch(
    () => props.product,
    (p) => {
      if (p) {
        editData.value = { ...p }
        // clear selection when switching product
        files.value = []
        previews.value.forEach(URL.revokeObjectURL)
        previews.value = []
      }
    },
    { immediate: true }
)

async function submitEdit () {
  try {
    await updateProduct(editData.value.id, editData.value, files.value) // <-- pass files
    emit('updated', { ...editData.value })
    const modalEl = document.getElementById('editProductModal')
    const instance = bootstrap.Modal.getInstance(modalEl)
    if (instance) instance.hide()
  } catch (error) {
    console.error('Error updating product:', error)
  }
}

onMounted(() => {
  const modalEl = document.getElementById('editProductModal')
  if (!bootstrap.Modal.getInstance(modalEl)) {
    new bootstrap.Modal(modalEl)
  }
  // reset file input when modal closes
  modalEl?.addEventListener('hidden.bs.modal', () => {
    files.value = []
    previews.value.forEach(URL.revokeObjectURL)
    previews.value = []
  })
})

onBeforeUnmount(() => {
  previews.value.forEach(URL.revokeObjectURL)
})
</script>
<style scoped>
/* Adjust modal styling as needed */
</style>
