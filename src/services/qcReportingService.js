import api from './api';

const BASE_URL = '/reporting';

/**
 * Extract widget data from the given JSON input.
 * @param {String} jsonInput - The JSON input containing widget data.
 * @returns {Promise} API response containing extracted widget data.
 */
export const extractWidgetData = (jsonInput) => {
    return api.post(`${BASE_URL}/extract`, jsonInput, {
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Extract widget data along with count statistics.
 * Converts startDateTime and endDateTime from local time to UTC before sending.
 * Logs the user's local timezone.
 * @param {Long} formTemplateId - The Form Template ID.
 * @param {String} startDateTime - Local datetime string in "YYYY-MM-DD HH:MM:SS".
 * @param {String} endDateTime - Local datetime string in "YYYY-MM-DD HH:MM:SS".
 * @returns {Promise} API response containing widget data with counts.
 */
// TODO: move this conversion to formatDate function such as the one in the FormDataSummary.vue
export const extractWidgetDataWithCounts = (formTemplateId, startDateTime, endDateTime) => {
    // Get the user's local timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const convertToUTC = (localDateTime) => {
        // Parse input datetime manually (Ensure it's treated as LOCAL time)
        const [datePart, timePart] = localDateTime.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);

        // Create a Date object in the **local timezone**
        const localDate = new Date(year, month - 1, day, hour, minute, second);

        // Fix: getTimezoneOffset() is in minutes and is negative for UTC-8, so we ADD it to team forward.
        const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

        // Ensure 24-hour format and return in "YYYY-MM-DD HH:MM:SS"
        const pad = (num) => String(num).padStart(2, "0");
        return `${utcDate.getFullYear()}-${pad(utcDate.getMonth() + 1)}-${pad(utcDate.getDate())} ` +
            `${pad(utcDate.getHours())}:${pad(utcDate.getMinutes())}:${pad(utcDate.getSeconds())}`;
    };

    const startDateTimeUTC = convertToUTC(startDateTime);
    const endDateTimeUTC = convertToUTC(endDateTime);

    console.log("User's Local Timezone:", userTimezone);
    console.log("extractWidgetDataWithCounts", formTemplateId, startDateTime, endDateTime, "->", startDateTimeUTC, endDateTimeUTC);

    return api.post(`${BASE_URL}/extract-with-counts`, {}, {
        params: { formTemplateId, startDateTime: startDateTimeUTC, endDateTime: endDateTimeUTC },
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Fetch QC records within a date range for a specific user.
 * Converts input datetime to UTC before querying.
 * @param {Long} formTemplateId - The Form Template ID.
 * @param {String} startDateTime - Local datetime in "YYYY-MM-DD HH:mm:ss" format.
 * @param {String} endDateTime - Local datetime in "YYYY-MM-DD HH:mm:ss" format.
 * @param {Number} createdBy - User ID who created the records.
 * @param {Number} [page=0] - Page number for pagination.
 * @param {Number} [size=1000] - Number of records per page.
 * @returns {Promise} API response filtered by createdBy.
 */
export const fetchQcRecordsByCreatedBy = (formTemplateId, startDateTime, endDateTime, createdBy, page = 0, size = 1000) => {
    const convertToUTC = (localDateTime) => {
        const [datePart, timePart] = localDateTime.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);
        const localDate = new Date(year, month - 1, day, hour, minute, second);
        const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
        const pad = (num) => String(num).padStart(2, "0");
        return `${utcDate.getFullYear()}-${pad(utcDate.getMonth() + 1)}-${pad(utcDate.getDate())} ` +
            `${pad(utcDate.getHours())}:${pad(utcDate.getMinutes())}:${pad(utcDate.getSeconds())}`;
    };

    const startDateTimeUTC = convertToUTC(startDateTime);
    const endDateTimeUTC = convertToUTC(endDateTime);

    return api.get(`${BASE_URL}/qc-records/by-user`, {
        params: { formTemplateId, startDateTime: startDateTimeUTC, endDateTime: endDateTimeUTC, createdBy, page, size },
        headers: { 'Content-Type': 'application/json' }
    });
};

/**
 * Fetch QC records within a given date range, with optional pagination.
 * @param {Long} formTemplateId - The Form Template ID.
 * @param {String} startDateTime - The start date-time in "YYYY-MM-DD HH:mm:ss" format.
 * @param {String} endDateTime - The end date-time in "YYYY-MM-DD HH:mm:ss" format.
 * @param {Number} [page=0] - The page number for pagination (optional).
 * @param {Number} [size=10] - The number of records per page (optional).
 * @returns {Promise} API response containing the QC records.
 */
export const fetchQcRecords = (formTemplateId, startDateTime, endDateTime, page = 0, size = 1000) => {
    // Convert local datetime to UTC using the same method
    const convertToUTC = (localDateTime) => {
        const [datePart, timePart] = localDateTime.split(" ");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);

        // Create a Date object in the **local timezone**
        const localDate = new Date(year, month - 1, day, hour, minute, second);

        // Convert to UTC
        const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

        // Format to "YYYY-MM-DD HH:mm:ss"
        const pad = (num) => String(num).padStart(2, "0");
        return `${utcDate.getFullYear()}-${pad(utcDate.getMonth() + 1)}-${pad(utcDate.getDate())} ` +
            `${pad(utcDate.getHours())}:${pad(utcDate.getMinutes())}:${pad(utcDate.getSeconds())}`;
    };

    // Convert input times
    const startDateTimeUTC = convertToUTC(startDateTime);
    const endDateTimeUTC = convertToUTC(endDateTime);

    console.log("fetchQcRecords", formTemplateId, startDateTime, endDateTime, "->", startDateTimeUTC, endDateTimeUTC);

    return api.get(`${BASE_URL}/qc-records`, {
        params: { formTemplateId, startDateTime: startDateTimeUTC, endDateTime: endDateTimeUTC, page, size },
        headers: { 'Content-Type': 'application/json' }
    });
};


/**
 * Generate and download QC report as a PDF.
 * @param {Object} reportData - The JSON object containing report details.
 */
export const generateQcReport = (reportData) => {
    const language = localStorage.getItem('app-language') || 'en-US';

    return api.post(`/generate?language=${language}`, reportData, {
        responseType: 'blob', // Ensures PDF is treated as binary data
        headers: { 'Content-Type': 'application/json' }
    }).then((response) => {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = reportData.qcFormName + '_report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch((error) => {
        console.error('Error generating QC report:', error);
    });
};

