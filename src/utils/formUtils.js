/**
 * Parses full form document into grouped data and extracts e-signature
 * @param {Object} rawData - Full MongoDB document (response.data)
 * @returns {{ groupedDetails: Object, eSignature: string | null }}
 */
export function parseFormDocument(rawData) {
    const groupedDetails = {};
    let eSignature = null;

    const skipKeys = ["_id", "created_at", "created_by", "submissionId"];

    const safeClone = JSON.parse(JSON.stringify(rawData)); // Deep clone to avoid mutation

    for (const [key, value] of Object.entries(safeClone)) {
        if (skipKeys.includes(key)) continue;

        // Extract e-signature if exists
        if (value && typeof value === "object" && value["e-signature"]) {
            eSignature = value["e-signature"];
            delete value["e-signature"];
        }

        // Group as section (divider)
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            groupedDetails[key] = value;
        } else {
            if (!groupedDetails["uncategorized"]) groupedDetails["uncategorized"] = {};
            groupedDetails["uncategorized"][key] = value;
        }
    }

    return { groupedDetails, eSignature };
}
