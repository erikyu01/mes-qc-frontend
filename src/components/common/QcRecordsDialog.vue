<template>
  <el-dialog
      :model-value="props.visible"
      fullscreen
      :title="`${selectedForm?.label} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`"
      @update:modelValue="$emit('update:visible', $event)"
  >
    <QcRecordsTable
        :records="paginatedRecords"
        :headers="displayedHeaders"
        :search="search"
        :dateRange="props.dateRange"
        :loading="localLoading"
        :tableHeight="tableHeight"
        @view-details="viewDetails"
        @delete="deleteRecord"
        @export-excel="exportRecordsToExcel"
        @update:dateRange="handleDateRangeChange"
        @update:search="search = $event"
        @current-change="currentPage = $event"
    />

    <QcRecordDetailDialog
        v-if="dialogVisible"
        :visible="dialogVisible"
        :selectedForm="selectedForm"
        :groupedDetails="groupedDetails"
        :basicInfo="basicInfo"
        :systemInfo="systemInfo"
        :eSignature="eSignature"
        @export="exportSubmissionLogToPdf"
        @close="dialogVisible = false"
    />

<!--    <el-pagination-->
<!--        v-if="filteredRecords.length"-->
<!--        v-model:current-page="currentPage"-->
<!--        :page-size="pageSize"-->
<!--        :total="filteredRecords.length"-->
<!--        layout="total, prev, pager, next"-->
<!--    />-->

    <template #footer>
      <el-button type="primary" @click="$emit('update:visible', false)">
        {{ translate('FormDataSummary.recordTable.closeButton') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import QcRecordsTable from "./qc/QcRecordsTable.vue";
import {translate, translateWithParams} from "@/utils/i18n";
import QcRecordDetailDialog from "@/components/common/qc/QcRecordDetailDialog.vue";
import {deleteTaskSubmissionLog, getMyDocument} from "@/services/qcTaskSubmissionLogsService";
import {getUserById} from "@/services/userService";
import {parseFormDocument} from "@/utils/formUtils";
import {computed, nextTick, ref, watch} from "vue";
import {exportQcRecordsToExcel, exportSubmissionLogToPdf} from "@/utils/exportUtils";
import {ElMessage, ElMessageBox} from "element-plus";
import {useQcRecordsDialog} from "@/composables/useQcRecordsDialog";
const {
  fetchRecordsData,
} = useQcRecordsDialog();

const dialogVisible = ref(false);
const groupedDetails = ref({});
const basicInfo = ref({});
const systemInfo = ref({});
const eSignature = ref(null);
const localRecords = ref([]);
const localLoading = ref(false);
const search = ref('');
const tableHeight = ref(window.innerHeight - 220);
const headers = ref([]);
const currentPage = ref(1);
const pageSize = 15;

const props = defineProps({
  visible: Boolean,
  selectedForm: Object,
  dateRange: Array
});

defineEmits(["update:visible"])

const filteredRecords = computed(() => {
  if (!search.value) return localRecords.value;
  return localRecords.value.filter(record =>
      Object.values(record).some(val =>
          String(val).toLowerCase().includes(search.value.toLowerCase())
      )
  );
});

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredRecords.value.slice(start, end);
});

const displayedHeaders = computed(() => headers.value);

function formatClientTime(utcDateTime) {
  if (!utcDateTime) return "-";
  const utcDate = new Date(utcDateTime + "Z"); // Ensure UTC interpretation
  return utcDate.toLocaleString("zh-CN", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).replace(/\//g, "-");
}

async function openDetailsDialog(row) {
  try {
    const createdAt = new Date(row["提交时间"]);
    const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
    const collectionName = `form_template_${props.selectedForm.qcFormTemplateId}_${yearMonth}`;
    const response = await getMyDocument(row._id, props.selectedForm.qcFormTemplateId, row.created_by, collectionName);
    const rawData = response.data;

    basicInfo.value = {
      涉及产品: rawData.uncategorized.related_products,
      涉及批次: rawData.uncategorized.related_batches,
      质检人员: rawData.uncategorized.related_inspectors,
      所属班次: rawData.uncategorized.related_shifts
    };

    systemInfo.value = {
      提交单号: row._id,
      提交时间: new Date(rawData.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(rawData.created_by).then(res => res.data?.data?.name || "-")
    };

    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(rawData);
    groupedDetails.value = grouped;
    eSignature.value = signature;
    dialogVisible.value = true;
  } catch (err) {
    console.error("Error in openDetailsDialog:", err);
  }
}

async function deleteRecord(row) {
  try {
    await ElMessageBox.confirm(
        translateWithParams("FormDataSummary.recordTable.deleteConfirmMessage", { id: row._id }),
        translate("FormDataSummary.recordTable.deleteConfirmTitle"),
        {
          confirmButtonText: translate("common.confirm"),
          cancelButtonText: translate("common.cancel"),
          type: "warning"
        }
    );
    await deleteTaskSubmissionLog(row._id, props.selectedForm.qcFormTemplateId, row["提交时间"]);
    ElMessage.success(translate("FormDataSummary.recordTable.deleteSuccess"));
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(translate("FormDataSummary.recordTable.deleteFailed"));
    }
  }
}

async function viewDetails(row) {
  try {
    // 1. Build MongoDB collection name
    const createdAt = new Date(formatClientTime(row['提交时间']));
    const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
    const inputCollectionName = `form_template_${props.selectedForm.qcFormTemplateId}_${yearMonth}`;

    // 2. Fetch form document
    const response = await getMyDocument(row._id, props.selectedForm.qcFormTemplateId, row.created_by, inputCollectionName);
    const rawData = response.data;

    // 3. Store meta info
    let selectedDetails = { ...rawData, submissionId: row._id };

    // 4. Resolve system fields
    systemInfo.value = {
      提交单号: selectedDetails.submissionId,
      提交时间: new Date(selectedDetails.created_at).toLocaleString("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false
      }),
      提交人: await getUserById(selectedDetails.created_by).then(res => res.data?.data?.name || "-")
    };

    // TODO: add a basicInfo field includes the 4 fields: 涉及产品，涉及批次，质检人员，所属班次
    basicInfo.value = {
      涉及产品: selectedDetails.uncategorized.related_products,
      涉及批次: selectedDetails.uncategorized.related_batches,
      质检人员: selectedDetails.uncategorized.related_inspectors,
      所属班次: selectedDetails.uncategorized.related_shifts
    };

    // // add dummy data first
    // this.basicInfo = {
    //   涉及产品: '土豆条, 红薯球',        // dummy product names
    //   涉及批次: 'BATCH20240401, BATCH20240402',   // dummy batch codes
    //   质检人员: '张三, 李四, 王五',              // dummy inspector names
    //   所属班次: 'A班, B班'                       // dummy shifts
    // };

    // 5. Parse document
    const { groupedDetails: grouped, eSignature: signature } = parseFormDocument(selectedDetails);

    // 5.1 Remove all "related_" fields from 'uncategorized'
    if (grouped.uncategorized) {
      for (const key of Object.keys(grouped.uncategorized)) {
        if (key.startsWith("related_")) {
          delete grouped.uncategorized[key];
        }
      }
    }

    groupedDetails.value = grouped;
    eSignature.value = signature;

    // 6. Open dialog
    dialogVisible.value = true;

  } catch (err) {
    console.error("Error fetching document details:", err);
  }
}

function exportRecordsToExcel() {
  if (!filteredRecords.value.length) {
    ElMessage.warning(translate("FormDataSummary.messages.noExcelData"));
    return;
  }

  exportQcRecordsToExcel({
    records: filteredRecords.value, // ✅ 仅导出当前搜索过滤后的数据
    label: props.selectedForm.label,
    translate
  });

  ElMessage.success(translate("FormDataSummary.messages.exportExcelSuccess"));
}

async function handleDateRangeChange(dateRange) {
  if (!dateRange || dateRange.length !== 2) return;
  const formTemplateId = props.selectedForm?.qcFormTemplateId;

  localLoading.value = true;
  try {
    localRecords.value = await fetchRecordsData(formTemplateId, dateRange);
    console.log("🟢 QcRecordsDialog handleDateRangeChange:", localRecords.value);
  } catch (error) {
    console.error("❌ Failed to fetch records:", error);
  } finally {
    localLoading.value = false;
  }
}

watch(() => props.visible, async (val) => {
  if (val && props.selectedForm && props.dateRange?.length === 2) {
    localLoading.value = true;
    try {
      const formTemplateId = props.selectedForm.qcFormTemplateId;
      const result = await fetchRecordsData(formTemplateId, props.dateRange);

      // Normalize related_* fields for table display
      localRecords.value = result.map(item => ({
        ...item,
        related_products: item.related_products || item.uncategorized?.related_products || "-",
        related_batches: item.related_batches || item.uncategorized?.related_batches || "-",
        related_inspectors: item.related_inspectors || item.uncategorized?.related_inspectors || "-",
        related_shifts: item.related_shifts || item.uncategorized?.related_shifts || "-"
      }));

      localRecords.value = result;

      // ✅ Step 1: 先过滤掉不需要展示的字段
      let fields = Object.keys(result[0]);
      fields = fields.filter(key => !['_id', 'created_by', 'e-signature', '提交时间', '提交人'].includes(key)); // filter some system fields
      fields = fields.filter(key => !key.startsWith('related_')); // remove all related_* fields
      // ✅ Step 2: 替换字段名（如 created_at ➝ 提交时间）
      // fields = fields.map(key => key === 'created_at' ? '提交时间' : key);

      // ✅ Step 3: push this to the last column
      fields.push('_id');

      headers.value = fields;

    } finally {
      localLoading.value = false;
    }
  }
});


</script>
