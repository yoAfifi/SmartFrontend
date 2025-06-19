<template>
  <div class="profile-tab">
    <div v-if="!profile || !profile.id" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      No profile data found. Please complete your profile information.
    </div>
    
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="profile-title">
          <h2>{{ profile.name || 'Customer' }}</h2>
          <p>{{ profile.email || 'No email provided' }}</p>
        </div>
      </div>
      
      <div class="profile-body">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3>Personal Information</h3>
            <button class="btn btn-sm btn-outline-primary" @click="editMode = !editMode">
              <i class="bi" :class="editMode ? 'bi-x-circle' : 'bi-pencil'"></i>
              {{ editMode ? 'Cancel' : 'Edit' }}
            </button>
          </div>
          
          <div class="card-body">
            <form v-if="editMode" @submit.prevent="saveProfile">
              <div class="mb-3">
                <label for="name" class="form-label">Full Name</label>
                <input type="text" class="form-control" id="name" v-model="formData.name" required>
              </div>
              
              <div class="mb-3">
                <label for="email" class="form-label">Email Address</label>
                <input type="email" class="form-control" id="email" v-model="formData.email" required>
              </div>
              
              <div class="mb-3">
                <label for="phone" class="form-label">Phone Number</label>
                <input type="tel" class="form-control" id="phone" v-model="formData.phone">
              </div>
              
              <div class="mb-3">
                <label for="address" class="form-label">Address</label>
                <textarea class="form-control" id="address" v-model="formData.address" rows="3"></textarea>
              </div>
              
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="editMode = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  Save Changes
                </button>
              </div>
            </form>
            
            <div v-else class="profile-info">
              <div class="info-group">
                <div class="info-label">Full Name</div>
                <div class="info-value">{{ profile.name || 'Not provided' }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">Email Address</div>
                <div class="info-value">{{ profile.email || 'Not provided' }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">Phone Number</div>
                <div class="info-value">{{ profile.phone || 'Not provided' }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">Address</div>
                <div class="info-value">{{ profile.address || 'Not provided' }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-4">
          <div class="card-header">
            <h3>Account Summary</h3>
          </div>
          
          <div class="card-body">
            <div class="summary-stats">
              <div class="stat-card">
                <div class="stat-icon orders-icon">
                  <i class="bi bi-box"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ orderCount }}</div>
                  <div class="stat-label">Total Orders</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon pending-icon">
                  <i class="bi bi-hourglass-split"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ pendingOrderCount }}</div>
                  <div class="stat-label">Pending Orders</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon completed-icon">
                  <i class="bi bi-check-circle"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ completedOrderCount }}</div>
                  <div class="stat-label">Completed Orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getOrdersByCustomer } from '@/services/orderService';
import { updateCustomer } from '@/services/customerService';

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update-profile']);

const editMode = ref(false);
const isSaving = ref(false);
const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: ''
});
const orders = ref([]);

onMounted(async () => {
  resetForm();
  if (props.profile.id) {
    try {
      const response = await getOrdersByCustomer(props.profile.id);
      orders.value = response.data;
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }
});

function resetForm() {
  formData.value = {
    name: props.profile.name || '',
    email: props.profile.email || '',
    phone: props.profile.phone || '',
    address: props.profile.address || ''
  };
}

// Initialize form data when profile changes
watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    formData.value = {
      name: newProfile.name || '',
      email: newProfile.email || '',
      phone: newProfile.phone || '',
      address: newProfile.address || ''
    };
  }
}, { immediate: true });

async function saveProfile() {
  if (!props.profile.id) {
    console.error('No profile ID found');
    return;
  }
  
  try {
    isSaving.value = true;
    
    const updatedProfile = {
      ...props.profile,
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      address: formData.value.address
    };
    
    await updateCustomer(props.profile.id, updatedProfile);
    emit('update-profile', updatedProfile);
    editMode.value = false;
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

const orderCount = computed(() => orders.value.length);
const pendingOrderCount = computed(() => 
  orders.value.filter(order => order.status === 'PENDING').length
);
const completedOrderCount = computed(() => 
  orders.value.filter(order => ['DELIVERED', 'COMPLETED'].includes(order.status)).length
);
</script>

<style scoped>
.profile-tab {
  max-width: 800px;
  margin: 0 auto;
}

.profile-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar i {
  font-size: 3rem;
  color: #6c757d;
}

.profile-title h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-title p {
  margin: 0.25rem 0 0;
  color: #6c757d;
}

.profile-body {
  padding: 2rem;
}

.card {
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.card-header {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.profile-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-group {
  margin-bottom: 1rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
}
</style>
