<template>
  <el-form :model="shift" ref="shiftFormRef" label-width="120px" :rules="validationRules">
    <!-- Name (Required) -->
    <el-form-item
        :label="translate('common.addDialog.name')"
        prop="name"
    >
      <el-input
          v-model="shift.name"
          :placeholder="translate('shiftManagement.namePlaceholder')"
          maxlength="255"
      />
    </el-form-item>

    <!-- Description (Optional) -->
    <el-form-item
        :label="translate('orderManagement.description')"
    >
      <el-input
          type="textarea"
          v-model="shift.description"
          :placeholder="translate('shiftManagement.descriptionPlaceholder')"
      />
    </el-form-item>

    <!-- Start Time (Required) -->
    <el-form-item
        :label="translate('shiftManagement.startTime')"
        prop="start_time"
    >
      <el-time-picker
          v-model="shift.start_time"
          :placeholder="translate('shiftManagement.startTimePlaceholder')"
      />
    </el-form-item>

    <!-- End Time (Required) -->
    <el-form-item
        :label="translate('shiftManagement.endTime')"
        prop="end_time"
    >
      <el-time-picker
          v-model="shift.end_time"
          :placeholder="translate('shiftManagement.endTimePlaceholder')"
      />
    </el-form-item>

    <!-- Grace Minute -->
    <el-form-item
        :label="translate('shiftManagement.graceMinute')"
    >
      <el-input-number
          v-model="shift.grace_minute"
          :min="0"
          :max="120"
          :placeholder="translate('shiftManagement.graceMinute')"
          style="margin-right: 10px;"
      />
      <span>{{translate('MyTaskTable.time.minute')}}</span>
    </el-form-item>

    <!-- Buttons -->
    <el-form-item>
      <el-button type="primary" @click="validateAndSubmit">{{ translate('orderManagement.confirm') }}</el-button>
      <el-button @click="$emit('cancel')">{{ translate('orderManagement.cancel') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { translate } from "@/utils/i18n";

export default {
  props: {
    shift: {
      type: Object,
      required: true,
    },
    isEditMode: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      validationRules: {
        name: [{ required: true, message: translate('shiftManagement.validation.nameRequired'), trigger: "blur" }],
        start_time: [{ required: true, message: translate('shiftManagement.validation.startTimeRequired'), trigger: "change" }],
        end_time: [{ required: true, message: translate('shiftManagement.validation.endTimeRequired'), trigger: "change" }],
      },
    };
  },
  methods: {
    translate,
    validateAndSubmit() {
      this.$refs.shiftFormRef.validate((valid) => {
        if (valid) {
          const payload = { ...this.shift };
          payload.status = 1;
          if (payload.id == null) {
            payload.created_by = this.$store.getters.getUser.id;
            payload.created_at = new Date().toISOString();
          } else {
            payload.updated_by = this.$store.getters.getUser.id;
            payload.updated_at = new Date().toISOString();
          }
          this.$emit("submit", payload);
        } else {
          console.error("Form validation failed!");
        }
      });
    },
  },
};
</script>

<style scoped>
</style>
