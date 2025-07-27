<template>
  <div class="health-check" v-if="showHealthCheck">
    <div class="health-status" :class="statusClass">
      <i :class="statusIcon"></i>
      <span>{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  showHealthCheck: {
    type: Boolean,
    default: true
  }
})

const status = ref('checking') // 'checking', 'healthy', 'unhealthy'
const statusMessage = ref('Checking backend connectivity...')
const statusClass = ref('checking')
const statusIcon = ref('bi bi-hourglass-split')
let healthCheckInterval = null

const checkHealth = async () => {
  try {
    status.value = 'checking'
    statusMessage.value = 'Checking backend connectivity...'
    statusClass.value = 'checking'
    statusIcon.value = 'bi bi-hourglass-split'

    const response = await fetch('/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      status.value = 'healthy'
      statusMessage.value = 'Backend services are running'
      statusClass.value = 'healthy'
      statusIcon.value = 'bi bi-check-circle-fill'
    } else {
      status.value = 'unhealthy'
      statusMessage.value = `Backend error: ${response.status} ${response.statusText}`
      statusClass.value = 'unhealthy'
      statusIcon.value = 'bi bi-exclamation-triangle-fill'
    }
  } catch (error) {
    status.value = 'unhealthy'
    statusMessage.value = 'Backend services are offline'
    statusClass.value = 'unhealthy'
    statusIcon.value = 'bi bi-x-circle-fill'
    console.error('Health check failed:', error)
  }
}

onMounted(() => {
  checkHealth()
  // Check every 30 seconds
  healthCheckInterval = setInterval(checkHealth, 30000)
})

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
})
</script>

<style scoped>
.health-check {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.health-status.checking {
  color: #6c757d;
}

.health-status.healthy {
  color: #198754;
}

.health-status.unhealthy {
  color: #dc3545;
}

.health-status i {
  font-size: 1rem;
}
</style> 