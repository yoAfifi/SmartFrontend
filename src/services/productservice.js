
import { productApi } from './api'
import { showSuccessToast } from './api'

/**
 * Build a multipart/form‑data body.
 * @param {Object}   product   – plain JS object (name, price …)
 * @param {File[]}   files     – array (can be empty / undefined)
 */
function toFormData(product, files = []) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)],
        { type: 'application/json' }))

    files.forEach(f => fd.append('file', f))   // **note singular: "file"**
    return fd
}

/* ────────── CRUD ────────── */

export function createProduct(product, file) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    return productApi.post('', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
        showSuccessToast('Product created successfully!')
        return response
    })
}

export function getProductById(id) { 
    return productApi.get(`/${id}`) 
}

export function getAllProducts(params = {}) { 
    return productApi.get('', { params }) 
}

export function updateProduct(productId, product, file) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    return productApi.put(`/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => {
        showSuccessToast('Product updated successfully!')
        return response
    })
}

export function deleteProduct(id) { 
    return productApi.delete(`/${id}`).then(response => {
        showSuccessToast('Product deleted successfully!')
        return response
    })
}

export function reduceStock(id, qty) {
    return productApi.put(`/${id}/reduceStock`, null, { params: { quantity: qty } })
}

// Get product info for cart service
export function getProductInfo(id) {
    return productApi.get(`/${id}/info`)
}

// Get products by category
export function getProductsByCategory(categoryId) {
    return productApi.get('', { params: { categoryId } })
}

// Search products
export function searchProducts(query) {
    return productApi.get('', { params: { search: query } })
}
