import api from "./api";

const BASE_URL = "/calendar-assignment";

/**
 * Create a new calendar assignment.
 * @param {Object} assignmentData - CalendarAssignmentDTO data to create.
 * @returns {Promise} API response with the created calendar assignment.
 */
export const createCalendarAssignment = (assignmentData) => {
    return api.post(`${BASE_URL}`, assignmentData);
};

/**
 * Update an existing calendar assignment by ID.
 * @param {number} id - The ID of the calendar assignment.
 * @param {Object} assignmentData - Updated CalendarAssignmentDTO data.
 * @returns {Promise} API response with the updated calendar assignment.
 */
export const updateCalendarAssignment = (id, assignmentData) => {
    return api.put(`${BASE_URL}/${id}`, assignmentData);
};

/**
 * Soft delete a calendar assignment by ID and user ID.
 * @param {number} id - The ID of the calendar assignment.
 * @param {number} userId - The ID of the user performing the deletion.
 * @returns {Promise} API response with success or failure status.
 */
export const deleteCalendarAssignment = (id, userId) => {
    return api.delete(`${BASE_URL}/${id}`, {
        params: { userId },
    });
};

/**
 * Retrieve all active calendar assignments.
 * @returns {Promise} API response with the list of active calendar assignments.
 */
export const getAllCalendarAssignments = () => {
    return api.get(`${BASE_URL}`);
};

/**
 * Retrieve a calendar assignment by ID.
 * @param {number} id - The ID of the calendar assignment.
 * @returns {Promise} API response with the calendar assignment details.
 */
export const getCalendarAssignmentById = (id) => {
    return api.get(`${BASE_URL}/${id}`);
};

/**
 * Retrieve form tree filtered by team ID and date.
 * @param {number} teamId - The ID of the team.
 * @param {string} dateTimeISO - ISO 8601 formatted OffsetDateTime string.
 * @returns {Promise} API response with the filtered form tree.
 */
export const getFormTreeByTeamAndDate = (teamId, dateTimeISO) => {
    return api.get(`${BASE_URL}/form-tree`, {
        params: {
            teamId,
            date: dateTimeISO,
        },
    });
};