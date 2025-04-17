<template>
  <el-skeleton v-if="loading" :rows="6" animated />
  <div class="setting-container">
<!--    <h2 class="title">设置配方警戒值</h2>-->
    <el-card
        v-for="(item, key) in controlLimits"
        :key="key"
        class="limit-card"
        @mouseenter="highlightField(item.label); logCardRight(item.label)"
        @mouseleave="removeHighlightField(item.label)"
    >
      <span class="border-anim top"></span>
      <span class="border-anim right"></span>
      <span class="border-anim bottom"></span>
      <span class="border-anim left"></span>
      <div class="row" style="justify-content: space-evenly">
        <div class="key-name">{{ item.label }}</div>

        <div class="input-group">
          <div class="input-label">上限</div>
          <el-input-number
              v-model="item.upper_control_limit"
              :min="item.lower_control_limit"
              :step="0.1"
              controls-position="right"
              class="input"
              :precision="2"
              placeholder="上限"
          />
          <div style="width: 100%; text-align: center;">
            <span
                v-if="item.upper_control_limit !== originalControlLimits[key]?.upper_control_limit"
                class="original-value"
            >
              原始值：{{ originalControlLimits[key]?.upper_control_limit }}
            </span>
          </div>
        </div>

        <div class="input-group">
          <div class="input-label">下限</div>
          <el-input-number
              v-model="item.lower_control_limit"
              :max="item.upper_control_limit"
              :step="0.1"
              controls-position="right"
              class="input"
              :precision="2"
              placeholder="下限"
          />
          <div style="width: 100%; text-align: center;">
            <span
                v-if="item.lower_control_limit !== originalControlLimits[key]?.lower_control_limit"
                class="original-value"
            >
              原始值：{{ originalControlLimits[key]?.lower_control_limit }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <div style="margin-top: 20px; text-align: center;">
      <el-button type="primary" @click="saveSettings">保存</el-button>
      <el-button type="warning" @click="resetToOriginal" style="margin-left: 12px;">重置</el-button>
    </div>

  </div>

  <el-dialog
      v-model="showSaveConfirm"
      title="确认保存"
      width="30%"
      :before-close="() => (showSaveConfirm.value = false)"
  >
    <span>是否确定保存当前配方警戒值？</span>
    <template #footer>
      <el-button @click="showSaveConfirm.value = false">取消</el-button>
      <el-button type="primary" @click="pendingSave && pendingSave()">确认</el-button>
    </template>
  </el-dialog>

</template>

<script setup>
import { nextTick, reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { windowMaskVisible } from '@/globals/mask'
import { leftHoverDotPoint, rightHoverDotPoint } from '@/globals/line'
import { fetchControlLimitsByTemplateId, updateControlLimits  } from '@/services/recipeService'

const showSaveConfirm = ref(false);
const loading = ref(false)
let pendingSave = null;


const props = defineProps({
  qcFormTemplateId: {
    type: [String, Number],
    required: true
  }
})

watch(
    () => props.qcFormTemplateId,
    async (newId) => {
      if (newId) {
        console.log('[RecipeSetting] qcFormTemplateId changed →', newId)
        await fetchData(newId)
      }
    },
    { immediate: true }
)

// This deal with the initial click on the setting button
onMounted(() => {
  fetchData(props.qcFormTemplateId)
})

const controlLimits = reactive({})
const originalControlLimits = reactive({})

const fetchData = async (templateId) => {
  loading.value = true
  try {

    // Clear old keys before loading new ones
    for (const key in controlLimits) {
      delete controlLimits[key];
    }

    const response = await fetchControlLimitsByTemplateId(templateId)
    const data = response.data?.data.control_limits
    if (data) {
      Object.keys(data).forEach(key => {
        // Editable reactive value
        controlLimits[key] = {
          upper_control_limit: data[key].upper_control_limit,
          lower_control_limit: data[key].lower_control_limit,
          label: data[key].label || 'No Label'
        }

        // Copy for original comparison
        originalControlLimits[key] = {
          upper_control_limit: data[key].upper_control_limit,
          lower_control_limit: data[key].lower_control_limit
        }
      })
    }
  } catch (error) {
    console.error('Error fetching control limits:', error)
    ElMessage.error('获取配方警戒值失败')
  } finally {
    loading.value = false
  }
}

const saveSettings = () => {
  showSaveConfirm.value = true

  pendingSave = async () => {
    loading.value = true
    try {
      const payload = {
        qc_form_template_id: props.qcFormTemplateId,
        control_limits: {}
      }

      for (const key in controlLimits) {
        payload.control_limits[key] = {
          upper_control_limit: controlLimits[key].upper_control_limit,
          lower_control_limit: controlLimits[key].lower_control_limit,
          label: controlLimits[key].label
        }
      }

      await updateControlLimits(payload)
      ElMessage.success('配方警戒值已保存！')

      // refetch 并更新 originalControlLimits
      await fetchData(props.qcFormTemplateId)
    } catch (err) {
      console.error('更新失败', err)
      ElMessage.error('保存失败，请重试')
    } finally {
      showSaveConfirm.value = false
      loading.value = false
    }
  }
}

const highlightField = (key) => {
  const allFields = document.querySelectorAll('.field-wrapper');

  allFields.forEach(field => {
    const label = field.querySelector('.el-form-item__label')?.innerText?.trim();
    if (label === key) {
      console.log(`[HIGHLIGHT] match: ${label}`);
      field.classList.add('highlighted-field');

      const el = field.querySelector('.el-form-item');
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top + rect.height / 2;
        rightHoverDotPoint.value = { x, y };
        console.log(`[右字段] ${key} 坐标为`, { x, y });
      }
    }
  });
};

const removeHighlightField = (key) => {
  const allFields = document.querySelectorAll('.field-wrapper');

  allFields.forEach(field => {
    const label = field.querySelector('.el-form-item__label')?.innerText?.trim();
    if (label === key) {
      field.classList.remove('highlighted-field');
    }
  });

  leftHoverDotPoint.value = null
  rightHoverDotPoint.value = null
};

const logCardRight = (key) => {
  nextTick(() => {
    const allCards = document.querySelectorAll('.limit-card')
    allCards.forEach(card => {
      const title = card.querySelector('.key-name')?.innerText?.trim()
      if (title === key) {
        const rect = card.getBoundingClientRect()
        console.log(`[坐标] 卡片 ${key} → right: ${rect.right}, topCenter: ${rect.top + rect.height / 2}`)
        const x = rect.right
        const y = rect.top + rect.height / 2

        leftHoverDotPoint.value = { x, y }
      }
    })
  })
}

const resetToOriginal = () => {
  for (const key in originalControlLimits) {
    if (controlLimits[key]) {
      controlLimits[key].upper_control_limit = originalControlLimits[key].upper_control_limit
      controlLimits[key].lower_control_limit = originalControlLimits[key].lower_control_limit
    }
  }
  ElMessage.success('已重置为原始值')
}

</script>


<style scoped>
.setting-container {
  padding: 20px;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

/* add special effect */
/*
.border-anim {
  position: absolute;
  border-radius: 100vmax;
  pointer-events: none;
  z-index: 10;
}

.top {
  top: 0;
  left: 0;
  width: 0;
  height: 3px;
  background: linear-gradient(
      90deg,
      transparent 50%,
      rgba(255, 49, 49, 0.5),
      rgb(255, 49, 49)
  );
  animation: animateTop 2s ease-in-out infinite;
}

.bottom {
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(
      90deg,
      rgb(57, 255, 20),
      rgba(57, 255, 20, 0.5),
      transparent 50%
  );
  animation: animateBottom 2s ease-in-out infinite;
}

.right {
  top: 0;
  right: 0;
  width: 3px;
  height: 0;
  background: linear-gradient(
      180deg,
      transparent 30%,
      rgba(0, 255, 255, 0.5),
      rgb(0, 255, 255)
  );
  animation: animateRight 2s ease-in-out infinite;
}

.left {
  left: 0;
  bottom: 0;
  width: 3px;
  height: 0;
  background: linear-gradient(
      180deg,
      rgb(255, 255, 113),
      rgba(255, 255, 113, 0.5),
      transparent 70%
  );
  animation: animateLeft 2s ease-in-out infinite;
}

@keyframes animateTop {
  25% {
    width: 100%;
    opacity: 1;
  }
  30%, 100% {
    opacity: 0;
  }
}

@keyframes animateBottom {
  0%, 50% {
    opacity: 0;
    width: 0;
  }
  75% {
    opacity: 1;
    width: 100%;
  }
  76%, 100% {
    opacity: 0;
  }
}

@keyframes animateRight {
  0%, 25% {
    opacity: 0;
    height: 0;
  }
  50% {
    opacity: 1;
    height: 100%;
  }
  55%, 100% {
    height: 100%;
    opacity: 0;
  }
}

@keyframes animateLeft {
  0%, 75% {
    opacity: 0;
    bottom: 0;
    height: 0;
  }
  100% {
    opacity: 1;
    height: 100%;
  }
}

*/

/*
.limit-card {
  position: relative;
  overflow: hidden;
}
*/

.limit-card {
  margin-bottom: 10px;
  padding: 10px;
}

.row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.key-name {
  width: 120px;
  font-weight: 500;
  font-size: 14px;
  padding-top: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.input-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
  margin-left:45px;
}

.input {
  width: 120px;
}

.limit-card:hover {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 12px 36px rgba(64, 158, 255, 0.5);
  transition: all 0.25s ease;
}

:global(.highlighted-field .el-form-item) {
  border: 1px solid var(--el-color-primary);
  box-shadow: 0 6px 12px rgba(64, 158, 255, 0.4);
  z-index: 1000;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:global(.highlighted-field .el-form-item__label) {
  background-color: white;
}

.original-value {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 4px;
  margin-right: 13px;
  text-align: center;
}

.changed {
  color: var(--el-color-primary);
}

</style>
