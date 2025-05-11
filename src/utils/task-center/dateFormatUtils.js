/**
 * Formats a given date string to the format: YYYY-MM-DD HH:MM:SS (24-hour time).
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} - Formatted date string.
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0'); // 24-hour format
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converts a date range array [start, end] from local time to UTC ISO strings.
 * @param {[Date, Date]} dateRangeArray - Array with two Date objects.
 * @returns {string} - A string like "2025-12-01T00:00:00.000Z,2025-12-31T23:59:59.999Z"
 */
export function convertToUtcRange(dateRangeArray) {
    if (!Array.isArray(dateRangeArray) || dateRangeArray.length !== 2) return '';

    const [start, end] = dateRangeArray;
    const startUtc = new Date(start).toISOString(); // Convert local to UTC
    const endUtc = new Date(end).toISOString();     // Convert local to UTC
    return `${startUtc},${endUtc}`;
}

