import api from "../api"; // Use production API instance

const BASE_URL = "/suggested-batches";

/**
 * Fetch all active suggested batches (status = 1).
 * @returns {Promise} API response with active batches only.
 */
export const getAllActiveSuggestedBatches = () => {
    return api.get(`${BASE_URL}/active`);
};

/**
 * Fetch all suggested batches.
 * @returns {Promise} API response with the list of suggested batches.
 */
export const getAllSuggestedBatches = () => {
    return api.get(`${BASE_URL}`);
};

/**
 * Fetch a specific suggested batch by ID.
 * @param {number} id - The ID of the suggested batch.
 * @returns {Promise} API response with the batch details.
 */
export const getSuggestedBatchById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

/**
 * Fetch a suggested batch by code.
 * @param {string} code - The code of the suggested batch.
 * @returns {Promise} API response with the batch details.
 */
export const getSuggestedBatchByCode = (code) => {
    return api.get(`${BASE_URL}/code/${code}`);
};

/**
 * Create a new suggested batch.
 * @param {object} batch - The batch data.
 * @returns {Promise} API response after creation.
 */
export const createSuggestedBatch = (batch) => {
    return api.post(`${BASE_URL}`, batch);
};

/**
 * Update a suggested batch.
 * @param {object} batch - The updated batch data.
 * @returns {Promise} API response after update.
 */
export const updateSuggestedBatch = (batch) => {
    return api.put(`${BASE_URL}`, batch);
};

/**
 * Soft delete a suggested batch by ID.
 * @param {number} id - The ID of the batch to delete.
 * @returns {Promise} API response after soft delete.
 */
export const deleteSuggestedBatch = (id) => {
    return api.delete(`${BASE_URL}/${id}`);
};
