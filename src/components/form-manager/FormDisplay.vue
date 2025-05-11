<template>
  <div v-if="formId">
    <div class="header-container">
      <div style="display: flex; align-items: center;">
        <h1 class="form-title" style="margin-right: 10px">{{ props.currentForm?.label || formTitle }}</h1>
        <el-switch
            v-model="enable_form"
            v-if="switchDisplayed"
            v-show="!props.accessByTeam"
            inline-prompt
            :active-text="translate('FormDisplay.available')"
            :inactive-text="translate('FormDisplay.unavailable')"
        />
      </div>

      <div>

      <template v-if="switchDisplayed" v-show="!props.accessByTeam">
        <el-button type="success" @click="openRecipeDrawer">
          设置警戒值
        </el-button>

        <el-button type="primary" v-if="switchDisplayed" @click="handleQuickDispatch">
          {{ translate('FormDisplay.quickDispatch') }}
        </el-button>
      </template>

<!--      <el-button type="success" v-if="props.accessByTeam" @click="openQcRecordsDialog" style="margin-left: 10px">-->
<!--        {{ translate('FormDataSummary.viewRecords') }}-->
<!--      </el-button>-->

        <el-button type="primary" v-if="props.accessByTeam" @click="qcRecordsDialogVisible = true" style="margin-left: 10px">
          {{ translate('FormDataSummary.viewRecords') }}
        </el-button>


      </div>

      <el-countdown
          v-if="remainingTime > 0"
          :value="countdownEndTime"
          format="HH:mm:ss"
      >
        <template #title>
          <span style="font-weight: bold; font-size: 15px">{{ translate('FormDisplay.countdownTitle') }}</span>
        </template>
      </el-countdown>

    </div>
    <el-scrollbar :height="scrollBarHeight" width="100%">
      <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef" />

      <div>

        <h4>表单基础项</h4>
        <!-- 通用字段：选择产品与批次 -->
        <div style="margin-top: 20px;">
          <el-form label-width="80px">
            <el-form-item label="涉及产品">
              <el-select
                    v-model="selectedProductCodes"
                    multiple
                    filterable
                    clearable
                    placeholder="选择产品"
                    style="width: 100%;"
                    :disabled="!(enable_form || enable_common_fields)"
                >
                  <el-option
                      v-for="item in productOptions"
                      :key="item.code"
                      :label="item.name"
                      :value="item.code"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <span>{{ item.name }}</span>
                      <div style="display: flex; align-items: center;">
                        <div>
                          <span style="color: var(--el-text-color-secondary); font-size: 13px;">
                            {{ item.code }}
                          </span>
                          <el-icon
                              class="edit-icon"
                              @click="handleEditProduct(item)"
                              @click.stop
                          >
                            <Edit />
                          </el-icon>
                          <el-popconfirm
                              title="确定删除此产品？"
                              confirm-button-text="删除"
                              cancel-button-text="取消"
                              @confirm="handleDeleteProduct(item.code)"
                              width="250"
                          >
                            <template #reference>
                              <el-icon
                                  class="delete-icon"
                                  @click.stop
                              >
                                <Close />
                              </el-icon>
                            </template>
                          </el-popconfirm>
                        </div>
                      </div>
                    </div>
                  </el-option>
                  <template #footer>
                    <el-button text bg size="small" @click="showAddProductDialog = true">添加新产品</el-button>
                  </template>
                </el-select>
            </el-form-item>

            <el-form-item label="涉及批次">
                  <el-select
                      v-model="selectedBatchCodes"
                      multiple
                      filterable
                      clearable
                      placeholder="选择批次"
                      style="width: 100%;"
                      :disabled="!(enable_form || enable_common_fields)"
                  >
                    <el-option
                        v-for="item in batchOptions"
                        :key="item.code"
                        :label="item.code"
                        :value="item.code"
                    >
                      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span style="color: var(--el-text-color-secondary); font-size: 13px;">
                          {{ item.code }}
                        </span>
                        <div>
                          <el-icon
                              class="edit-icon"
                              @click="handleEditBatch(item)"
                              @click.stop
                          >
                            <Edit />
                          </el-icon>
                          <el-popconfirm
                              title="确定删除此批次？"
                              confirm-button-text="删除"
                              cancel-button-text="取消"
                              @confirm="handleDeleteBatch(item.code)"
                              width="250"
                          >
                            <template #reference>
                              <el-icon
                                  class="delete-icon"
                                  @click.stop
                              >
                                <Close />
                              </el-icon>
                            </template>
                          </el-popconfirm>
                        </div>
                      </div>
                    </el-option>

                    <template #footer>
                      <el-button text bg size="small" @click="showAddBatchDialog = true">添加新批次</el-button>
                    </template>
                  </el-select>
                </el-form-item>

                <!-- 新增：质检人员 -->
                <el-form-item label="质检人员">
                  <el-select
                      v-model="selectedQcUserIds"
                      multiple
                      filterable
                      clearable
                      placeholder="选择质检人员"
                      style="width: 100%;"
                      :disabled="!(enable_form || enable_common_fields)"
                  >
                    <el-option
                        v-for="user in qcUsers"
                        :key="user.id"
                        :label="user.name"
                        :value="user.id"
                    />
                  </el-select>
                </el-form-item>

                <!-- 新增：所属班次 -->
                <el-form-item label="所属班次">
                  <el-select
                      v-model="selectedShift"
                      filterable
                      clearable
                      placeholder="选择班次"
                      style="width: 100%;"
                      :disabled="!(enable_form || enable_common_fields)"
                  >
                    <el-option
                        v-for="shift in shifts"
                        :key="shift.id"
                        :label="shift.name"
                        :value="shift.name"
                    />
                  </el-select>
                </el-form-item>
          </el-form>
        </div>

        <!-- 签名 Buttons and Display -->
        <div style="margin-bottom: 20px; text-align: left;">
          <el-button type="primary" @click="showSignaturePad = true" :disabled="!(enable_form || enable_common_fields)">
            {{ translate('FormDisplay.eSignature') }}
          </el-button>

          <el-button v-if="signatureData !== null" type="info" @click="handleSignatureClear" :disabled="!(enable_form || enable_common_fields)">
            {{ translate('FormDisplay.clearSignature') }}
          </el-button>
          <div v-if="signatureData" class="signature-preview">
            <img :src="signatureData" alt="签名图片" class="signature-image"/>
          </div>
        </div>

        <!-- 提交 和 重置 表单 Buttons (Right-Aligned) -->
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
          <el-button type="primary" v-if="props.usable || enable_form" @click="submitForm">
            {{ translate('FormDisplay.submit') }}
          </el-button>

          <el-button type="warning" v-if="props.usable || enable_form" @click="showClearConfirmation = true">
            {{ translate('FormDisplay.reset') }}
          </el-button>
        </div>

        <SignaturePadComponent
            v-if="showSignaturePad"
            :visible="showSignaturePad"
            @close="showSignaturePad = false"
            @save="handleSignatureSave"
            @clear="handleSignatureClear"
        />
      </div>

      <p class="node-id">Node ID: {{ props.currentForm?.id || 'Unneeded info for you' }}</p>
      <p class="node-id">QC Template Form ID: {{ props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId || 'N/A' }}</p>
    </el-scrollbar>

  </div>

  <el-dialog
      v-model="showQuickDispatch"
      :title="translate('FormDisplay.quickDispatchDialogTitle')"
      width="50%"
      @close="showQuickDispatch = false"
  >
    <QuickDispatch
        :visible.sync="showQuickDispatch"
        :qcFormTreeNodeId="props.currentForm?.id"
        @close="showQuickDispatch = false"
        @dispatch="handleDispatch"
    />
  </el-dialog>

  <el-dialog
      v-model="showConfirmation"
      :title="translate('FormDisplay.confirmSubmissionTitle')"
      width="30%"
      :before-close="cancelSubmission"
  >
    <span>{{ translate('FormDisplay.confirmSubmissionMessage') }}</span>
    <template #footer>
      <el-button @click="cancelSubmission">{{ translate('FormDisplay.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmission">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showResetConfirmation"
      :title="translate('FormDisplay.submissionSuccessTitle')"
      width="30%"
      :before-close="cancelReset"
  >
    <span>{{ translate('FormDisplay.submissionSuccessMessage') }}</span>
    <template #footer>
      <el-button @click="cancelReset">{{ translate('FormDisplay.no') }}</el-button>
      <el-button type="primary" @click="confirmReset">{{ translate('FormDisplay.yes') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showClearConfirmation"
      :title="translate('FormDisplay.resetConfirmTitle')"
      width="30%"
      :before-close="cancelClear"
  >
    <span>{{ translate('FormDisplay.resetConfirmMessage') }}</span>
    <template #footer>
      <el-button @click="cancelClear">{{ translate('FormDisplay.cancel') }}</el-button>
      <el-button type="warning" @click="confirmClear">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog
      v-model="showCountdownEnded"
      :title="translate('FormDisplay.countdownEndedTitle')"
      width="30%"
      :before-close="closeCountdownEnded"
  >
    <span>{{ translate('FormDisplay.countdownEndedMessage') }}</span>
    <template #footer>
      <el-button type="warning" @click="closeCountdownEnded">{{ translate('FormDisplay.confirm') }}</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showAddProductDialog" title="添加新产品" width="30%">
    <el-form label-width="80px">
      <el-form-item label="产品名称">
        <el-input v-model="newProduct.name" />
      </el-form-item>
      <el-form-item label="产品编码">
        <el-input v-model="newProduct.code" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="newProduct.description" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddProductDialog = false">取消</el-button>
      <el-button type="primary" @click="handleAddProduct">添加</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showAddBatchDialog" title="添加新批次" width="30%">
    <el-form label-width="80px">
      <el-form-item label="批次编码">
        <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
          <el-input v-model="newBatch.code" style="flex: 1;" />
          <el-switch
              v-model="autoGenerateBatchCode"
              inline-prompt
              active-text="自动"
              inactive-text="手动"
          />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddBatchDialog = false">取消</el-button>
      <el-button type="primary" @click="handleAddBatch">添加</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showEditProductDialog" title="编辑产品" width="30%">
    <el-form label-width="80px">
      <el-form-item label="产品名称">
        <el-input v-model="editProduct.name" />
      </el-form-item>
      <el-form-item label="产品编码">
        <el-input v-model="editProduct.code" disabled />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="editProduct.description" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditProductDialog = false">取消</el-button>
      <el-button type="primary" @click="handleUpdateProduct">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showEditBatchDialog" title="编辑批次" width="30%">
    <el-form label-width="80px">
      <el-form-item label="批次编码">
        <el-input v-model="editBatch.code" disabled />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditBatchDialog = false">取消</el-button>
      <el-button type="primary" @click="handleUpdateBatch">保存</el-button>
    </template>
  </el-dialog>

  <el-drawer
      v-model="showRecipeDrawer"
      title="设置警戒值"
      direction="ltr"
      size="100%"
      :with-header="true"
      :close-on-click-modal="false"
      :modal="false"
      id="recipe_setting"
  >
    <RecipeSetting :qcFormTemplateId="props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId" />

  </el-drawer>

<!--  <QcRecordsTable-->
<!--      v-if="props.accessByTeam"-->
<!--      :visible="qcRecordsDialogVisible"-->
<!--      :loading="loadingQcRecords"-->
<!--      :form-label="props.currentForm?.label"-->
<!--      :paginated-qc-records="qcRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)"-->
<!--      :displayed-column-headers="reorderedColumnHeaders"-->
<!--      :total="qcRecords.length"-->
<!--      v-model:visible="qcRecordsDialogVisible"-->
<!--      :shortcuts="[]"-->
<!--      :table-height="qcRecordsTableHeight"-->
<!--      @close="qcRecordsDialogVisible = false"-->
<!--      @page-change="currentPage = $event"-->
<!--  />-->

  <QcRecordsDialog
      v-model:visible="qcRecordsDialogVisible"
      :selectedForm="props.currentForm"
      :dateRange="[getStartOfMonth(), getEndOfMonth()]"
  />

</template>

<script setup>
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {ref, reactive, watch, onMounted, onUnmounted, nextTick, computed} from 'vue'
import {translate, translateWithParams} from "@/utils/i18n";
import { useStore } from 'vuex'
import {ElMessage} from 'element-plus'
import VFormRender from '@/components/form-render/index'
import { useRoute } from 'vue-router'
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data - original code
import api from '@/services/api'
import { fetchFormTemplate } from '@/services/qcFormTemplateService.js';
import { insertFormData } from '@/services/qcFormDataService.js';
import QuickDispatch from "@/components/dispatch/QuickDispatch.vue";
import {insertTaskSubmissionLog} from "@/services/qcTaskSubmissionLogsService";
import dayjs from 'dayjs';
import dispatchedTaskList from "@/components/dispatch/DispatchedTaskList.vue";
import QcRecordsTable from "@/components/tables/QcRecordsTable.vue";
import SignaturePadComponent from "@/components/form-manager/SignaturePad.vue";
import { windowMaskVisible } from '@/globals/mask'
const showEditProductDialog = ref(false);
const showEditBatchDialog = ref(false);
const editProduct = reactive({ id: null, name: '', code: '', description: '' });
const editBatch = reactive({ id: null, code: '' });
import { fetchUsers } from '@/services/userService'
import { getAllShifts } from '@/services/shiftService'
import QcRecordsDialog from "@/components/common/QcRecordsDialog.vue"

import soundEffect from '@/assets/sound_effect.mp3'; // Import your audio file
import RecipeSetting from "@/components/form-manager/RecipeSetting.vue";
import { fetchQcRecords } from "@/services/qcReportingService"; // make sure this is imported
// 通用submit功能导入
import {
  getAlActiveSuggestedProducts,
  createSuggestedProduct,
  deleteSuggestedProduct, updateSuggestedProduct
} from '@/services/production/suggestedProductService';
import {
  getAllActiveSuggestedBatches,
  createSuggestedBatch,
  deleteSuggestedBatch, updateSuggestedBatch
} from '@/services/production/suggestedBatchService';
import {Close, Edit} from "@element-plus/icons-vue";


const showRecipeDrawer = ref(false)
const qcRecordsDialogVisible = ref(false);
const qcRecords = ref([]);
const reorderedColumnHeaders = ref([]);
const loadingQcRecords = ref(true);
const currentPage = ref(1);
const pageSize = 15;

const qcUsers = ref([])
const selectedQcUserIds = ref([]) // 存储选择的质检人员 ID

const shifts = ref([])
const selectedShift = ref('') // 存储选择的班次名称

const route = useRoute()
const rt = ref(parseInt(route.query.rt, 10) || 0);
const showCountdownEnded = ref(false);

const showSignaturePad = ref(false);
const signatureData = ref(null);
const otherElementsHeight = 210;
const qcRecordsTableHeight = ref(window.innerHeight - otherElementsHeight);

// 通用字段
const productOptions = ref([]);
const batchOptions = ref([]);
const selectedProductCodes = ref([]);
const selectedBatchCodes = ref([]);

// 用于存储最终的ID值（从 code 映射而来）
const selectedProductIds = ref([]);
const selectedBatchIds = ref([]);
const selectedShiftId = ref(null);

const showAddProductDialog = ref(false);
const showAddBatchDialog = ref(false);
const newProduct = reactive({ name: '', code: '', description: '' });
const newBatch = reactive({ code: '' });
const autoGenerateBatchCode = ref(true);

const handleSignatureSave = (data) => {
  signatureData.value = data; // Save the base64 image data here
  showSignaturePad.value = false; // Close the signature pad after saving
};

const handleSignatureClear = () => {
  signatureData.value = null; // Clear the preview when cleared from the pad
};

const updateTableHeight = () => {
  qcRecordsTableHeight.value = window.innerHeight - otherElementsHeight;
};

const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
};

const getEndOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
};


const generateBatchCode = () => {
  const today = dayjs().format('YYMMDD');
  let counter = 1;
  let newCode = '';

  do {
    const padded = String(counter).padStart(3, '0');
    newCode = `GY${today}${padded}`;
    counter++;
  } while (batchOptions.value.some(b => b.code === newCode));

  return newCode;
};


// Countdown time setup
const remainingTime = ref(rt.value);
const countdownEndTime = computed(() => Date.now() + remainingTime.value * 1000);
let countdownInterval = null; // Store the interval ID

const props = defineProps({
  currentForm: {
    type: Object,
    required: true,
  },
  usable: {
    type: Boolean,
    default: true,
  },
  qcFormTemplateId: {
    type: String,
    required: false // Make it optional
  },
  dispatchedTaskId: {
    type: String,
    required: false // Make it optional
  },
  formSwitched: { // Add formSwitched prop to detect switching
    type: Boolean,
    default: false,
  },
  accessByTeam: {
    type: Number,
    required: false,
    default: null,
  }
});


/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
// const formJson = reactive(testFormJsonData) // Use the imported JSON data - original code
const formData = reactive({})
const optionData = reactive({})
const formTitle = ref(''); // Store form title
const enable_form = ref(false)
const enable_common_fields = ref(false)
let vFormRef = ref(null)
const emit = defineEmits(['updateIsDirty']);
let initialFormSnapshot = ''; // ⏱存储初始快照
const showQuickDispatch = ref(false);
const showConfirmation = ref(false);
const showResetConfirmation = ref(false);
const showClearConfirmation = ref(false);
const switchDisplayed = ref(
    !route.params.qcFormTemplateId
);

import { useDirtyCheck } from '@/composables/useDirtyCheck.js'
const { isDirty, startDirtyCheck, resetDirty, stopDirtyCheck } = useDirtyCheck(vFormRef, emit)

const cancelClear = () => {
  showClearConfirmation.value = false; // Cancel reset
};

const confirmClear = () => {
  showClearConfirmation.value = false; // Close the confirmation dialog
  if (vFormRef.value) {
    vFormRef.value.resetForm(); // Actually reset the form
    // clear the signature and
    signatureData.value = null;
    ElMessage.success(translate('FormDisplay.formClearedSuccess'))
  }
};

const closeCountdownEnded = () => {
  showCountdownEnded.value = false;
  setTimeout(() => {
    window.close();
  }, 300); // 给用户一点时间看到弹窗关闭
};

// ✅ Start or restart the countdown
const startCountdown = () => {
  // Clear any existing interval before starting a new one
  if (countdownInterval) clearInterval(countdownInterval);

  if (remainingTime.value > 0) {
    countdownInterval = setInterval(() => {
      remainingTime.value -= 1;
      if (remainingTime.value <= 0) {
        clearInterval(countdownInterval); // Stop countdown when it reaches zero
        showCountdownEnded.value = true;
      }
    }, 1000);
  }
};

// 通用字段
const fetchCommonFieldOptions = async () => {
  const productResp = await getAlActiveSuggestedProducts();
  const batchResp = await getAllActiveSuggestedBatches();
  productOptions.value = productResp.data || [];
  batchOptions.value = batchResp.data || [];
};

const fetchQcUsersAndShifts = async () => {
  try {
    const userResp = await fetchUsers()
    qcUsers.value = userResp.data.data || []

    const shiftResp = await getAllShifts()
    shifts.value = shiftResp.data.data || []
  } catch (err) {
    console.error('加载质检人员或班次失败:', err)
  }
}

const handleAddProduct = async () => {
  if (!newProduct.name || !newProduct.code) return;

  // 🔍 检查是否已存在相同 product code
  const exists = productOptions.value.some(p => p.code === newProduct.code);
  if (exists) {
    ElMessage.error(`产品编码 ${newProduct.code} 已存在，无法重复添加`);
    return;
  }

  try {
    await createSuggestedProduct({ ...newProduct, created_by: userId });
    await fetchCommonFieldOptions();
    selectedProductCodes.value.push(newProduct.code);
    ElMessage.success(`产品「${newProduct.name}」添加成功`);
    showAddProductDialog.value = false;
    Object.assign(newProduct, { name: '', code: '', description: '' });
  } catch (err) {
    console.error('添加产品失败:', err); // ⛔️ 后台问题或网络错误
    ElMessage.error(`产品「${newProduct.name}」添加失败，请重试`);
  }
};

const handleAddBatch = async () => {
  if (!newBatch.code) return;

  // 🔍 检查是否已存在相同 batch code
  const exists = batchOptions.value.some(b => b.code === newBatch.code);
  if (exists) {
    ElMessage.error(`批次编码 ${newBatch.code} 已存在，无法重复添加`);
    return;
  }

  try {
    await createSuggestedBatch({ ...newBatch, created_by: userId });
    await fetchCommonFieldOptions();
    selectedBatchCodes.value.push(newBatch.code);
    ElMessage.success(`批次 ${newBatch.code} 添加成功`);
    showAddBatchDialog.value = false;
    newBatch.code = '';
  } catch (err) {
    console.error('添加批次失败:', err); // ⛔️ 后台或网络错误
    ElMessage.error(`批次 ${newBatch.code} 添加失败，请重试`);
  }
};

// ✅ Watch `rt` in case it changes dynamically
watch(() => route.query.rt, (newRt) => {
  remainingTime.value = parseInt(newRt, 10) || 0;
  startCountdown(); // Restart the countdown if `rt` changes
}, { immediate: true });

watch(autoGenerateBatchCode, (newVal) => {
  if (newVal) {
    newBatch.code = generateBatchCode();
  } else {
    newBatch.code = '';
  }
});

watch(() => props.currentForm?.qcFormTemplateId, (newFormId, oldFormId) => {
  if (newFormId !== oldFormId) {
    // Clear signature data and disable the form when form is switched
    signatureData.value = null;
    enable_form.value = false;
    console.log("Form switched, signature data cleared and form disabled.");
  }
});

// 根据 selectedProductCodes 映射出 selectedProductIds
watch(selectedProductCodes, (codes) => {
  selectedProductIds.value = codes
      .map(code => productOptions.value.find(p => p.code === code)?.id)
      .filter(Boolean);
});

// 根据 selectedBatchCodes 映射出 selectedBatchIds
watch(selectedBatchCodes, (codes) => {
  selectedBatchIds.value = codes
      .map(code => batchOptions.value.find(b => b.code === code)?.id)
      .filter(Boolean);
});

// 根据 selectedShift 名称映射出 selectedShiftId
watch(selectedShift, (shiftName) => {
  selectedShiftId.value = shifts.value.find(s => s.name === shiftName)?.id || null;
});

// ✅ Ensure the countdown starts when mounted
onMounted(() => {
  fetchQcUsersAndShifts()
  if (props.accessByTeam) {
    enable_form.value = true; // Auto-enable
    switchDisplayed.value = false; // Hide switch
  }
  startCountdown();
  // 等待 DOM 渲染完成
  setTimeout(() => {
    const drawer = document.getElementById('recipe_setting');
    if (drawer && drawer.parentElement) {
      drawer.parentElement.style.width = '35%';
    }
  }, 0);

  // wait until the vFormRef is ready
  const waitUntilFormReady = setInterval(() => {
    if (vFormRef.value && typeof vFormRef.value.getFormData === 'function') {
      clearInterval(waitUntilFormReady)
      startDirtyCheck()
    }
  }, 100)
});

// ✅ Clean up the interval when unmounted
onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
});

// deal with qc records table height
onMounted(() => {
  updateTableHeight();
  window.addEventListener('resize', updateTableHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight);
});

const clearForm = () => {
  if (vFormRef.value) {
    vFormRef.value.resetForm(); // 调用 VFormRender 内部的 resetForm 方法
    ElMessage.success(translate('FormDisplay.formClearedSuccess'))

  }
};

const previewState = ref(true)
let formId = null

const store = useStore();
let userId = store.getters.getUser.id;

// dynamic size:
const scrollBarHeight = ref(`${window.innerHeight-140}px`);

const updateScrollBarHeight = () => {
  scrollBarHeight.value = `${window.innerHeight-140}px`;
};

const openRecipeDrawer = () => {
  const ready = props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId;
  if (!ready) {
    console.warn('配方尚未准备好，稍后重试...');
    return;
  }

  // 等待下一个 DOM tick，确保 RecipeSetting 能接收到 props
  nextTick(() => {
    showRecipeDrawer.value = true;
  });
};

onMounted(() => {
  startCountdown();
  window.addEventListener('resize', updateScrollBarHeight);
  updateScrollBarHeight();
  fetchCommonFieldOptions();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollBarHeight);
});

onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value) {
    ElMessageBox.confirm(
        '请查看可能未保存的更改，是否确定要离开？',
        '警告',
        {
          confirmButtonText: '离开',
          cancelButtonText: '取消',
          type: 'warning',
        }
    ).then(() => {
      next(); // 继续跳转
    }).catch(() => {
      next(false); // 取消跳转
    });
  } else {
    next();
  }
});

const handleDispatch = (data) => {
  console.log("Dispatched data:", data);
  // Add your API call or logic to handle the dispatched data
};

const submitForm = () => {
  showConfirmation.value = true; // Show confirmation popup before submitting
};

const cancelSubmission = () => {
  showConfirmation.value = false; // Close the popup without doing anything
};

const handleQuickDispatch = () => {
  console.log("Opening QuickDispatch dialog...");
  showQuickDispatch.value = true;
};

const handleDeleteProduct = async (code) => {
  try {
    const product = productOptions.value.find(p => p.code === code)
    if (!product) {
      ElMessage.error('找不到该产品，无法删除')
      return
    }

    await deleteSuggestedProduct(product.id) // 后端软删除

    // 更新本地状态
    productOptions.value = productOptions.value.filter(item => item.code !== code)
    selectedProductCodes.value = selectedProductCodes.value.filter(c => c !== code)

    ElMessage.success(`产品「${product.name}」(${product.code}) 已删除`)
  } catch (err) {
    ElMessage.error('产品删除失败，请重试')
    console.error('删除失败:', err)
  }
}

const handleDeleteBatch = async (code) => {
  try {
    const batch = batchOptions.value.find(b => b.code === code)
    if (!batch) {
      ElMessage.error('找不到该批次，无法删除')
      return
    }

    await deleteSuggestedBatch(batch.id)

    // 更新本地状态
    batchOptions.value = batchOptions.value.filter(item => item.code !== code)
    selectedBatchCodes.value = selectedBatchCodes.value.filter(c => c !== code)

    ElMessage.success(`批次「${batch.code}」已删除`)
  } catch (err) {
    ElMessage.error('批次删除失败，请重试')
    console.error('删除失败:', err)
  }
}

const confirmSubmission = async () => {
  showConfirmation.value = false; // Close the first popup before proceeding

  formId = props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId;
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, '0');
  let collectionName = `form_template_${formId}_${year}${month}`;

  try {
    const formData = await vFormRef.value.getFormData();

    // 添加关联信息字段到表单数据
    formData['related_product_ids'] = selectedProductIds.value;
    formData['related_batch_ids'] = selectedBatchIds.value;
    formData['related_inspector_ids'] = selectedQcUserIds.value;
    formData['related_shift_id'] = selectedShiftId.value;

    // 添加一条可读的字段，便于快速显示在 MongoDB 中查看和前端取数据
    const selectedProductNames = selectedProductCodes.value
        .map(code => productOptions.value.find(p => p.code === code)?.name)
        .filter(Boolean);

    const selectedInspectorNames = selectedQcUserIds.value
        .map(id => qcUsers.value.find(u => u.id === id)?.name)
        .filter(Boolean);

    const selectedShiftName = shifts.value.find(s => s.id === selectedShiftId.value)?.name || '';

    formData['related_products'] = selectedProductNames.join(', ');
    formData['related_batches'] = selectedBatchCodes.value.join(', ');
    formData['related_inspectors'] = selectedInspectorNames.join(', ');
    formData['related_shifts'] = selectedShiftName; // already a string, no .join()

    formData['e-signature'] = signatureData.value || null;

    // For debugging
    console.log("提交的数据 (key-value pairs):", formData);

    // Insert into MongoDB
    const response = await insertFormData(userId, collectionName, formData);
    console.log(response.data.object_id);

    const dispatchedTaskId = props.dispatchedTaskId || null;

    // Insert into PostgreSQL log
    const logResponse = await insertTaskSubmissionLog({
      submission_id: response.data.object_id,
      reviewed_at: null,
      reviewed_by: null,
      dispatched_task_id: dispatchedTaskId,
      qc_form_template_id: props.qcFormTemplateId,
      created_by: userId,
      status: 1
    });

    if (response.status === 200) {
      console.log(response.data);
      ElMessage.success(translate('FormDisplay.formSubmitSuccess'))
      showResetConfirmation.value = true; // Show second popup after success
      await resetDirty();
    } else {
      ElMessage.error(translate('FormDisplay.formSubmitError'))
    }
  } catch (error) {
    ElMessage.error(translate('FormDisplay.formSubmitError'))
  }
};

const cancelReset = () => {
  showResetConfirmation.value = false; // Close the second popup without clearing form
};

const confirmReset = () => {
  showResetConfirmation.value = false; // Close the second popup
  vFormRef.value.resetForm(); // Reset the form
};

const handleEditProduct = (product) => {
  Object.assign(editProduct, product);
  showEditProductDialog.value = true;
};

const handleEditBatch = (batch) => {
  Object.assign(editBatch, batch);
  showEditBatchDialog.value = true;
};

const handleUpdateProduct = async () => {
  try {
    await updateSuggestedProduct({ ...editProduct });
    await fetchCommonFieldOptions();
    ElMessage.success(`产品「${editProduct.name}」更新成功`);
    showEditProductDialog.value = false;
  } catch (err) {
    ElMessage.error('产品更新失败，请重试');
    console.error(err);
  }
};

const handleUpdateBatch = async () => {
  try {
    await updateSuggestedBatch({ ...editBatch });
    await fetchCommonFieldOptions();
    ElMessage.success(`批次「${editBatch.code}」更新成功`);
    showEditBatchDialog.value = false;
  } catch (err) {
    ElMessage.error('批次更新失败，请重试');
    console.error(err);
  }
};

// Watch the qcFormTemplateId in the passed currentForm
watch(
    () => props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId, // Safely access qcFormTemplateId
    async (newQcFormTemplateId) => {
      formId = newQcFormTemplateId

      try {
        const response = await fetchFormTemplate(formId); // Use service function
        if (response.status === 200 && response.data) {
          const templateJson = JSON.parse(response.data.data.form_template_json);
          formTitle.value = response.data.data.name
          vFormRef.value.setFormJson(templateJson); // Update the form JSON dynamically
          initialFormSnapshot = JSON.stringify(await vFormRef.value.getFormData());
          await nextTick();
          enable_common_fields.value = true;
          // when usable is false it will disable the forms as well as the common fields
          if (!props.usable && vFormRef.value) {
            vFormRef.value.disableForm();
            enable_common_fields.value = false;
          }
          ElMessage.success(translate('FormDisplay.formLoadSuccess'))
        } else {
          ElMessage.error(translate('FormDisplay.formLoadFailed'))
        }
      } catch (error) {
        console.error('Error fetching form template:', error);
        ElMessage.error(translate('FormDisplay.formLoadError'))
      }
    },
    { immediate: true } // Trigger immediately for the initial load
);

watch(enable_form, (newVal) => {
  if (newVal && vFormRef.value) {
    vFormRef.value.enableForm(); // Enable the form when switched on
  } else if (vFormRef.value) {
    vFormRef.value.disableForm(); // Disable the form when switched off
  }
});

const audio = new Audio(soundEffect);
// audio.play();

//
// watch(
//     () => route.params.switchDisplayed,
//     (newVal) => {
//       console.log("switchDisplayed");
//       console.log(switchDisplayed.value);
//       switchDisplayed.value = newVal ?? true;
//       console.log("route params");
//       console.log(route.params); // Print all parameters in the route
//       console.log("new val: " + newVal);
//       console.log("switchDisplayed after newVal");
//       console.log(switchDisplayed.value);
//     },
//     { immediate: true }
// );

// onMounted(() => {
//   if (props.qcFormTemplateId) {
//     console.log("qcFormTemplateId:", props.qcFormTemplateId);
//     fetchFormTemplate(props.qcFormTemplateId)
//         .then(async (response) => {
//           const formTemplateJson = JSON.parse(response.data.data.form_template_json);
//           console.log("formTemplateJson:", formTemplateJson);
//
//           // Wait for formTemplateJson to be available
//           await waitForCondition(() => formTemplateJson != null);
//
//           // Once available, set it to vFormRef
//           await nextTick();
//           vFormRef.value.setFormJson(formTemplateJson);
//         })
//         .catch((error) => {
//           console.error("Error fetching form template:", error);
//           ElMessage.error("加载表单模板时出错。");
//         });
//   }
// });
//
// // Utility function to wait for a condition
// async function waitForCondition(conditionFn, interval = 100, timeout = 5000) {
//   const start = Date.now();
//   while (!conditionFn()) {
//     if (Date.now() - start > timeout) {
//       throw new Error("Timeout while waiting for condition to be met.");
//     }
//     await new Promise((resolve) => setTimeout(resolve, interval));
//   }
// }

const openQcRecordsDialog = async () => {
  qcRecordsDialogVisible.value = true;
  loadingQcRecords.value = true;

  // TODO: remove the hardcoded datetime values
  const formTemplateId = props.currentForm?.qcFormTemplateId || route.params.qcFormTemplateId;
  const startDateTime = "2025-04-01 00:00:00";
  const endDateTime = "2025-05-01 23:59:59";

  try {
    const response = await fetchQcRecords(formTemplateId, startDateTime, endDateTime);
    qcRecords.value = response.data;

    if (qcRecords.value.length > 0) {
      let headers = Object.keys(qcRecords.value[0]);
      headers = headers.filter(h => h !== "_id" && h !== "created_by").map(h => h === "created_at" ? "提交时间" : h);
      headers.push("_id");
      reorderedColumnHeaders.value = headers;

      qcRecords.value = qcRecords.value.map(r => {
        if (r.created_at) {
          const localDate = new Date(r.created_at);
          r["提交时间"] = localDate.toLocaleString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
          }).replace(/\//g, "-");
          delete r.created_at;
        }
        return r;
      });
    }
  } catch (err) {
    console.error("Error fetching records:", err);
  } finally {
    loadingQcRecords.value = false;
  }
};


watch(remainingTime, (newTime) => {
  nextTick(() => {
    const countdownElement = document.querySelector(".el-statistic__number");
    if (countdownElement) {
      if (newTime <= 10 * 60) {
        countdownElement.style.color = "red"; // Danger
      } else if (newTime <= 30 * 60) {
        countdownElement.style.color = "#e6a23c"; // Warning (Orange)
      } else if (newTime <= 60 * 60) {
        countdownElement.style.color = "#409eff"; // Primary (Blue)
      } else {
        countdownElement.style.color = ""; // Reset to default
      }
    }
  });
});

watch(showRecipeDrawer, (val) => {
  windowMaskVisible.value = val
})

</script>

<style scoped>
  .form-title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .node-id {
    text-align: right;
    color: grey;
    font-size: 12px;
    margin-top: 20px;
  }

  .header-container {
    display: flex;
    justify-content: space-between; /* Align content to the edges */
    align-items: center; /* Center items vertically */
    padding: 0 20px; /* Optional: Add padding for spacing */
  }

  ::v-deep(.el-scrollbar__wrap--hidden-default) {
    scrollbar-width: thin !important; /* Override to allow normal scroll behavior */
  }

  ::v-deep(.el-scrollbar__wrap) {
    overflow-x: hidden !important; /* Ensure horizontal scrolling is hidden */
    box-sizing: border-box; /* Handle padding correctly */
    padding-top: 10px; /* Add space above the content */
    padding-left: 10px;
  }

  .signature-preview {
    margin-top: 20px;
  }

  .signature-image {
    width: 300px;
    border: 1px solid #ddd;
    margin-top: 10px;
  }

  .signature-clear-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    background: red;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    width: 24px;
    height: 24px;
  }

  .delete-icon {
    font-size: 16px;
    transition: transform 0.2s ease;
    margin-left: 8px;
    color: red;
    cursor: pointer;
  }

  .edit-icon {
    font-size: 16px;
    transition: transform 0.2s ease;
    margin-left: 8px;
    color: #409EFF;
    cursor: pointer;
  }

  .delete-icon:hover {
    transform: scale(1.4); /* 鼠标悬停放大 */
    color: #ff4d4f; /* 更鲜明的红色 */
  }

  .edit-icon:hover {
    transform: scale(1.4); /* 鼠标悬停放大 */
    color: rgb(51.2, 126.4, 204); /* 更鲜明的红色 */
  }

</style>

