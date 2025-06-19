import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import AdminDashboardView from '@/views/AdminDashboardView.vue';
import AdminProductsView from '@/views/AdminProductsView.vue';
import AdminOrdersView from '@/views/AdminOrdersView.vue'; //
import AdminCustomersView from "@/views/AdminCustomersView.vue";
import { useAuthStore } from '@/stores/auth';

// Import the orders view

const routes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin-dashboard',
        component: AdminDashboardView,
        meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] }
    },
    {
        path: '/admin-products',
        component: AdminProductsView,
        meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] }
    },
    {
        path: '/register',      // <-- make sure this path matches
        name: 'Register',
        component: () => import('@/views/RegisterView.vue'),
    },
    {
        path: '/admin-orders',
        component: AdminOrdersView,
        meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] }
    },
    {
        path: '/admin-customers',
        component: AdminCustomersView,
        meta: { requiresAuth: true, roles: ['ROLE_ADMIN'] }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // Check if route requires authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
            // Redirect to login page
            next({ path: '/login', query: { redirect: to.fullPath } });
        } else {
            // User is authenticated, proceed
            next();
        }
    } else {
        // Route doesn't require authentication
        next();
    }
});

export default router;
