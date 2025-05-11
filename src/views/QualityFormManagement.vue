<template>
  <el-container>
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" @is-deletion="handleDeletion"/>
    </el-aside>
    <el-main>
      <!-- Render FormDisplay only if selectedForm exists and nodeType is not 'folder' -->
      <FormDisplay
          v-if="selectedForm && selectedForm.nodeType !== 'folder'"
          :key="formKey"
          :currentForm="selectedForm"
          :usable="false"
          @updateIsDirty="isFormDirty = $event"
      />
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';

export default {
  components: {FormTree, FormDisplay},
  data() {
    return {
      selectedForm: null, // Ensure it's initially null
      isFormDirty: false,
      formKey: 0 // 每次切换表单强制刷新子组件
    };
  },
  methods: {
    selectForm(form) {
      if (this.isFormDirty) {
        this.$confirm(
            '您有未保存的更改，是否确定切换表单？',
            '警告',
            {
              confirmButtonText: '切换',
              cancelButtonText: '取消',
              type: 'warning',
            }
        ).then(() => {
          this.selectedForm = form;
          this.isFormDirty = false;
          this.formKey += 1; // 强制触发子组件重挂载
        }).catch(() => {
          // 用户取消
        });
      } else {
        this.selectedForm = form;
        this.formKey += 1; // 子组件强制刷新
      }
    },
    addForm() {
      this.selectedForm = {widgetList: [], formConfig: {}, qcFormTemplateId: null};
    },
    handleDeletion() {
      this.selectedForm = null;
    }
  },
};
</script>
