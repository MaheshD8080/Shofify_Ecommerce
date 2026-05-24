/**
 * js/api.js — Shopify Backend API Integration Layer
 *
 * Toggle USE_BACKEND = true when the Spring Boot server is running.
 * All functions return Promises so site.js can await them uniformly
 * whether data comes from localStorage or the real REST API.
 *
 * Spring Boot REST endpoint mapping (for reference):
 *   POST   /api/auth/login          → { email, password, role }
 *   POST   /api/auth/signup         → { name, email, password, role }
 *   GET    /api/products            → list all approved products
 *   POST   /api/products            → create product (Seller JWT required)
 *   PUT    /api/products/{id}       → update product
 *   DELETE /api/products/{id}       → delete product
 *   PUT    /api/products/{id}/approve → approve product (Admin)
 *   GET    /api/orders              → all orders (Admin)
 *   GET    /api/orders/user/{id}    → orders for a user
 *   POST   /api/orders              → place order
 *   GET    /api/users               → all users (Admin)
 *   PUT    /api/users/{id}/status   → toggle user status (Admin)
 *   DELETE /api/users/{id}          → delete user (Admin)
 */

'use strict';

const API_BASE = 'http://localhost:8080/api';
const USE_BACKEND = false; // ← set true when Spring Boot is running

/* ---- Generic HTTP helpers ---- */

async function _request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = sessionStorage.getItem('sf_token');
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

const apiGet    = (path)        => _request('GET',    path);
const apiPost   = (path, body)  => _request('POST',   path, body);
const apiPut    = (path, body)  => _request('PUT',    path, body);
const apiDelete = (path)        => _request('DELETE', path);

/* ---- Public API surface used by site.js ---- */

/**
 * Attempt backend login; on failure (or when USE_BACKEND=false) fall back
 * to the localStorage store handled in site.js.
 */
async function backendLogin(email, password, role) {
  if (!USE_BACKEND) return null;
  return apiPost('/auth/login', { email, password, role });
}

async function backendSignup(name, email, password, role) {
  if (!USE_BACKEND) return null;
  return apiPost('/auth/signup', { name, email, password, role });
}

async function backendGetProducts() {
  if (!USE_BACKEND) return null;
  return apiGet('/products');
}

async function backendAddProduct(product) {
  if (!USE_BACKEND) return null;
  return apiPost('/products', product);
}

async function backendDeleteProduct(id) {
  if (!USE_BACKEND) return null;
  return apiDelete(`/products/${id}`);
}

async function backendApproveProduct(id) {
  if (!USE_BACKEND) return null;
  return apiPut(`/products/${id}/approve`);
}

async function backendGetOrders() {
  if (!USE_BACKEND) return null;
  return apiGet('/orders');
}

async function backendGetUserOrders(userId) {
  if (!USE_BACKEND) return null;
  return apiGet(`/orders/user/${userId}`);
}

async function backendPlaceOrder(order) {
  if (!USE_BACKEND) return null;
  return apiPost('/orders', order);
}

async function backendGetUsers() {
  if (!USE_BACKEND) return null;
  return apiGet('/users');
}

async function backendToggleUserStatus(id) {
  if (!USE_BACKEND) return null;
  return apiPut(`/users/${id}/status`);
}

async function backendDeleteUser(id) {
  if (!USE_BACKEND) return null;
  return apiDelete(`/users/${id}`);
}