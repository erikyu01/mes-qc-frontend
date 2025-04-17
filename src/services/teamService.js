import api from "./api";

const BASE_URL = "/teams";

/**
 * Fetch all teams.
 * @returns {Promise} API response with the list of all teams.
 */
export const getAllTeams = () => {
    return api.get(`${BASE_URL}`);
};

/**
 * Fetch a specific team by ID.
 * @param {number} id - The ID of the team.
 * @returns {Promise} API response with the team details.
 */
export const getTeamById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

/**
 * Create a new team.
 * @param {Object} teamData - The data for creating a new team.
 * @param {number} createdBy - The ID of the user creating the team.
 * @returns {Promise} API response with the created team details.
 */
export const createTeam = (teamData, createdBy) => {
    return api.post(`${BASE_URL}?createdBy=${createdBy}`, teamData);
};

/**
 * Update an existing team.
 * @param {number} id - The ID of the team to update.
 * @param {Object} teamData - The updated data for the team.
 * @param updatedBy
 * @returns {Promise} API response with the updated team details.
 */
export const updateTeam = (id, teamData, updatedBy) => {
    return api.put(`${BASE_URL}/${id}?updatedBy=${updatedBy}`, teamData);
};

/**
 * Deactivate a team (soft delete).
 * @param {number} id - The ID of the team to deactivate.
 * @param {number} updatedBy - The ID of the user performing the action.
 * @returns {Promise} API response with success or failure status.
 */
export const deactivateTeam = (id, updatedBy) => {
    return api.put(`${BASE_URL}/deactivate/${id}?updatedBy=${updatedBy}`);
};

/**
 * Activate an inactive team.
 * @param {number} id - The ID of the team to activate.
 * @param {number} updatedBy - The ID of the user performing the action.
 * @returns {Promise} API response with success or failure status.
 */
export const activateTeam = (id, updatedBy) => {
    return api.put(`${BASE_URL}/activate/${id}?updatedBy=${updatedBy}`);
};

/**
 * Hard delete a team.
 * @param {number} id - The ID of the team to delete.
 * @returns {Promise} API response with success or failure status.
 */
export const deleteTeam = (id) => {
    return api.delete(`${BASE_URL}/delete/${id}`);
};


/**
 * Fetch a team by the team lead ID.
 * @param {number} id - The ID of the team lead.
 * @returns {Promise} API response with the team details.
 */
export const getTeamByTeamLeadId = (id) => {
    return api.get(`${BASE_URL}/lead/${id}`);
};


/**
 * Fetch a list of all current team leader user IDs.
 * Useful for role-based filtering, permission assignment, or team setup validation.
 *
 * @returns {Promise} API response containing an array of user IDs who are team leaders.
 */
export const getCurrentLeaderIds = () => {
    return api.get(`${BASE_URL}/leaders`);
};
