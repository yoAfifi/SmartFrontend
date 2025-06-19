// src/services/productService.js

import { productApi } from './api'

// Create a new product
export function createProduct(productData) {
    return productApi.post('', productData)
}

// Retrieve a single product by ID
export function getProductById(productId) {
    return productApi.get(`/${productId}`)
}

// Retrieve all products
export function getAllProducts() {
    console.log('Fetching all products...');
    return productApi.get('')
}

// Update an existing product
export function updateProduct(productId, productData) {
    return productApi.put(`/${productId}`, productData)
}

// Delete a product
export function deleteProduct(productId) {
    return productApi.delete(`/${productId}`)
}

// Reduce product stock
export function reduceStock(productId, quantity) {
    // Using Axios patch with query parameters for 'quantity'
    return productApi.patch(`/${productId}/reduceStock`, null, {
        params: { quantity }
    })
}
