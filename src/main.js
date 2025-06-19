import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'

import router from './router' // Import the router you created
import pinia from './stores'
import { setupInterceptors, setupResponseInterceptors } from './services/api'

// Initialize API interceptors
setupInterceptors()
setupResponseInterceptors()

const app = createApp(App)
app.use(pinia) // Initialize pinia first
app.use(router) // Then use the router
app.mount('#app') // Mount the app
