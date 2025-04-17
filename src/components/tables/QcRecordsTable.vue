<template>
  <el-dialog
      :model-value="visible"
      @update:model-value="(val) => emit('update:visible', val)"
      :title="`${formLabel} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`"
      fullscreen
  >
    <!-- Toolbar -->
    <div class="toolbar">
      <el-input
          v-model="searchQuery"
          :placeholder="translate('FormDataSummary.recordTable.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 500px"
      />

      <el-button type="success" style="margin-top: 0; margin-right: 20px" @click="$emit('export-to-excel')">
        {{ translate('FormDataSummary.recordTable.exportExcel') }}
      </el-button>

      <el-date-picker
          :model-value="props.modelValue"
          @update:model-value="(val) => emit('update:modelValue', val)"
          type="datetimerange"
          :shortcuts="shortcuts"
          :range-separator="translate('FormDataSummary.dateRangeSeparator')"
          :start-placeholder="translate('FormDataSummary.startPlaceholder')"
          :end-placeholder="translate('FormDataSummary.endPlaceholder')"
          @change="$emit('date-range-change', dateRange)"
      />
    </div>

    <!-- Table -->
    <el-table
        v-loading="loading"
        :data="paginatedQcRecords.filter(row => row.created_by === $store.getters.getUser.id)"
        :height="tableHeight"
        border
        style="width: 100%; white-space: nowrap;"
    >
      <el-table-column :label="translate('FormDataSummary.recordTable.groupSystemInfo')" label-class-name="group-header" fixed>
        <el-table-column prop="created_by" :label="translate('FormDataSummary.recordTable.submitter')" fixed="left" width="150" sortable>
          <template #default="scope">{{ scope.row['提交人'] }}</template>
        </el-table-column>

        <el-table-column prop="created_at" :label="translate('FormDataSummary.recordTable.submittedAt')" fixed="left" width="180" sortable>
          <template #default="scope">{{ formatClientTime(scope.row['提交时间']) }}</template>
        </el-table-column>

        <el-table-column prop="_id" :label="translate('FormDataSummary.recordTable.submissionId')" fixed="left" width="220" sortable>
          <template #default="scope">{{ scope.row._id }}</template>
        </el-table-column>
      </el-table-column>

      <el-table-column :label="translate('FormDataSummary.recordTable.groupQcDetails')" label-class-name="group-header">
        <el-table-column
            v-for="(header, index) in displayedColumnHeaders.filter(h => (h !== 'e-signature' && h !== '_id'))"
            :key="index"
            :prop="header"
            :label="header"
            sortable
            :width="150"
        />
      </el-table-column>

      <!-- Actions -->
<!--      <el-table-column :label="translate('FormDataSummary.recordTable.actions')" fixed="right" width="120">-->
<!--        <template #default="scope">-->
<!--          <el-link type="primary" @click="$emit('view-details', scope.row)">{{ translate('FormDataSummary.recordTable.view') }}</el-link>-->
<!--          <el-link type="danger" style="margin-left: 10px" @click="$emit('delete-record', scope.row)">{{ translate('FormDataSummary.recordTable.delete') }}</el-link>-->
<!--        </template>-->
<!--      </el-table-column>-->
    </el-table>

    <!-- Pagination -->
    <el-pagination
        v-if="total > 0"
        v-model:currentPage="currentPage"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="$emit('page-change', currentPage)"
    />

    <template #footer>
      <el-button type="primary" @click="$emit('close')">
        {{ translate('FormDataSummary.recordTable.closeButton') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { translate } from '@/utils/i18n';

const props = defineProps({
  modelValue: Array,
  visible: Boolean,
  loading: Boolean,
  formLabel: String,
  paginatedQcRecords: Array,
  displayedColumnHeaders: Array,
  total: Number,
  dateRange: Array,
  tableHeight: Number,
  shortcuts: Array,
});

const emit = defineEmits(['close', 'export-to-excel', 'view-details', 'delete-record', 'page-change', 'date-range-change']);
const searchQuery = ref('');
const currentPage = ref(1);

const formatClientTime = (utcDateTime) => {
  if (!utcDateTime) return '-';
  const utcDate = new Date(utcDateTime + 'Z');
  return utcDate.toLocaleString('zh-CN', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-header .cell {
  font-weight: bold !important;
  font-size: 16px;
  text-align: center;
}
</style>
