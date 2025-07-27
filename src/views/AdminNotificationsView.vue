<template>
  <div class="admin-notifications-view">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <NotificationDashboard />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import NotificationDashboard from '@/features/notifications/components/NotificationDashboard.vue'
</script>

<style scoped>
.admin-notifications-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
  padding: var(--spacing-lg) 0;
}
</style> 