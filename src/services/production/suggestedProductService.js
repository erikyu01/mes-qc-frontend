import api from "../api"; // Use production API instance

const BASE_URL = "/suggested-products";

/**
 * Fetch all suggested products.
 * @returns {Promise} API response with the list of suggested products.
 */
export const getAlActiveSuggestedProducts = () => {
    return api.get(`${BASE_URL}/active`);
};

/**
 * Fetch all suggested products.
 * @returns {Promise} API response with the list of suggested products.
 */
export const getAllSuggestedProducts = () => {
    return api.get(`${BASE_URL}`);
};

/**
 * Fetch a specific suggested product by ID.
 * @param {number} id - The ID of the suggested product.
 * @returns {Promise} API response with the product details.
 */
export const getSuggestedProductById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

/**
 * Fetch a suggested product by code.
 * @param {string} code - The code of the suggested product.
 * @returns {Promise} API response with the product details.
 */
export const getSuggestedProductByCode = (code) => {
    return api.get(`${BASE_URL}/code/${code}`);
};

/**
 * Create a new suggested product.
 * @param {object} product - The product data.
 * @returns {Promise} API response after creation.
 */
export const createSuggestedProduct = (product) => {
    return api.post(`${BASE_URL}`, product);
};

/**
 * Update a suggested product.
 * @param {object} product - The updated product data.
 * @returns {Promise} API response after update.
 */
export const updateSuggestedProduct = (product) => {
    return api.put(`${BASE_URL}`, product);
};

/**
 * Soft delete a suggested product by ID.
 * @param {number} id - The ID of the product to delete.
 * @returns {Promise} API response after soft delete.
 */
export const deleteSuggestedProduct = (id) => {
    return api.delete(`${BASE_URL}/${id}`);
};
