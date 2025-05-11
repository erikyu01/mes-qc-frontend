<template>
  <el-dialog
      :title="`${selectedForm?.label} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`"
      :model-value="visible"
      @update:modelValue="onClose"
      width="50%"
      @close="onClose"
  >
    <el-scrollbar max-height="500px">
      <!-- Render uncategorized -->
      <template v-if="groupedDetails.uncategorized && Object.keys(groupedDetails.uncategorized).length > 0">
      <el-descriptions :title="translate('FormDataSummary.recordTable.groupUncategorized')" border style="margin-top: 10px; margin-bottom: 10px">
          <el-descriptions-item
              v-for="(value, key) in groupedDetails.uncategorized"
              :key="key"
              :label="key"
          >
            {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- Render other grouped sections -->
      <template v-for="(fields, category) in groupedDetails" :key="category">
        <div v-if="category !== 'uncategorized'">
          <el-descriptions :title="category" border style="margin-top: 10px; margin-bottom: 10px">
            <el-descriptions-item
                v-for="(value, key) in fields"
                :key="key"
                :label="key"
            >
              {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>

      <el-descriptions :title="translate('FormDataSummary.recordTable.groupBasicInfo')" border style="margin-top: 10px">
        <el-descriptions-item label="涉及产品">{{ basicInfo.涉及产品 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="涉及批次">{{ basicInfo.涉及批次 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="质检人员">{{ basicInfo.质检人员 || " - " }}</el-descriptions-item>
        <el-descriptions-item label="所属班次">{{ basicInfo.所属班次 || " - " }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions :title="translate('FormDataSummary.recordTable.groupSystemInfo')" border style="margin-top: 10px">
        <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submitter')">{{ systemInfo.提交人 || " - " }}</el-descriptions-item>
        <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submittedAt')">{{ systemInfo.提交时间 || " - " }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="eSignature && eSignature.startsWith('data:image')" style="margin-top: 20px;">
        <h3>{{ translate('FormDataSummary.detailDialog.signatureTitle') }}</h3>
        <img :src="eSignature" alt="e-signature" style="width: 300px; height: auto;" />
      </div>
    </el-scrollbar>

    <template #footer>
      <el-button type="info" @click="onClose">{{ translate('FormDataSummary.detailDialog.cancelButton') }}</el-button>
      <el-button type="primary" @click="exportSubmissionLogToPdf">{{ translate('FormDataSummary.detailDialog.exportButton') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { translate } from '@/utils/i18n'
  const props = defineProps({
    visible: {
      type: Boolean, required: true
    },
    selectedForm: Object,
    groupedDetails: Object,
    basicInfo: Object,
    systemInfo: Object,
    eSignature: String
  })
  const emit = defineEmits(['close', 'export'])

  function onClose() {
    emit('close')
  }
  function exportSubmissionLogToPdf() {
    emit('export', {
      formLabel: props.selectedForm?.label || "-",
      groupedDetails: props.groupedDetails,
      basicInfo: props.basicInfo,
      systemInfo: props.systemInfo,
      eSignature: props.eSignature,
      translate
    });
  }

</script>
