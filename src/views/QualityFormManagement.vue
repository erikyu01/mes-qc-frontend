<template>
  <el-container>
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" @is-deletion="handleDeletion"/>
    </el-aside>
    <el-main>
      <!-- Render FormDisplay only if selectedForm exists and nodeType is not 'folder' -->
      <FormDisplay
          v-if="selectedForm && selectedForm.nodeType !== 'folder'"
          :currentForm="selectedForm"
          :usable="false"
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
    };
  },
  methods: {
    selectForm(form) {
      this.selectedForm = form;
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
