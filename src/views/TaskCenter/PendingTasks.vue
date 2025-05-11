<template>
  <el-container>
    <el-aside width="25%">
      <FormTree
          v-if="teamId !== null"
          :accessByTeam="teamId"
          @select-form="selectForm"
          @add-form="addForm"
          @is-deletion="handleDeletion"
      />
    </el-aside>
    <el-main>
      <FormDisplay
          v-if="selectedForm && selectedForm.nodeType !== 'folder'"
          :key="formKey"
          :currentForm="selectedForm"
          :usable="true"
          :accessByTeam="1"
          @updateIsDirty="isFormDirty = $event"
      />

    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';
import { getTeamByTeamLeadId } from "@/services/teamService";
import store from "@/store";

export default {
  computed: {
    store() {
      return store
    }
  },
  components: {
    FormTree,
    FormDisplay,
  },
  data() {
    return {
      selectedForm: null,
      teamId: null,
      isFormDirty: false,
      formKey: 0
    };
  },
  methods: {
    getTeamByTeamLeadId,
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
          this.formKey += 1;
        }).catch(() => {
          // 用户取消
        });
      } else {
        this.selectedForm = form;
        this.formKey += 1;
      }
    },
    addForm() {
      this.selectedForm = {
        widgetList: [],
        formConfig: {},
        qcFormTemplateId: null,
      };
    },
    handleDeletion() {
      this.selectedForm = null;
    },
  },
  mounted: async function () {
    try {
      const response = await getTeamByTeamLeadId(this.$store.getters.getUser.id);
      this.teamId = response.data.data.id;
      console.log("teamId", this.teamId);
    } catch (err) {
      console.error("Failed to fetch team by lead ID:", err);
    }
  }
};
</script>
