<template>
  <div class="i18n-test">
    <h3>I18n Test Component</h3>
    <p>Current locale: {{ currentLocale }}</p>
    <p>Brand name: {{ $t('common.brand.name') }}</p>
    <p>Navigation home: {{ $t('common.navigation.home') }}</p>
    <p>Direct translation: {{ t('common.brand.name') }}</p>
    <p>Available locales: {{ availableLocales.map(l => l.code).join(', ') }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales } from '@/i18n'

const { t, locale } = useI18n()

const currentLocale = computed(() => locale.value)

console.log('I18nTest component mounted')
console.log('Current locale:', locale.value)
console.log('Available locales:', availableLocales)
console.log('Brand name translation:', t('brand.name'))
</script>

<style scoped>
.i18n-test {
  padding: 1rem;
  border: 1px solid #ccc;
  margin: 1rem;
  background: #f9f9f9;
}
</style> 