import api from "./api"; // Use production API instance

const BASE_URL = "/alert-records";

// /**
//  * Fetch a paginated list of alert records.
//  * @param {number} page - The page number (0-based).
//  * @param {number} size - Number of records per page.
//  * @returns {Promise} API response containing Page<DetailedAlertRecordDTO>
//  */
// export const getPaginatedAlertRecords = (page = 0, size = 10) => {
//     return api.get(`${BASE_URL}`, {
//         params: {
//             page,
//             size
//         }
//     });
// };

/**
 * Fetch a paginated list of alert records.
 * @param {Object} params - Query parameters for filtering and pagination.
 * @returns {Promise} API response containing Page<DetailedAlertRecordDTO>
 */
export function getPaginatedAlertRecords(params) {
    return api.post('/alert-records/filter', params);
}

/**
 * Fetch summary statistics for alert records (status, risk level, product, inspection item).
 * @returns {Promise} API response containing AlertSummaryDTO
 */
export const getAlertSummary = () => {
    return api.get(`${BASE_URL}/summary`);
};

/**
 * Fetch list of risk levels for dropdown.
 * @returns {Promise} API response containing RiskLevel[]
 */
export const getRiskLevels = () => {
    return api.get(`${BASE_URL}/risk-levels`);
};

/**
 * Fetch list of alert statuses for dropdown.
 * @returns {Promise} API response containing AlertStatus[]
 */
export const getAlertStatuses = () => {
    return api.get(`${BASE_URL}/alert-statuses`);
};


export const deleteAlertRecord = (id, userId) => {
    return api.delete(`/alert-records/${id}`, {
        params: { userId }
    });
};

export async function updateAlertRecord({ id, rpn, updatedBy }) {
    return api.post(`/alert-records/update-record`, {
        id,
        rpn,
        updatedBy
    });
}





