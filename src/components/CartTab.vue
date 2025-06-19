<template>
  <div>
    <h3>Your Cart</h3>
    <div v-if="cart.length">
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
            <input type="number" class="form-control" v-model.number="item.quantity" min="1">
          </td>
          <td>{{ (item.price * item.quantity).toFixed(2) }}</td>
          <td><button class="btn btn-danger btn-sm" @click="remove(index)">Remove</button></td>
        </tr>
        </tbody>
      </table>
      <h4>Total: €{{ total.toFixed(2) }}</h4>
      <button class="btn btn-success" @click="checkout">Checkout</button>
    </div>
    <div v-else>Your cart is empty.</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { placeOrder } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['cart-changed']);

const props = defineProps({
  cart: Array
});

const authStore = useAuthStore();

const total = computed(() => props.cart.reduce((acc, item) => acc + item.price * item.quantity, 0));

function remove(index) {
  props.cart.splice(index, 1);
}

async function checkout() {
  if (!props.cart.length) {
    alert("Cart is empty.");
    return;
  }

  const orderData = {
    orderItems: props.cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price
    })),
    status: "PENDING"
  };

  try {
    const response = await placeOrder(orderData);
    console.log('Order placed successfully:', response.data);
    props.cart.splice(0);
    emit('cart-changed');
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Error placing order.');
  }
}
</script>
