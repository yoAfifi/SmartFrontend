import axios from 'axios'

// We only have a single base for the Gateway:
const gatewayBase = import.meta.env.VITE_API_BASE_URL

// Product API goes through the Gateway route /api/products
export const productApi = axios.create({
    baseURL: `${gatewayBase}/api/products`,
    headers: { 'Content-Type': 'application/json' }
})

// Order API goes through the Gateway route /api/orders
export const orderApi = axios.create({
    baseURL: `${gatewayBase}/api/orders`,
    headers: { 'Content-Type': 'application/json' }
})

// Customer API
export const customerApi = axios.create({
    baseURL: `${gatewayBase}/api/customers`,
    headers: { 'Content-Type': 'application/json' }
})

// Auth API
export const authApi = axios.create({
    baseURL: `${gatewayBase}/api/auth`,
    headers: { 'Content-Type': 'application/json' }
})

// Add request interceptor to include auth token
export const setupInterceptors = () => {
    const interceptor = (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    }

    productApi.interceptors.request.use(interceptor)
    orderApi.interceptors.request.use(interceptor)
    customerApi.interceptors.request.use(interceptor)
    // Don't add to authApi as login/register don't need auth
}

// Add response interceptor to handle auth errors
export const setupResponseInterceptors = () => {
    const responseInterceptor = (response) => {
        return response;
    };

    const errorInterceptor = (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                console.log('Authentication error: Unauthorized');
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else if (error.response.status === 403) {
                console.log('Authorization error: Forbidden', error.config.url);
                // For order history specifically, we'll handle this in the component
                if (error.config.url.includes('/api/orders/customer/')) {
                    return Promise.reject({
                        ...error,
                        message: 'You do not have permission to view these orders.'
                    });
                }
            }
        }
        return Promise.reject(error);
    };

    productApi.interceptors.response.use(responseInterceptor, errorInterceptor);
    orderApi.interceptors.response.use(responseInterceptor, errorInterceptor);
    customerApi.interceptors.response.use(responseInterceptor, errorInterceptor);
    authApi.interceptors.response.use(responseInterceptor, errorInterceptor);
};

// Initialize interceptors automatically
setupInterceptors();
setupResponseInterceptors();
