<template>
  <div class="alert-page-grid">
    <!-- Header -->
    <div class="header-area" style="display: flex; justify-content: space-between">
      <h2 style="margin-bottom: 20px;">告警记录</h2>
      <el-button style="margin-top: 20px; margin-right: 5px" @click="openSettingsDialog" circle>
        <el-icon :class="{ rotate: autoRefresh.statusKey === 1 }" :size="30" style="display: flex; align-items: center; justify-content: center;">
          <Setting />
        </el-icon>
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filter-area">
      <div style="gap: 20px; display: flex; justify-content: space-around">
        <el-select v-model="filtersToSend.riskLevelId" placeholder="告警等级" clearable filterable style="width: 150px;">
          <el-option v-for="item in filterOptions.riskLevelOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>

        <el-select v-model="filtersToSend.alertStatusId" placeholder="告警状态" clearable filterable style="width: 150px;">
          <el-option v-for="item in filterOptions.alertStatusOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>

        <el-select v-model="filtersToSend.suggestedProductId" placeholder="产品名称" clearable filterable  style="width: 150px;">
          <el-option v-for="item in filterOptions.suggestedProductOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="filtersToSend.suggestedBatchId" placeholder="批次号" clearable filterable  style="width: 150px;">
          <el-option v-for="item in filterOptions.suggestedBatchOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-date-picker
            v-model="selectedDateRange"
            type="datetimerange"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 350px;"
            @change="onDateChange"
        />

      </div>
      <div>

      </div>
      <div style="gap: 20px; display: flex; justify-content: space-around">
        <el-input
            v-model="filtersToSend.generalSearch"
            placeholder="搜索告警编号..."
            clearable
            style="width: 200px; align-items: center;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="warning" @click="resetFilters" style="margin: 0px;">重置</el-button>
<!--        <el-button type="success" @click="exportTable" style="margin: 0px;">导出</el-button> &lt;!&ndash; 修改这行 &ndash;&gt;-->
        <el-button type="primary" @click="fetchAlertRecords" style="margin: 0px;">刷新</el-button>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-area">
      <el-card>
        <div>状态统计</div>
        <v-chart :option="statusPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>风险等级统计</div>
        <v-chart :option="riskPieOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>Top 3 告警产品</div>
        <v-chart :option="productBarOption" autoresize style="height: 140px;" />
      </el-card>
      <el-card>
        <div>Top 3 告警检测项</div>
        <v-chart :option="inspectionBarOption" autoresize style="height: 140px;" />
      </el-card>

    </div>

    <!-- Alert Records Table -->
    <el-table
        class="table-area"
        v-loading="table.loading"
        :data="paginatedAlerts"
        style="width: 100%; flex: 1 1 auto;"
        @sort-change="handleSortChange"
        :allow-drag-last-column="true"
        :row-class-name="renderRows"
        border
    >
      <el-table-column label="告警编号" prop="alert_code" width="190" fixed="left">
        <template #default="scope">
          <span>{{ scope.row.alert_code }}</span>
        </template>
      </el-table-column>

      <el-table-column label="告警时间" prop="alertTime" width="180" sortable fixed="left">
        <template #default="scope">
          <span>{{ formatDate(scope.row.alert_time) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="产品名称" width="150">
        <template #default="scope">
          <el-tooltip
              effect="dark"
              :content="scope.row.product_names.join(', ')"
              placement="top"
          >
            <el-tag v-html="scope.row.product_display"/>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="批次号" width="160">
        <template #default="scope">
          <el-tooltip effect="dark" :content="scope.row.batch_codes?.join(', ')" placement="top">
            <el-tag v-html="scope.row.batch_display" type="success" />
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="质检表单" width="180">
        <template #default="scope">
          <el-link
              type="primary"
              :underline="false"
              v-if="scope.row.qc_form_template?.id"
              :href="`/form-display/${scope.row.qc_form_template.id}?usable=false&switchDisplayed=false`"
              target="_blank"
          >
            {{ scope.row.form_display }}
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>

      <el-table-column label="检测项" width="180">
        <template #default="scope">
          <div>{{ scope.row.inspection_item?.label || '-' }}</div>
        </template>
      </el-table-column>

      <el-table-column label="检测值" prop="inspectionValue" width="120" sortable>
        <template #default="scope">
          <span>{{ scope.row.inspection_value }}</span>
          <!-- 下限处理 -->
          <el-icon
              v-if="typeof scope.row.inspection_value === 'number' && typeof scope.row.lower_control_limit === 'number' && scope.row.inspection_value < scope.row.lower_control_limit"
              style="color: #2c4cb3; margin-left: 4px;"
          >
            <arrow-down-bold />
          </el-icon>
          <!-- 上限处理 -->
          <el-icon
              v-else-if="typeof scope.row.inspection_value === 'number' && typeof scope.row.upper_control_limit === 'number' && scope.row.inspection_value > scope.row.upper_control_limit"
              style="color: #f46666; margin-left: 4px;"
          >
            <arrow-up-bold />
          </el-icon>
        </template>
      </el-table-column>

      <el-table-column label="标准值范围" width="150">
        <template #default="scope">
          {{ scope.row.control_range }}
        </template>
      </el-table-column>

<!--      <el-table-column label="超限情况" prop="exceed_status" width="120">-->
<!--        <template #default="scope">-->
<!--          <el-tag :type="scope.row.exceed_status === '超标' ? 'danger' : 'success'">-->
<!--            {{ scope.row.exceed_status }}-->
<!--          </el-tag>-->
<!--        </template>-->
<!--      </el-table-column>-->

      <el-table-column label="RPN" prop="rpn" width="120" sortable>
        <template #header>
          <span>RPN</span>
          <el-tooltip content="点击查看 RPN 说明" placement="top">
            <el-icon style="cursor: pointer; margin-left: 5px;" @click.stop="dialogs.showRpnDialog = true">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
        <template #default="scope">
          <el-input
              v-if="scope.row.isEditing"
              v-model="scope.row.rpn"
              size="small"
              style="width: 80px;"
          />
          <span v-else>{{ scope.row.rpn }}</span>
        </template>
      </el-table-column>

      <el-table-column label="预警等级" prop="risk_level" width="120" sortable>
        <template #default="scope">
          <el-tag :type="scope.row.risk_level.id === 3 ? 'danger' : scope.row.risk_level.id === 2 ? 'warning' : 'info'">
            {{ scope.row.risk_level.name }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="质检人" width="160">
        <template #default="scope">
          <el-tooltip effect="dark" :content="scope.row.inspector_names?.join(', ')" placement="top">
            <el-tag type="warning">{{ scope.row.inspector_names?.[0] || '-' }}<span v-if="scope.row.inspector_names?.length > 1"> +{{ scope.row.inspector_names.length - 1 }}</span></el-tag>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="审核人" width="160">
        <template #default="scope">
          <el-tooltip effect="dark" :content="scope.row.reviewer_names?.join(', ')" placement="top">
            <el-tag type="danger">{{ scope.row.reviewer_names?.[0] || '-' }}<span v-if="scope.row.reviewer_names?.length > 1"> +{{ scope.row.reviewer_names.length - 1 }}</span></el-tag>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="状态" prop="status" width="120">
        <template #header>
          <span>状态</span>
          <el-tooltip content="RPN值低于100时，状态将自动设为已关闭" placement="top">
            <el-icon style="cursor: pointer; margin-left: 5px;" @click.stop="dialogs.showRpnDialog = true">
              <QuestionFilled />
            </el-icon>
          </el-tooltip>
        </template>
        <template #default="scope">
          <el-tag :type="scope.row.alert_status.id === 1 ? 'warning' : 'success'">
            {{ scope.row.alert_status.name }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" width="200" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="viewDetails(scope.row)">查看</el-button>
          <el-button
              size="small"
              :type="scope.row.isEditing ? 'success' : 'plain'"
              @click="toggleEdit(scope.row)"
          >
            {{ scope.row.isEditing ? '保存' : '修改' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteRecord(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination component -->
    <el-pagination
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50, 100]"
        background
    />
  </div>

  <el-dialog title="风险优先数 (RPN) 说明" v-model="dialogs.showRpnDialog" width="600px">
    <p><strong>RPN = 严重度 (Severity) × 发生概率 (Occurrence) × 检测难度 (Detection)</strong></p>
    <ul>
      <li><strong>严重度</strong>：失效发生后的严重程度，评分 1-10。</li>
      <li><strong>发生概率</strong>：失效发生的可能性，评分 1-10。</li>
      <li><strong>检测难度</strong>：在出厂前发现失效的难度，评分 1-10。</li>
    </ul>
    <p><strong>风险等级划分：</strong></p>
    <ul>
      <li>≥ 200 → 高风险</li>
      <li>100 - 199 → 中风险</li>
      <li>< 100 → 低风险</li>
    </ul>
    <p><strong>初始值为50</strong></p>
  </el-dialog>

  <el-dialog title="设置" v-model="dialogs.showSettingsDialog" width="350px" @close="resetSettings">
    <el-form label-width="120px" style="padding-top: 20px">
      <el-form-item label="当前刷新状态">
        <el-tag :type="autoRefresh.statusSetting[autoRefresh.statusKey][1]">{{ autoRefresh.statusSetting[autoRefresh.statusKey][0] }}</el-tag> <!-- 添加这行 -->
      </el-form-item>
      <el-form-item label="启用自动刷新">
        <el-switch v-model="autoRefresh.enabled" />
      </el-form-item>
      <el-form-item label="自动刷新秒数">
        <el-input-number
            v-model="autoRefresh.interval"
            :min="autoRefresh.min"
            :max="autoRefresh.max"
            :disabled="!autoRefresh.enabled"
        />
        <div style="color: rgba(255,0,0,0.5);">
          {{autoRefresh.min}}秒 - {{autoRefresh.max}}秒之间
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogs.showSettingsDialog = false">关闭</el-button>
      <el-button type="primary" @click="applyAlarmSetting">应用</el-button>  <!-- 添加这行: 应用按钮 -->
    </template>
  </el-dialog>

</template>

<script>
import Mock from 'mockjs';
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import {ArrowDownBold, ArrowUpBold, QuestionFilled, Search, Setting} from "@element-plus/icons-vue";
// import { getAllAlarmRiskLevels } from '@/mockServices/definitions/alarmRiskLevelDefinitionService';
// import { getAllAlarmStatuses } from '@/mockServices/definitions/alarmStatusDefinitionService';
// import { getAllAlerts } from '@/mockServices/alert/alertService';
import {deleteAlertRecord, getPaginatedAlertRecords, updateAlertRecord} from "@/services/alarmRecordService";
import {convertToUtcRange, formatDate} from "@/utils/task-center/dateFormatUtils"; // 替换 alert mock 调用
import { getAlertSummary } from "@/services/alarmRecordService";
import {getAlActiveSuggestedProducts} from "@/services/production/suggestedProductService";
import {getAllActiveSuggestedBatches} from "@/services/production/suggestedBatchService";
import { getRiskLevels, getAlertStatuses } from "@/services/alarmRecordService";
import {debounce} from "lodash";

use([PieChart, CanvasRenderer]);

export default {
  name: 'AlertRecordsTable',
  components: {ArrowUpBold, ArrowDownBold, Setting, QuestionFilled, Search, VChart },
  data() {
    return {
      // 表格数据
      table: {
        alertRecords: [],
        loading: false,
        indexesForEdit: {}
      },

      // 分页和排序
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
        sortSettings: { prop: '', order: '' }
      },

      selectedDateRange: [],

      // 过滤条件
      filtersToSend: {
        alertStatusId: '',
        riskLevelId: '',
        suggestedProductId: null,
        suggestedBatchId: null,
        generalSearch: '',
        dateRange: '', // "2025-12-01T00:00:00.000Z,2025-12-31T23:59:59.999Z"
      },

      filterOptions: {
        suggestedProductOptions: [],
        suggestedBatchOptions: [],
        riskLevelOptions: [],
        alertStatusOptions: []
      },

      // 弹窗控制
      dialogs: {
        showRpnDialog: false,
        showSettingsDialog: false
      },

      // 自动刷新设置
      autoRefresh: {
        enabled: true,
        interval: 60,
        timer: null,
        min: 10,
        max: 3600,
        enabledTemp: false,
        intervalTemp: 60,
        statusKey: 1,
        statusSetting: {
          1: ['正常', 'success'],
          2: ['已停止', 'info'],
          3: ['编辑中被停止', 'warning']
        }
      },

      // data for charts
      summaryStats: {
        alertStatusCounts: {},
        riskLevelCounts: {},
        productCounts: {},
        inspectionItemCounts: {}
      }
    };
  },
  computed: {
    pausedByEdit() {
      return Object.values(this.table.indexesForEdit).some(list => list.length > 0);
    },
    productBarOption() {
      const sorted = Object.entries(this.summaryStats.productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        tooltip: {},
        grid: { top: 20, bottom: 20, left: 50, right: 20 },
        xAxis: { type: 'category', data: sorted.map(item => item[0]) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', barWidth: 30, data: sorted.map(item => item[1]) }]
      };
    },
    inspectionBarOption() {
      const sorted = Object.entries(this.summaryStats.inspectionItemCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return {
        tooltip: {},
        grid: { top: 20, bottom: 20, left: 50, right: 20 },
        xAxis: { type: 'category', data: sorted.map(item => item[0]) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', barWidth: 30, data: sorted.map(item => item[1]) }]
      };
    },
    paginatedAlerts() {
      return this.table.alertRecords;
    },
    statusPieOption() {
      return {
        tooltip: { trigger: 'item' },
        legend: { top: 'center', left: 'right', orient: 'vertical' },
        series: [{
          type: 'pie',
          radius: '70%',
          data: Object.entries(this.summaryStats.alertStatusCounts).map(([name, value]) => ({ name, value })),
          label: { show: false },
          labelLine: { show: false }
        }]
      };
    },

    riskPieOption() {
      return {
        tooltip: { trigger: 'item' },
        legend: { top: 'center', left: 'right', orient: 'vertical' },
        color: ['#f46666', '#f1c07c', '#9ef476'],
        series: [{
          type: 'pie',
          radius: '70%',
          data: Object.entries(this.summaryStats.riskLevelCounts).map(([name, value]) => ({ name, value })),
          label: { show: false },
          labelLine: { show: false }
        }]
      };
    }
  },

  watch: {
    'autoRefresh.enabled'(newVal) {
      this.updateRefreshStatus();
    },
    'table.indexesForEdit': {
      handler() {
        this.updateRefreshStatus();
      },
      deep: true
    },
    filtersToSend: {
      handler: debounce(function () {
        this.pagination.currentPage = 1;
        this.fetchPaginatedAlerts(0, this.pagination.pageSize);
      }, 300),
      deep: true
    },
    'pagination.sortSettings': {
      handler() {
        this.fetchPaginatedAlerts(this.pagination.currentPage - 1, this.pagination.pageSize);
      },
      deep: true
    },
  },
  methods: {
    formatDate,
    fetchAlertRecords() {
      this.fetchPaginatedAlerts(this.pagination.currentPage - 1, this.pagination.pageSize);
      this.fetchAlertSummary();
    },
    onDateChange(val) {
      this.selectedDateRange = val;

      if (val && val.length === 2) {
        const utcStart = new Date(val[0]).toISOString();
        const utcEnd = new Date(val[1]).toISOString();
        this.filtersToSend.dateRange = `${utcStart},${utcEnd}`;
      } else {
        this.filtersToSend.dateRange = '';
      }
    },
    resetFilters() {
      // 清除筛选项
      this.filtersToSend = {
        alertStatusId: '',
        riskLevelId: '',
        suggestedProductId: null,
        suggestedBatchId: null,
        generalSearch: '',
        dateRange: ''
      };

      // 清除日期选择器显示
      this.selectedDateRange = [];

      // 清除排序设置
      this.pagination.sortSettings = { prop: '', order: '' };

      // 重置分页页码为第一页
      this.pagination.currentPage = 1;

      // 重新拉取数据
      this.fetchPaginatedAlerts(0, this.pagination.pageSize);
    },
    async fetchSuggestedProducts() {
      try {
        const res = await getAlActiveSuggestedProducts();
        this.filterOptions.suggestedProductOptions = (res.data || []).map(p => ({
          label: p.name,
          value: p.id
        }));
      } catch (e) {
        console.error("❌ 获取产品失败", e);
      }
    },
    async fetchSuggestedBatches() {
      try {
        const res = await getAllActiveSuggestedBatches();
        this.filterOptions.suggestedBatchOptions = (res.data || []).map(b => ({
          label: b.code,
          value: b.id
        }));
      } catch (e) {
        console.error("❌ 获取批次失败", e);
      }
    },
    async fetchAlertSummary() {
      try {
        const res = await getAlertSummary();
        this.summaryStats = res.data;
      } catch (error) {
        console.error("❌ 获取统计失败", error);
        this.$message.error("获取统计图数据失败");
      }
    },
    async fetchPaginatedAlerts(page = 0, size = 10) {
      this.table.loading = true;


      // Dynamically eliminate the empty values to not sending to the backend
      const requestBody = {
        page,
        size
      };

      const filteredFilters = {};
      Object.entries(this.filtersToSend).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          if (key === 'generalSearch') {
            filteredFilters[key] = value.trim();
          } else {
            filteredFilters[key] = value;
          }
        }
      });
      if (Object.keys(filteredFilters).length > 0) {
        requestBody.filters = filteredFilters;
      }

      const sortSettings = this.pagination.sortSettings;
      if (sortSettings.prop && sortSettings.order) {
        requestBody.sort = {
          prop: sortSettings.prop,
          order: sortSettings.order
        };
      }

      try {
        const response = await getPaginatedAlertRecords(requestBody);

        this.table.alertRecords = (response.data.content || []).map(alert => {
          const productNames = alert.products?.map(p => p.name) || [];
          const batchCodes = alert.batches?.map(b => b.code) || [];
          const inspectorNames = (alert.inspectors || []).map(i => i.name);
          const reviewerNames = (alert.reviewers || []).map(r => r.name);

          return {
            ...alert,
            product_names: productNames,
            batch_codes: batchCodes,

            product_display: (productNames[0] || '-') + (productNames.length > 1 ? ` +${productNames.length - 1}` : ''),
            batch_display: (batchCodes[0] || '-') + (batchCodes.length > 1 ? ` +${batchCodes.length - 1}` : ''),

            inspector_names: inspectorNames,
            reviewer_names: reviewerNames,

            form_display: alert.qc_form_template?.name || '-'
          };
        });

        this.pagination.total = response.data.totalElements || 0;
      } catch (error) {
        console.error("❌ 获取分页告警失败:", error);
        this.$message.error("获取告警记录失败");
      } finally {
        this.table.loading = false;
      }
    },
    // fetchAlarmRiskLevels() {
    //   getAllAlarmRiskLevels().then(response => {
    //     this.filters.riskLevelOptions = response.data || [];
    //     console.log("this filters riskLevelOptions: ")
    //     console.log(this.filters.riskLevelOptions)
    //   });
    // },
    // fetchAlarmStatuses() {
    //   getAllAlarmStatuses().then(response => {
    //     this.filters.statusOptions = response.data || [];
    //   });
    // },
    deleteRecord(row) {
      this.$confirm('确定要删除该记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const userId = this.$store.getters.getUser.id;
          await deleteAlertRecord(row.id, userId);
          this.$message.success('删除成功');
          await this.fetchPaginatedAlerts(this.pagination.currentPage - 1, this.pagination.pageSize);
        } catch (error) {
          console.error("删除失败", error);
          this.$message.error("删除失败");
        }
      }).catch(() => {
        // 用户取消删除
      });
    },
    openSettingsDialog() {
      this.autoRefresh.enabledTemp = this.autoRefresh.enabled;
      this.autoRefresh.intervalTemp = this.autoRefresh.interval;
      this.dialogs.showSettingsDialog = true;
    },
    resetSettings() {
      this.autoRefresh.enabled = this.autoRefresh.enabledTemp;
      this.autoRefresh.interval = this.autoRefresh.intervalTemp;
    },
    exportTable() {
      console.log('导出假数据：', this.filteredOptions);  // 模拟导出，后续可加 CSV/PDF
    },
    renderRows({ row, rowIndex }) {
      const currentPage = this.pagination.currentPage;
      const editIndexes = this.table.indexesForEdit[currentPage] || [];
      if (editIndexes.includes(rowIndex)) {
        return 'warning-row';
      }
      return '';
    },
    updateRefreshStatus() {
      const hasEdit = Object.values(this.table.indexesForEdit).some(list => list.length > 0);
      if (hasEdit) {
        this.autoRefresh.statusKey = 3;
      } else if (!this.autoRefresh.enabled) {
        this.autoRefresh.statusKey = 2;
      } else {
        this.autoRefresh.statusKey = 1;
      }
    },
    async toggleEdit(row) {
      const index = this.paginatedAlerts.indexOf(row);
      const currentPage = this.pagination.currentPage;

      if (!this.table.indexesForEdit[currentPage]) {
        this.table.indexesForEdit[currentPage] = [];
      }

      this.autoRefresh.pausedByEdit = Object.values(this.table.indexesForEdit).some(list => list.length > 0);

      if (!row.isEditing) {
        row.isEditing = true;
        this.table.indexesForEdit[currentPage].push(index);
      } else {
        row.isEditing = false;

        try {
          const updatedBy = this.$store.getters.getUser.id;
          await updateAlertRecord({ id: row.id, rpn: row.rpn, updatedBy });
          this.$message.success('保存并更新成功');
        } catch (error) {
          this.$message.error('更新失败，请稍后重试');
          console.error("❌ 更新告警记录失败", error);
        }

        const idx = this.table.indexesForEdit[currentPage].indexOf(index);
        if (idx !== -1) this.table.indexesForEdit[currentPage].splice(idx, 1);

        const oldRpn = row.rpn;
        const rpn = Number(row.rpn);
        this.$message({
          type: 'success',
          dangerouslyUseHTMLString: true,
          message: `保存成功，RPN值: <span style="color: #2c4cb3">${oldRpn}</span> → <span style="color: #f46666">${rpn}</span>${rpn < 100 ? '，状态已自动设为<span style="color: green">已关闭</span>' : ''}`
        });
      }

      // 判断所有页 indexesForEdit 是否为空
      const isEditing = Object.values(this.table.indexesForEdit).some(arr => arr.length > 0);

      if (isEditing && this.autoRefresh.enabled && this.autoRefresh.timer) {  // 编辑中暂停刷新
        clearInterval(this.autoRefresh.timer);
        this.autoRefresh.timer = null;
        this.$message.warning('编辑中，自动刷新已暂停');
      } else if (!isEditing && this.autoRefresh.enabled && !this.autoRefresh.timer) {  // 无编辑恢复刷新
        this.autoRefresh.timer = setInterval(() => {
          this.fetchAlertRecords();
        }, this.autoRefresh.interval * 1000);
        this.$message.success('自动刷新已恢复');
      }
    },
    handleSortChange({ prop, order }) {
      if (!prop || !order) return;
      this.pagination.sortSettings = { prop, order };
      this.fetchPaginatedAlerts(this.pagination.currentPage - 1, this.pagination.pageSize);
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.fetchPaginatedAlerts(this.pagination.currentPage - 1, size);
    },
    handleCurrentChange(page) {
      this.pagination.currentPage = page;
      this.fetchPaginatedAlerts(page - 1, this.pagination.pageSize);
    },
    handlePageChange(newPage) {
      this.pagination.currentPage = newPage;
      this.fetchPaginatedAlerts(newPage - 1, this.pagination.pageSize);
    },
    viewDetails(row) {
      this.$message.info(`此功能正在开发中`);
    },
    applyAlarmSetting() {
      this.autoRefresh.enabledTemp = this.autoRefresh.enabled;
      this.autoRefresh.intervalTemp = this.autoRefresh.interval;

      clearInterval(this.autoRefresh.timer);
      if (this.autoRefresh.enabled) {
        this.autoRefresh.timer = setInterval(() => {
          this.fetchAlertRecords();
        }, this.autoRefresh.interval * 1000);
      }
      this.autoRefresh.pausedByEdit = false;
      this.dialogs.showSettingsDialog = false;
      this.$message.success(
          this.autoRefresh.enabled
              ? `自动刷新已启用，刷新间隔: ${this.autoRefresh.interval}秒`
              : '自动刷新已关闭'
      );
    }
  },
  mounted() {
    this.pagination.sortSettings = { prop: 'alertTime', order: 'descending' }; // 强制设定初始排序
    this.fetchPaginatedAlerts(); // 默认加载第一页
    this.fetchAlertSummary();
    this.fetchSuggestedProducts();
    this.fetchSuggestedBatches();

    getRiskLevels().then(res => {
      this.filterOptions.riskLevelOptions = res.data;
    });

    getAlertStatuses().then(res => {
      this.filterOptions.alertStatusOptions = res.data;
    });

    if (this.autoRefresh.enabled) {
      this.autoRefresh.timer = setInterval(() => {
        this.fetchPaginatedAlerts(this.pagination.currentPage - 1, this.pagination.pageSize);
      }, this.autoRefresh.interval * 1000);
    }

    this.updateRefreshStatus();
  },
  beforeUnmount() {
    clearInterval(this.autoRefresh.timer);
  }
};
</script>

<style scoped>

.tableContainer {
  overflow-x: auto;
  max-width: 100%;
}

::v-deep(.warning-row) {
  background-color: var(--el-color-warning-light-9) !important;
}

.rotate {
  animation: spin 2s linear infinite;
  color: #409EFF;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.alert-page-grid { /* 整个页面的 Grid 容器 */
  display: grid;
  grid-template-rows: auto auto auto 1fr auto; /* 5行：header, filter, charts, table, pager */
  grid-template-areas:
    "header"
    "filter"
    "charts"
    "table"
    "pager";
  height: calc(100vh - 20px); /* 占满整个视口高度 */
  gap: 10px; /* 区域间隔 */
}

/* 每个区域的 grid-area 绑定 */
.header-area { grid-area: header; }
.filter-area {
  grid-area: filter;
  display: grid; /* 改成 grid */
  grid-template-columns: 3fr 1fr 1fr; /* 左侧筛选项占3份，右侧按钮占1份 */
  align-items: center; /* 垂直居中 */
  gap: 20px; /* 左右区域间距 */
}
.charts-area {
  grid-area: charts;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自动换行，每个最小300px，最大1fr */
  gap: 20px; /* 卡片间距 */
}
.table-area {
  grid-area: table;
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pager-area { grid-area: pager; }


</style>
