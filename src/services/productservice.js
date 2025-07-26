
import { productApi } from './api'

/**
 * Build a multipart/form‑data body.
 * @param {Object}   product   – plain JS object (name, price …)
 * @param {File[]}   files     – array (can be empty / undefined)
 */
function toFormData(product, files = []) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)],
        { type: 'application/json' }))

    files.forEach(f => fd.append('files', f))   // **note plural: “files”**
    return fd
}

/* ────────── CRUD ────────── */

export function createProduct(product, file) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    return productApi.post('', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export function getProductById(id)    { return productApi.get(`/${id}`) }
export function getAllProducts()      { return productApi.get('')       }

export  function updateProduct(productId, product, file) {
    const fd = new FormData()
    fd.append('product', new Blob([JSON.stringify(product)], { type: 'application/json' }))
    if (file) fd.append('file', file)

    return productApi.put(`/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })}

export function deleteProduct(id)     { return productApi.delete(`/${id}`) }

export function reduceStock(id, qty)  {
    return productApi.patch(`/${id}/reduceStock`, null, { params:{ quantity:qty } })
}
