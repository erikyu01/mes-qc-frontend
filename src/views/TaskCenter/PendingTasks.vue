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
          :currentForm="selectedForm"
          :usable="true"
          :accessByTeam="1"
      />
    </el-main>
  </el-container>
</template>

<script>
import FormTree from '@/components/form-manager/FormTree.vue';
import FormDisplay from '@/components/form-manager/FormDisplay.vue';
import {getTeamByTeamLeadId} from "@/services/teamService";
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
      teamId: null
    };
  },
  methods: {
    getTeamByTeamLeadId,
    selectForm(form) {
      this.selectedForm = form;
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
