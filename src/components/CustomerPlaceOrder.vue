<template>
  <div class="place-order">
    <h2 class="mb-3">Available Products</h2>

    <!-- Success -->
    <div
        v-if="successMessage"
        class="alert alert-success alert-dismissible fade show"
        role="alert"
    >
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = ''"></button>
    </div>

    <!-- Error -->
    <div
        v-if="errorMessage"
        class="alert alert-danger alert-dismissible fade show"
        role="alert"
    >
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>

    <!-- Products -->
    <div class="products-grid">
      <div v-for="p in products" :key="p.id" class="product-card">
        <div class="thumb">
          <img
              :src="imageSrc(p)"
              :alt="p.name"
              loading="lazy"
              @error="onImgError"
          />
          <span v-if="p.stock_quantity <= 0" class="badge-out">Out of stock</span>
        </div>

        <div class="info">
          <h4 class="name" :title="p.name">{{ p.name }}</h4>
          <p class="desc">
            {{ p.description || 'No description available.' }}
          </p>

          <div class="meta">
            <div class="price">€{{ Number(p.price).toFixed(2) }}</div>
            <button
                class="btn btn-primary btn-sm"
                @click="addToCart(p)"
                :disabled="p.stock_quantity <= 0"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart -->
    <h2 class="mt-4">Your Cart</h2>
    <div v-if="cart.length > 0">
      <table class="table align-middle">
        <thead>
        <tr>
          <th>Product</th>
          <th>Price (€)</th>
          <th style="width: 120px;">Quantity</th>
          <th>Subtotal (€)</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in cart" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ Number(item.price).toFixed(2) }}</td>
          <td>
            <input
                type="number"
                v-model.number="item.quantity"
                min="1"
                :max="getProductStock(item.id)"
                class="form-control form-control-sm"
                @change="emit('cart-updated', cart)"
            />
          </td>
          <td>{{ (item.price * item.quantity).toFixed(2) }}</td>
          <td>
            <button class="btn btn-danger btn-sm" @click="removeFromCart(index)">
              Remove
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="d-flex justify-content-between align-items-center">
        <h4 class="m-0">Total: €{{ total.toFixed(2) }}</h4>
        <button
            class="btn btn-success"
            @click="checkoutCart"
            :disabled="isPlacingOrder"
        >
          <span
              v-if="isPlacingOrder"
              class="spinner-border spinner-border-sm me-2"
              role="status"
          />
          Checkout
        </button>
      </div>
    </div>
    <div v-else>
      <p>Your cart is empty.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllProducts } from '@/services/productService'
import { placeOrder } from '@/services/orderService'
import { useRouter } from 'vue-router'

const router = useRouter()
const products = ref([])
const cart = ref([])
const successMessage = ref('')
const isPlacingOrder = ref(false)
const errorMessage = ref('')

// Event to parent
const emit = defineEmits(['cart-updated'])

// --------- images ----------
/**
 * Tiny inline SVG as a safe fallback if a product has no image
 * or the URL fails to load.
 */
const FALLBACK_IMG =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             font-family='Arial, Helvetica, sans-serif' font-size='16' fill='#9ca3af'>
         No image
       </text>
     </svg>`
    )

/** Product can come as imageUrl or image_url */
function imageSrc(p) {
  return p.imageUrl || p.image_url || FALLBACK_IMG
}
function onImgError(e) {
  e.target.src = FALLBACK_IMG
}

// --------- data loading ----------
const loadProducts = async () => {
  try {
    const { data } = await getAllProducts()
    products.value = data
  } catch (err) {
    console.error('Error loading products:', err)
    errorMessage.value = 'Failed to load products. Please refresh the page.'
  }
}
onMounted(loadProducts)

// --------- cart helpers ----------
function getProductStock(productId) {
  const p = products.value.find((x) => x.id === productId)
  return p ? p.stock_quantity : 0
}

function addToCart(product) {
  const existing = cart.value.find((i) => i.id === product.id)
  if (existing) {
    if (existing.quantity < product.stock_quantity) {
      existing.quantity++
    } else {
      errorMessage.value = 'No more stock available.'
      setTimeout(() => (errorMessage.value = ''), 3000)
      return
    }
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    })
  }
  successMessage.value = 'Product added to cart!'
  emit('cart-updated', cart.value)
  setTimeout(() => (successMessage.value = ''), 3000)
}

function removeFromCart(index) {
  cart.value.splice(index, 1)
  emit('cart-updated', cart.value)
}

const total = computed(() =>
    cart.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

async function checkoutCart() {
  if (cart.value.length === 0) {
    errorMessage.value = 'Your cart is empty.'
    setTimeout(() => (errorMessage.value = ''), 3000)
    return
  }

  const orderData = {
    orderDate: new Date().toISOString(),
    status: 'PENDING',
    totalAmount: total.value,
    orderItems: cart.value.map((i) => ({
      productId: i.id,
      quantity: i.quantity,
      unitPrice: i.price
    }))
  }

  try {
    isPlacingOrder.value = true
    await placeOrder(orderData)
    successMessage.value = 'Order placed successfully!'
    cart.value = []
    emit('cart-updated', [])
    setTimeout(() => {
      router.push({ path: '/dashboard', query: { tab: 'orderHistory' } })
    }, 2000)
  } catch (err) {
    console.error('Error placing order:', err)
    errorMessage.value = 'Error placing order. Please try again.'
  } finally {
    isPlacingOrder.value = false
  }
}
</script>

<style scoped>
.place-order {
  padding: 1rem;
}

/* --- Product grid / cards --- */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
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

.info {
  padding: 0.9rem 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
}

.name {
  font-size: 1.05rem;
  margin: 0;
  font-weight: 600;
}

.desc {
  color: #6c757d;
  font-size: 0.92rem;
  margin: 0;
  line-height: 1.35rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-weight: 700;
  color: #0d6efd;
  font-size: 1.1rem;
}

/* Table tweaks */
.table td,
.table th {
  vertical-align: middle;
}
</style>
