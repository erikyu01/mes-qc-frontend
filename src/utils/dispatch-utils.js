import dayjs from "dayjs";
import * as formNodeService from "@/services/formNodeService";
import {Base64} from "js-base64";
import {translate} from "@/utils/i18n";


// Extracts time in HH:mm format from different time structures
export function extractTimeOfDay(timeOfDay) {
    console.log("Received timeOfDay:", timeOfDay);

    if (!timeOfDay) {
        console.log("Returning null for missing timeOfDay");
        return null;
    }

    let date;

    if (timeOfDay instanceof Date) {
        date = timeOfDay;
    } else if (typeof timeOfDay === "string") {
        date = new Date(timeOfDay);
    } else if (timeOfDay._custom?.value) {
        date = new Date(timeOfDay._custom.value);
    } else {
        console.log("Invalid timeOfDay structure, returning null");
        return null;
    }

    const formattedTime = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    console.log("Extracted timeOfDay:", formattedTime);
    return formattedTime;
}

// Formats a date string into "YYYY-MM-DD HH:mm:ss"
export function formatDate(dateString) {
    if (!dateString) return "-";
    return dayjs(dateString).format("YYYY-MM-DD HH:mm:ss");
}

// Formats the schedule type into human-readable Chinese text
export function formatScheduleType(type) {
    switch (type) {
        case "regular":
            return translate('orderManagement.orderFormDialog.periodicPlan');
        case "custom":
            return translate('orderManagement.orderFormDialog.oneTimePlan');
        default:
            return translate('orderManagement.unknownPlan');
    }
}

export function generateFormMap(formNodes) {
    const formMap = {};

    function traverse(nodes) {
        nodes.forEach(node => {
            if (node.nodeType === "document") {
                formMap[node.id] = node.label;
            }
            if (node.children && node.children.length) {
                traverse(node.children);
            }
        });
    }

    traverse(formNodes);
    return formMap;
}

export function parseCronExpressionToChinese(cronExpression) {

    // Normalize to include seconds if missing
    const normalizedExpression = normalizeCronExpression(cronExpression);
    const parts = normalizedExpression.split(" ");
    const [second, minute, hour, day, month, weekday] = parts;
    const dayMap = {
        "0": "周日",
        "1": "周一",
        "2": "周二",
        "3": "周三",
        "4": "周四",
        "5": "周五",
        "6": "周六",
        "7": "周日", // Allow for both 0 and 7 as Sunday
    };

    // Helper function to parse ranges or lists
    const parseListOrRange = (value, unit) => {
        if (value === "*") return null;
        if (value.includes("-")) {
            const [start, end] = value.split("-").map(v => `${v}${unit}`);
            return `${start}-${end}`;
        }
        return value
            .split(",")
            .map(v => `${v}${unit}`)
            .join(", ");
    };

    const minuteText =
        minute === "*"
            ? "每分钟"
            : minute.startsWith("*/")
                ? `每${minute.slice(2)}分钟`
                : `第${parseListOrRange(minute, "分")}`;

    const hourText =
        hour === "*"
            ? "每小时"
            : hour.startsWith("*/")
                ? `每${hour.slice(2)}小时`
                : `第${parseListOrRange(hour, "时")}`;

    const dayText = day === "*" ? "" : `每月${day.split(",").join(",")}号`;

    const monthText =
        month === "*"
            ? ""
            : `每年${month.split(",").map(v => `${v}月`).join(",")}`;

    const weekdayText =
        weekday === "*"
            ? ""
            : weekday.includes("-")
                ? `每周${parseListOrRange(weekday, "")}`
                : `每周${weekday.split(",").map(v => dayMap[v.trim()] || `未知周${v.trim()}`).join(",")}`;

    // Combine parts with appropriate logic to remove redundancy
    const timeText = `${hourText}: ${minuteText}`;
    return [dayText, weekdayText, monthText, timeText]
        .filter(Boolean)
        .join(", ");
}

// Convert linux cron format to spring cron format by setting execute at 0 second
export function normalizeCronExpression(cronExpression) {
    return cronExpression.trim().split(" ").length === 5
        ? `0 ${cronExpression}` // Add "0" as the seconds field
        : cronExpression;
}

// Reverse spring cron format to linux cron format to match display component format.
export function unnormalizeCronExpression(cronExpression) {
    if (cronExpression != null) {
        return cronExpression.startsWith("0 ") ? cronExpression.substring(2) : cronExpression;
    }
}

export function calculateRemainingTime(date) {
    if (!date) return "-";

    const now = dayjs();
    const due = dayjs(date);
    const diffInSeconds = due.diff(now, "second"); // Use seconds for finer granularity

    if (diffInSeconds <= 0) return "已过期";

    const days = Math.floor(diffInSeconds / (60 * 60 * 24));
    const hours = Math.floor((diffInSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((diffInSeconds % (60 * 60)) / 60);
    const seconds = diffInSeconds % 60;

    if (days > 0) {
        return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
    } else if (hours > 0) {
        return `${hours} 小时 ${minutes} 分钟`;
    } else if (minutes > 0) {
        return `${minutes} 分钟 ${seconds} 秒`;
    } else {
        return `${seconds} 秒`;
    }
}

export function getQcOrderStateTagData(state) {
    const stateMap = {
        1: { label: translate('orderManagement.qcOrderState.active'), type: 'success' },
        2: { label: translate('orderManagement.qcOrderState.inactive'), type: 'info' },
        3: { label: translate('orderManagement.qcOrderState.allExpired'), type: 'danger' },
        4: { label: translate('orderManagement.qcOrderState.allLimitsReached'), type: 'warning' },
        5: { label: translate('orderManagement.qcOrderState.allPaused'), type: 'primary' },
        6: { label: translate('orderManagement.qcOrderState.invalid'), type: 'danger' },
    };
    return stateMap[state] || { label: translate('orderManagement.unknownState'), type: "default" };
}

export function getDispatchStateTagData(state) {
    const stateMap = {
        1: { label: translate('orderManagement.dispatchPlanState.running'), type: 'success' },
        2: { label: translate('orderManagement.dispatchPlanState.inactive'), type: 'info' },
        3: { label: translate('orderManagement.dispatchPlanState.expired'), type: 'danger' },
        4: { label: translate('orderManagement.dispatchPlanState.limitReached'), type: 'warning' },
        5: { label: translate('orderManagement.dispatchPlanState.paused'), type: 'primary' },
        6: { label: translate('orderManagement.dispatchPlanState.invalid'), type: 'danger' },
    };
    return stateMap[state] || { label: translate('orderManagement.unknownState'), type: "default" };
}

export async function openFormPreviewWindow(nodeId, vueInstance) {
    try {
        // Fetch the qc form template id asynchronously
        const response = await formNodeService.fetchFormNodesById(nodeId);
        const qcFormTemplateId = response.data?.qcFormTemplateId;

        if (!qcFormTemplateId) {
            console.error("Failed to fetch qcFormTemplateId for nodeId:", nodeId);
            vueInstance.$message.error("无法加载表单模板，请重试。");
            return;
        }

        const queryParams = {usable: false, switchDisplayed: false, dispatchedTaskId: null};

        // Construct the URL
        const newTabUrl = vueInstance.$router.resolve({
            name: 'FormDisplay',
            params: {qcFormTemplateId}, // Path parameter
            query: queryParams, // Encoded query
        }).href;

        // Open the URL in a new tab
        window.open(newTabUrl, '_blank');
    } catch (error) {
        console.error("Error fetching qcFormTemplateId for nodeId:", nodeId, error);
        vueInstance.$message.error("加载表单模板时出错，请稍后重试。");
    }
}

export const getCurrentLanguage = () => localStorage.getItem('app-language') || 'en-US';