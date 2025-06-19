<template>
  <div class="place-order-container">
    <!-- Category Filter -->
    <div class="filter-section">
      <div class="search-box">
        <i class="bi bi-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search products..." 
          class="form-control"
        />
      </div>
      
      <div class="category-filters">
        <button 
          class="category-btn" 
          :class="{ active: selectedCategory === null }"
          @click="selectedCategory = null"
        >
          All Products
        </button>
        <button 
          v-for="category in categories" 
          :key="category"
          class="category-btn" 
          :class="{ active: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading products...</p>
    </div>
    
    <div v-else-if="filteredProducts.length === 0" class="no-products">
      <i class="bi bi-exclamation-circle"></i>
      <p>No products found. Try a different search or category.</p>
    </div>
    
    <div v-else class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="product-info">
          <h4>{{ product.name }}</h4>
          <div class="product-category" v-if="product.category">
            <span class="badge bg-light text-dark">{{ product.category }}</span>
          </div>
          <p class="product-description">{{ product.description || 'No description available' }}</p>
          <div class="product-price-actions">
            <p class="product-price">€{{ product.price.toFixed(2) }}</p>
            <button 
              class="btn btn-primary add-to-cart-btn" 
              @click="addToCart(product)"
              :disabled="isProductInCart(product.id)"
            >
              <i class="bi" :class="isProductInCart(product.id) ? 'bi-check' : 'bi-cart-plus'"></i>
              {{ isProductInCart(product.id) ? 'Added' : 'Add to Cart' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Summary Floating Button -->
    <div v-if="cart.length > 0" class="cart-summary" @click="goToCart">
      <div class="cart-items-count">
        <i class="bi bi-cart-fill"></i>
        <span class="badge">{{ cart.length }}</span>
      </div>
      <div class="cart-total">
        <span>€{{ cartTotal.toFixed(2) }}</span>
        <span>View Cart</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAllProducts } from '@/services/productService';

const props = defineProps({
  cart: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update-cart']);
const router = useRouter();

const products = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref(null);

// Computed properties
const categories = computed(() => {
  const uniqueCategories = new Set(products.value.map(p => p.category).filter(Boolean));
  return Array.from(uniqueCategories);
});

const filteredProducts = computed(() => {
  let result = products.value;
  
  // Filter by category if selected
  if (selectedCategory.value) {
    result = result.filter(p => p.category === selectedCategory.value);
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
  }
  
  return result;
});

const cartTotal = computed(() => {
  return props.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Methods
function isProductInCart(productId) {
  return props.cart.some(item => item.id === productId);
}

function addToCart(product) {
  if (isProductInCart(product.id)) return;
  
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1
  };
  
  const updatedCart = [...props.cart, cartItem];
  emit('update-cart', updatedCart);
  
  // Show a brief toast notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<i class="bi bi-check-circle"></i> ${product.name} added to cart`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }, 100);
}

function goToCart() {
  router.push({ query: { tab: 'cart' } });
}

// Load products on mount
onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await getAllProducts();
    products.value = response.data;
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.place-order-container {
  position: relative;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box {
  position: relative;
  max-width: 500px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-box input {
  padding-left: 35px;
  border-radius: 20px;
  border: 1px solid #ddd;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background-color: #e9ecef;
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.product-info {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-info h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.product-category {
  margin-bottom: 0.5rem;
}

.product-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.product-price {
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--primary-color);
  margin: 0;
}

.add-to-cart-btn {
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
}

.add-to-cart-btn i {
  margin-right: 5px;
}

.cart-summary {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: 30px;
  padding: 0.8rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s ease;
}

.cart-summary:hover {
  transform: translateY(-3px);
}

.cart-items-count {
  position: relative;
}

.cart-items-count .badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.cart-total {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.cart-total span:first-child {
  font-weight: 600;
  font-size: 1.1rem;
}

.loading-container, .no-products {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
  text-align: center;
}

.no-products i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.toast-notification {
  position: fixed;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #28a745;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: bottom 0.3s ease;
}

.toast-notification.show {
  bottom: 2rem;
}

.toast-notification i {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  
  .cart-summary {
    bottom: 1rem;
    right: 1rem;
    padding: 0.6rem 1rem;
  }
}
</style>
