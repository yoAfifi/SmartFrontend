<template>
  <div class="place-order-container">
    <!-- Category / Search -->
    <div class="filter-section">
      <div class="search-box">
        <i class="bi bi-search"></i>
        <input
            type="text"
            v-model="searchQuery"
            :placeholder="$t('products.products.searchPlaceholder')"
            class="form-control"
        />
      </div>

      <div class="category-filters">
        <button
            class="category-btn"
            :class="{ active: selectedCategory === null }"
            @click="selectedCategory = null"
        >
          {{ $t('products.products.allProducts') }}
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
      <p>{{ $t('products.products.loading') }}</p>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="no-products">
      <i class="bi bi-exclamation-circle"></i>
      <p>{{ $t('products.products.noProductsFound') }}</p>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card">
        <!-- Thumbnail with fallback + stock badge -->
        <div class="thumb">
          <img
              :src="imageSrc(product)"
              :alt="product.name"
              loading="lazy"
              @error="onImgError"
          />
          <span v-if="product.stock_quantity <= 0" class="badge-out">{{ $t('products.products.outOfStock') }}</span>
        </div>

        <div class="product-info">
          <h4 :title="product.name">{{ product.name }}</h4>

          <div class="product-category" v-if="product.category">
            <span class="badge bg-light text-dark">
              {{ typeof product.category === 'object' && product.category !== null ? product.category.name : product.category }}
            </span>
          </div>

          <!-- Product Rating -->
          <div class="product-rating">
            <RatingStars 
              :rating="product.averageRating || 0" 
              :readonly="true"
              :show-text="false"
            />
            <small class="rating-text" :class="{ 'no-rating': !product.averageRating }">
              {{ product.averageRating ? product.averageRating.toFixed(1) : $t('products.products.noRating') }} / 5.0
              <span v-if="product.reviewCount" class="review-count">({{ product.reviewCount }} {{ $t('products.products.reviews') }})</span>
            </small>
          </div>
          
          <!-- Rate Product Button -->
          <div class="rate-product-section">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm rate-product-btn"
              @click="openRatingModal(product)"
            >
              <i class="bi bi-star"></i>
              {{ $t('products.products.rateThisProduct') }}
            </button>
          </div>

          <p class="product-description">
            {{ product.description || $t('products.products.noDescription') }}
          </p>

          <div class="product-price-actions">
            <p class="product-price">€{{ Number(product.price).toFixed(2) }}</p>
            <button
                class="btn btn-primary add-to-cart-btn"
                @click="addToCart(product)"
                :disabled="isProductInCart(product.id) || product.stock_quantity <= 0"
            >
              <i class="bi" :class="isProductInCart(product.id) ? 'bi-check' : 'bi-cart-plus'"></i>
              {{ isProductInCart(product.id) ? $t('products.products.added') : $t('products.products.addToCart') }}
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
        <span>{{ $t('products.products.viewCart') }}</span>
      </div>
    </div>

    <!-- Rating Modal -->
    <ProductRatingModal
      v-if="isRatingModalOpen && selectedProductForRating"
      :is-open="true"
      :product="selectedProductForRating"
      @close="closeRatingModal"
      @rating-submitted="handleRatingSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getAllProducts } from '@/services/productService'
import { useCartStore } from '@/stores/cart'
import RatingStars from '@/ui/atoms/RatingStars.vue'
import ProductRatingModal from '@/components/ProductRatingModal.vue'

const { t } = useI18n()

const props = defineProps({
  cart: { type: Array, required: true }
})

const cartStore = useCartStore()

const router = useRouter()
const products = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref(null)
const isRatingModalOpen = ref(false)
const selectedProductForRating = ref(null)

// ---- Images helpers (supports imageUrl or image_url; uses fallback if missing/blocked) ----
const FALLBACK_IMG =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
       <rect width="100%" height="100%" fill="#f3f4f6"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#9ca3af">
         No image
       </text>
     </svg>`
    )

function imageSrc(p) {
  // Back-end might send "imageUrl" (camel) or "image_url" (snake)
  return p.imageUrl || p.image_url || FALLBACK_IMG
}
function onImgError(e) {
  e.target.src = FALLBACK_IMG
}

// ---- Derived ----
const categories = computed(() => {
  const set = new Set(products.value.map(p => {
    if (typeof p.category === 'object' && p.category !== null) {
      return p.category.name
    }
    return p.category
  }).filter(Boolean))
  return [...set]
})

const filteredProducts = computed(() => {
  // Filter out products with 0 stock first
  let result = products.value.filter(p => p.stock_quantity > 0)

  if (selectedCategory.value) {
    result = result.filter(p => {
      const categoryName = typeof p.category === 'object' && p.category !== null 
        ? p.category.name 
        : p.category
      return categoryName === selectedCategory.value
    })
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
        p =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
    )
  }
  return result
})

const cartTotal = computed(() =>
    props.cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

// ---- Methods ----
function isProductInCart(productId) {
  return props.cart.some(i => i.id === productId)
}

async function addToCart(product) {
  if (isProductInCart(product.id) || product.stock_quantity <= 0) return

  try {
    console.log('Adding to cart:', { productId: product.id, productName: product.name })
    await cartStore.addItem(product.id, 1)
    // Toast is handled by the cart store, no need for duplicate
  } catch (error) {
    console.error('Error adding to cart:', error)
    // Error toast is handled by the cart store, no need for duplicate
  }
}

function goToCart() {
  router.push({ query: { tab: 'cart' } })
}

function openRatingModal(product) {
  selectedProductForRating.value = product
  isRatingModalOpen.value = true
}

function closeRatingModal() {
  isRatingModalOpen.value = false
  selectedProductForRating.value = null
}

function handleRatingSubmitted(ratingData) {
  console.log('Rating submitted:', ratingData)
  
  // Refresh the product data to show updated average rating
  refreshProductData()
}

// Function to refresh product data
async function refreshProductData() {
  try {
    const { data } = await getAllProducts()
    products.value = data
  } catch (err) {
    console.error('Error refreshing products:', err)
  }
}

// ---- Load ----
onMounted(async () => {
  try {
    isLoading.value = true
    const { data } = await getAllProducts()
    products.value = data
  } catch (err) {
    console.error('Error loading products:', err)
  } finally {
    isLoading.value = false
  }
})
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
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
.category-btn:hover { background-color: #e9ecef; }
.category-btn.active {
  background-color: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

/* ---- Cards with image ---- */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}

.product-card {
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.12);
}

.thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3; /* modern browsers */
  background: #f8f9fa;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.badge-out {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #dc3545;
  color: #fff;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.product-info {
  padding: 1rem 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.product-info h4 {
  margin-bottom: 0.35rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.product-category { margin-bottom: 0.4rem; }

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.rating-text {
  color: #6c757d;
  font-size: 0.8rem;
}

.review-count {
  color: #adb5bd;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.rating-text.no-rating {
  color: #adb5bd;
  font-style: italic;
}

.rate-product-section {
  margin-bottom: 0.5rem;
}

.rate-product-btn {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.rate-product-btn i {
  margin-right: 0.25rem;
}

.product-description {
  color: #6c757d;
  font-size: 0.92rem;
  margin-bottom: 0.9rem;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
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
  font-weight: 700;
  font-size: 1.12rem;
  color: var(--primary-color);
  margin: 0;
}
.add-to-cart-btn {
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
}
.add-to-cart-btn i { margin-right: 5px; }

/* Floating cart summary */
.cart-summary {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--primary-color);
  color: #fff;
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
.cart-summary:hover { transform: translateY(-3px); }

.cart-items-count { position: relative; }
.cart-items-count .badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #dc3545;
  color: #fff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.cart-total { display: flex; flex-direction: column; font-size: 0.9rem; }
.cart-total span:first-child { font-weight: 600; font-size: 1.1rem; }

/* Loading / empty states */
.loading-container,
.no-products {
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

/* Toast */
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
.toast-notification.show { bottom: 2rem; }

.toast-notification.error {
  background-color: #dc3545;
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
