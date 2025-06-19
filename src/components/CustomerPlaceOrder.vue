<template>
  <div class="place-order">
    <h2>Available Products</h2>
    
    <!-- Success message -->
    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
      {{ successMessage }}
      <button type="button" class="btn-close" @click="successMessage = ''"></button>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ errorMessage }}
      <button type="button" class="btn-close" @click="errorMessage = ''"></button>
    </div>
    
    <div class="product-list">
      <div v-for="product in products" :key="product.id" class="product-card">
        <h4>{{ product.name }}</h4>
        <p>Price: €{{ product.price }}</p>
        <p>Stock: {{ product.stock_quantity }}</p>
        <button 
          class="btn btn-primary" 
          @click="addToCart(product)" 
          :disabled="product.stock_quantity <= 0"
        >
          Add to Cart
        </button>
      </div>
    </div>

    <h2 class="mt-4">Your Cart</h2>
    <div v-if="cart.length > 0">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price (€)</th>
            <th>Quantity</th>
            <th>Subtotal (€)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in cart" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.price }}</td>
            <td>
              <input
                type="number"
                v-model.number="item.quantity"
                min="1"
                :max="getProductStock(item.id)"
                class="form-control"
                style="width: 80px;"
                @change="emit('cart-updated', cart)"
              />
            </td>
            <td>{{ (item.price * item.quantity).toFixed(2) }}</td>
            <td>
              <button
                class="btn btn-danger btn-sm"
                @click="removeFromCart(index)"
              >
                Remove
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <h4>Total: €{{ total.toFixed(2) }}</h4>
      <button 
        class="btn btn-success" 
        @click="checkoutCart"
        :disabled="isPlacingOrder"
      >
        <span v-if="isPlacingOrder" class="spinner-border spinner-border-sm me-2" role="status"></span>
        Checkout
      </button>
    </div>
    <div v-else>
      <p>Your cart is empty.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { getAllProducts } from '@/services/productService';
import { placeOrder } from '@/services/orderService';
import { useRouter } from 'vue-router';

const router = useRouter();
const products = ref([]);
const cart = ref([]);
const successMessage = ref("");
const isPlacingOrder = ref(false);
const errorMessage = ref("");

// Emit event to parent component
const emit = defineEmits(['cart-updated']);

const loadProducts = async () => {
  try {
    const response = await getAllProducts();
    products.value = response.data;
  } catch (error) {
    console.error('Error loading products:', error);
    errorMessage.value = "Failed to load products. Please refresh the page.";
  }
};

onMounted(() => {
  loadProducts();
});

const getProductStock = (productId) => {
  const product = products.value.find((p) => p.id === productId);
  return product ? product.stock_quantity : 0;
};

const addToCart = (product) => {
  const existingItem = cart.value.find((item) => item.id === product.id);
  if (existingItem) {
    if (existingItem.quantity < product.stock_quantity) {
      existingItem.quantity++;
    } else {
      errorMessage.value = 'No more stock available.';
      setTimeout(() => {
        errorMessage.value = "";
      }, 3000);
      return;
    }
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  }
  successMessage.value = "Product added to cart!";
  // Emit cart updated event
  emit('cart-updated', cart.value);
  setTimeout(() => {
    successMessage.value = "";
  }, 3000);
};

const removeFromCart = (index) => {
  cart.value.splice(index, 1);
  // Emit cart updated event
  emit('cart-updated', cart.value);
};

const total = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

async function checkoutCart() {
  if (cart.value.length === 0) {
    errorMessage.value = 'Your cart is empty.';
    setTimeout(() => {
      errorMessage.value = "";
    }, 3000);
    return;
  }

  const orderData = {
    orderDate: new Date().toISOString(),
    status: 'PENDING',
    totalAmount: total.value,
    orderItems: cart.value.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price
    }))
  };

  try {
    isPlacingOrder.value = true;
    await placeOrder(orderData);
    successMessage.value = 'Order placed successfully!';
    cart.value = [];
    // Emit cart updated event
    emit('cart-updated', []);
    
    // Redirect to order history after a short delay
    setTimeout(() => {
      router.push({ path: '/dashboard', query: { tab: 'orderHistory' } });
    }, 2000);
  } catch (error) {
    console.error('Error placing order:', error);
    errorMessage.value = 'Error placing order. Please try again.';
  } finally {
    isPlacingOrder.value = false;
  }
}
</script>

<style scoped>
.place-order {
  padding: 1rem;
}
.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}
.product-card {
  border: 1px solid #ddd;
  padding: 1rem;
  width: 200px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
.product-card h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}
.product-card p {
  margin-bottom: 0.5rem;
  color: #666;
}
.product-card button {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
