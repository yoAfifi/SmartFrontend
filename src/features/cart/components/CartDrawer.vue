<template>
  <div class="cart-drawer-overlay" v-if="isOpen" @click="closeCart">
    <div class="cart-drawer" @click.stop>
      <!-- Header -->
      <div class="cart-header">
        <h3 class="cart-title">
          <i class="bi bi-cart3"></i>
          {{ $t('cart.cart.title') }}
        </h3>
        <button class="btn-close" @click="closeCart" :aria-label="$t('cart.cart.closeCart')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="cart-loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>{{ $t('cart.cart.loading') }}</p>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="isEmpty" class="cart-empty">
        <i class="bi bi-cart-x"></i>
        <h4>{{ $t('cart.cart.emptyCart') }}</h4>
        <p>{{ $t('cart.cart.addProducts') }}</p>
        <AppButton
          variant="primary"
          @click="continueShopping"
        >
          {{ $t('cart.cart.continueShopping') }}
        </AppButton>
      </div>

      <!-- Cart Items -->
      <div v-else class="cart-content">
        <div class="cart-items">
          <div
            v-for="item in items"
            :key="item.id"
            class="cart-item"
          >
            <!-- Item Image -->
            <div class="item-image">
              <img
                :src="getItemImage(item)"
                :alt="item.name"
                @error="handleImageError"
              />
            </div>

            <!-- Item Details -->
            <div class="item-details">
              <h5 class="item-name">{{ item.productName || $t('cart.cart.productNameNotAvailable') }}</h5>
              <div class="item-price">€{{ formatPrice(item.unitPrice) }}</div>
              
              <!-- Quantity Controls -->
              <div class="quantity-controls">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                >
                  <i class="bi bi-dash"></i>
                </button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  @click="updateQuantity(item.id, item.quantity + 1)"
                  :disabled="item.quantity >= (item.stockQuantity || 999)"
                >
                  <i class="bi bi-plus"></i>
                </button>
              </div>

              <!-- Stock Warning -->
              <div v-if="item.quantity >= (item.stockQuantity || 999)" class="stock-warning">
                <small class="text-warning">
                  <i class="bi bi-exclamation-triangle"></i>
                  {{ $t('cart.cart.maximumQuantity') }}
                </small>
              </div>
            </div>

            <!-- Item Actions -->
            <div class="item-actions">
              <div class="item-subtotal">
                €{{ formatPrice(item.totalPrice) }}
              </div>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="removeItem(item.id)"
                :disabled="isUpdating"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>{{ $t('cart.cart.subtotal') }}:</span>
            <span>€{{ formatPrice(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span>{{ $t('cart.cart.products') }}:</span>
            <span>{{ totalItems }}</span>
          </div>
          <div class="summary-row">
            <span>{{ $t('cart.cart.totalItems') }}:</span>
            <span>{{ totalQuantities }}</span>
          </div>
          
          <hr class="summary-divider">
          
          <div class="summary-row total">
            <span>{{ $t('cart.cart.total') }}:</span>
            <span>€{{ formatPrice(subtotal) }}</span>
          </div>
        </div>

        <!-- Cart Actions -->
        <div class="cart-actions">
          <AppButton
            variant="outline-secondary"
            @click="clearCart"
            :loading="isClearing"
            block
          >
            <i class="bi bi-trash"></i>
            {{ $t('cart.cart.clearCart') }}
          </AppButton>
          
          <AppButton
            variant="primary"
            @click="proceedToCheckout"
            :disabled="isEmpty"
            block
          >
            <i class="bi bi-credit-card"></i>
            {{ $t('cart.cart.proceedToCheckout') }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import AppButton from '@/ui/atoms/AppButton.vue'
import { showSuccessToast, showWarningToast } from '@/services/api'

const { t } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const cartStore = useCartStore()

// Computed
const items = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.subtotal)
const totalItems = computed(() => cartStore.totalItems)
const totalQuantities = computed(() => cartStore.totalQuantities)
const isEmpty = computed(() => cartStore.isEmpty)
const isLoading = computed(() => cartStore.isLoading)

// Local state for specific actions
const isUpdating = ref(false)
const isClearing = ref(false)

// Methods
const closeCart = () => {
  emit('close')
}

const getItemImage = (item) => {
  return item.imageUrl || '/placeholder-product.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder-product.jpg'
}

const formatPrice = (price) => {
  // Handle null, undefined, or invalid price values
  if (price === null || price === undefined || isNaN(price) || price === '') {
    return '0.00'
  }
  
  // Convert to number and format
  const numericPrice = Number(price)
  if (isNaN(numericPrice)) {
    return '0.00'
  }
  
  return numericPrice.toFixed(2)
}

const updateQuantity = async (itemId, newQuantity) => {
  if (newQuantity <= 0) {
    await removeItem(itemId)
    return
  }

  try {
    isUpdating.value = true
    await cartStore.updateItemQuantity(itemId, newQuantity)
  } catch (error) {
    console.error('Error updating quantity:', error)
    
    // Check if it's a network error (services offline)
    if (!error.response) {
      showWarningToast('Unable to connect to server. Please check if services are running.')
    } else if (error.response?.status === 403) {
      showWarningToast(t('cart.cart.noPermissionUpdate'))
    } else if (error.response?.status === 401) {
      showWarningToast('Your session has expired. Please log in again.')
    } else {
      showWarningToast('Failed to update quantity. Please try again.')
    }
  } finally {
    isUpdating.value = false
  }
}

const removeItem = async (itemId) => {
  try {
    await cartStore.removeItem(itemId)
          showSuccessToast(t('cart.cart.itemRemoved'))
  } catch (error) {
    console.error('Error removing item:', error)
    
    // Check if it's a network error (services offline)
    if (!error.response) {
      showWarningToast('Unable to connect to server. Please check if services are running.')
    } else if (error.response?.status === 403) {
      showWarningToast(t('cart.cart.noPermissionRemove'))
    } else if (error.response?.status === 401) {
      showWarningToast('Your session has expired. Please log in again.')
    } else {
      showWarningToast('Failed to remove item. Please try again.')
    }
  }
}

const clearCart = async () => {
  if (!confirm('Are you sure you want to clear your cart?')) return

  try {
    isClearing.value = true
    await cartStore.clearCart()
    showSuccessToast('Cart cleared')
  } catch (error) {
    console.error('Error clearing cart:', error)
    showWarningToast('Failed to clear cart')
  } finally {
    isClearing.value = false
  }
}

const proceedToCheckout = () => {
  closeCart()
  router.push('/checkout')
}

const continueShopping = () => {
  closeCart()
  // Navigate to dashboard with Place Order tab active
  router.push('/dashboard?tab=placeOrder')
}
</script>

<style scoped>
.cart-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal);
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.cart-drawer {
  width: 100%;
  max-width: 400px;
  height: 100vh;
  background: var(--color-white);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  box-shadow: var(--shadow-xl);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.cart-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-close {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.btn-close:hover {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}

.cart-loading,
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.cart-empty i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-gray-400);
}

.cart-empty h4 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.cart-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  background: var(--color-white);
  transition: var(--transition-fast);
}

.cart-item:hover {
  box-shadow: var(--shadow-sm);
}

.item-image {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.item-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.item-price {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
}

.quantity-display {
  min-width: 30px;
  text-align: center;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.stock-warning {
  margin-top: var(--spacing-xs);
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

.item-subtotal {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}

.cart-summary {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.summary-row.total {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: 0;
}

.summary-divider {
  margin: var(--spacing-md) 0;
  border-color: var(--color-border-light);
}

.cart-actions {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .cart-drawer {
    max-width: 100%;
  }
  
  .cart-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .item-actions {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}
</style> 