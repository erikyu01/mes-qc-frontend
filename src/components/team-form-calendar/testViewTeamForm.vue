<template>
  <el-select
      v-model="teamId"
      filterable
      :placeholder="translate('userManagement.addDialog.assignedTeamPlaceHolder')"
  >
    <el-option
        v-for="team in teamOptions"
        :key="team.id"
        :label="team.label"
        :value="team.id"
    >
      <span style="float: left">
        {{ team.label }}
      </span>
      <span
          style="
          float: right;
          color: var(--el-text-color-secondary);
          font-size: 13px;
         "
      >
        {{ translate('userManagement.table.leader') + ": " + team.value }}
      </span>
    </el-option>
  </el-select>

  <el-date-picker v-model="date" type="datetime">
  </el-date-picker>

  <el-button style="margin:0" :disabled="!teamId || !date" @click="fetchFormTreeData">Confirm</el-button>

  <div class="form-container">
    <el-tree
        ref="treeRef"
        class="qc-tree"
        :data="data"
        node-key="id"
        :props="defaultProps"
        default-expand-all
    >
      <template #default="{ node, data }">
        <div class="custom-tree-node">
          <div class="node-content">
            <el-icon>
              <Folder v-if="data.nodeType === 'folder'" />
              <Document v-else />
            </el-icon>
            <span class="node-label">{{ data.label }}</span>
          </div>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {ElButton, ElTree} from 'element-plus'
import {Document, Folder} from '@element-plus/icons-vue'
import {getFormTreeByTeamAndDate} from '@/services/calendarAssignmentService'
import {getAllTeams} from '@/services/teamService'
import {translate} from "@/utils/i18n"

interface Tree {
  id: string;
  label: string;
  children?: Tree[];
  nodeType: string;
  qcFormTemplateId: string | null;
}

const teamId = ref();
const date = ref();
const treeRef = ref<InstanceType<typeof ElTree>>()

// Store raw form tree data from backend
const rawTreeData = ref<Tree[]>([]);

// Data to display in el-tree
const data = ref<Tree[]>([])
const error = ref<string | null>(null)

const defaultProps = {
  children: 'children',
  label: 'label',
};

const fetchFormTreeData = async () => {
  try {
    const response = await getFormTreeByTeamAndDate(teamId.value, date.value?.toISOString());
    rawTreeData.value = response.data.data;
    data.value = response.data.data;
  } catch (err) {
    console.log('Failed to load form tree data', err);
  }
};

const teamOptions = ref([]);

const fetchTeamOptions = async() => {
  try {
    const response = await getAllTeams();
    if (response.data.status === "200") {
      // Adding value, label field to be used as dropdown additionally
      teamOptions.value = response.data.data.map(team => ({
        ...team,
        value: team.leader?.name || "-",
        label: team.name,
      }));

    } else {
      teamOptions.value = [];
    }
  } catch (error) {
    teamOptions.value = [];
  }
}

onMounted(async () => {
  await fetchTeamOptions();
});

</script>

<style>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-content {
  display: flex;
  align-items: center;
}

.node-label {
  margin-left: 8px; /* Add space between the icon and label */
}

.node-actions a {
  margin-left: 8px;
}

.form-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-container {
  display: flex;
  justify-content: flex-start; /* Align search box to the right */
  margin-bottom: 10px;
}

.qc-tree {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
</style>
