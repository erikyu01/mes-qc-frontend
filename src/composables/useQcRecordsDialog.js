// useQcRecordsDialog.js
import { ref, nextTick } from "vue";
import { fetchQcRecords } from "@/services/qcReportingService";

export function useQcRecordsDialog() {
    const qcRecordsDialogVisible = ref(false);
    const loadingQcRecords = ref(false);
    const qcRecords = ref([]);
    const reorderedColumnHeaders = ref([]);

    async function loadRecords(formTemplateId, dateRange) {
        loadingQcRecords.value = true;

        console.log("🚀 Raw date range:", dateRange);
        const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
        const startDateTime = formatDate(dateRange[0]);
        const endDateTime = formatDate(dateRange[1]);

        try {
            const response = await fetchQcRecords(formTemplateId, startDateTime, endDateTime);
            qcRecords.value = response.data || [];

            if (qcRecords.value.length) {
                const headers = Object.keys(qcRecords.value[0])
                    .filter(h => h !== "_id" && h !== "created_by")
                    .map(h => (h === "created_at" ? "提交时间" : h));
                headers.push("_id");
                reorderedColumnHeaders.value = headers;

                qcRecords.value = qcRecords.value.map((r) => {
                    if (r.created_at) {
                        r["提交时间"] = new Date(r.created_at).toLocaleString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                        }).replace(/\//g, "-");
                        delete r.created_at;
                    }
                    return r;
                });
            }
        } catch (err) {
            console.error("Fetch QC Records Error:", err);
        } finally {
            loadingQcRecords.value = false;
        }
    }

    const openDialog = async (formTemplateId, dateRange) => {
        qcRecordsDialogVisible.value = true;
        await nextTick();

        const observer = new MutationObserver((mutations, obs) => {
            const groupHeaders = document.querySelectorAll(".group-header .cell");
            if (groupHeaders.length > 0) {
                groupHeaders.forEach((header) => {
                    header.style.fontWeight = "bold";
                    header.style.fontSize = "16px";
                    header.style.color = "#606266";
                });
                obs.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        await loadRecords(formTemplateId, dateRange);
    };

    const fetchRecordsData = async (formTemplateId, dateRange) => {
        await loadRecords(formTemplateId, dateRange);
        return qcRecords.value;
    };

    return {
        qcRecordsDialogVisible,
        loadingQcRecords,
        qcRecords,
        reorderedColumnHeaders,
        openDialog,
        fetchRecordsData,
    };
}
