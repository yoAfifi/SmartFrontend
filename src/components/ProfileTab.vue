<template>
  <div class="profile-tab">
    <!-- Show loading state when profile is not available -->
    <div v-if="!profile" class="alert alert-info">
      <i class="bi bi-info-circle me-2"></i>
      Loading profile...
    </div>
    
    <!-- Show warning when profile exists but has no ID -->
    <div v-else-if="!profile.id" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ $t('common.common.noProfileData') }}
    </div>
    
    <!-- Show profile content when profile is available -->
    <div v-else class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="profile-title">
          <h2>{{ profile.name || $t('common.common.customer') }}</h2>
          <p>{{ profile.email || $t('common.common.noEmailProvided') }}</p>
        </div>
      </div>
      
      <div class="profile-body">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3>{{ $t('common.common.personalInformation') }}</h3>
            <button class="btn btn-sm btn-outline-primary" @click="editMode = !editMode">
              <i class="bi" :class="editMode ? 'bi-x-circle' : 'bi-pencil'"></i>
              {{ editMode ? $t('common.common.cancel') : $t('common.common.edit') }}
            </button>
          </div>
          
          <div class="card-body">
            <form v-if="editMode" @submit.prevent="saveProfile">
              <div class="mb-3">
                <label for="name" class="form-label">{{ $t('common.common.fullName') }}</label>
                <input type="text" class="form-control" id="name" v-model="formData.name" required>
              </div>
              
              <div class="mb-3">
                <label for="email" class="form-label">{{ $t('common.common.emailAddress') }}</label>
                <input type="email" class="form-control" id="email" v-model="formData.email" required>
              </div>
              
              <div class="mb-3">
                <label for="phone" class="form-label">{{ $t('common.common.phoneNumber') }}</label>
                <input type="tel" class="form-control" id="phone" v-model="formData.phone">
              </div>
              
              <div class="mb-3">
                <label for="address" class="form-label">{{ $t('common.common.address') }}</label>
                <textarea class="form-control" id="address" v-model="formData.address" rows="3"></textarea>
              </div>
              
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="editMode = false">{{ $t('common.common.cancel') }}</button>
                <button type="submit" class="btn btn-primary" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {{ $t('common.common.saveChanges') }}
                </button>
              </div>
            </form>
            
            <div v-else class="profile-info">
              <div class="info-group">
                <div class="info-label">{{ $t('common.common.fullName') }}</div>
                <div class="info-value">{{ profile.name || $t('common.common.notProvided') }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">{{ $t('common.common.emailAddress') }}</div>
                <div class="info-value">{{ profile.email || $t('common.common.notProvided') }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">{{ $t('common.common.phoneNumber') }}</div>
                <div class="info-value">{{ profile.phone || $t('common.common.notProvided') }}</div>
              </div>
              
              <div class="info-group">
                <div class="info-label">{{ $t('common.common.address') }}</div>
                <div class="info-value">{{ profile.address || $t('common.common.notProvided') }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-4">
          <div class="card-header">
            <h3>{{ $t('common.common.accountSummary') }}</h3>
          </div>
          
          <div class="card-body">
            <div class="summary-stats">
              <div class="stat-card">
                <div class="stat-icon orders-icon">
                  <i class="bi bi-box"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ orderCount }}</div>
                  <div class="stat-label">{{ $t('dashboard.stats.totalOrders') }}</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon pending-icon">
                  <i class="bi bi-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ pendingOrderCount }}</div>
                  <div class="stat-label">{{ $t('common.common.pendingOrders') }}</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon completed-icon">
                  <i class="bi bi-check-circle"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ completedOrderCount }}</div>
                  <div class="stat-label">{{ $t('common.common.completedOrders') }}</div>
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
    required: false,
    default: () => ({})
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
  if (props.profile && props.profile.id) {
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
    name: props.profile?.name || '',
    email: props.profile?.email || '',
    phone: props.profile?.phone || '',
    address: props.profile?.address || ''
  };
}

// Initialize form data when profile changes
watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    formData.value = {
      name: newProfile?.name || '',
      email: newProfile?.email || '',
      phone: newProfile?.phone || '',
      address: newProfile?.address || ''
    };
  }
}, { immediate: true });

async function saveProfile() {
  if (!props.profile || !props.profile.id) {
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
