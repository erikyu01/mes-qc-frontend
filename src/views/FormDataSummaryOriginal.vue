<template>
  <el-container v-loading="pdfLoading" :element-loading-text="translate('FormDataSummary.loadingText')" element-loading-background="rgba(0, 0, 0, 0.4)" class="qcsum-container">
    <el-aside width="25%">
      <FormTree @select-form="selectForm" @add-form="addForm" />
    </el-aside>

    <el-main width="75%" style="max-height: 100vh; overflow-y: auto;" v-show="isMainDisplayed">
      <div v-if="selectedForm" class="form-header">
        <h1 style="width: 200px">{{ selectedForm.label }} {{ translate('FormDataSummary.summaryTitle') }}</h1>
        <el-date-picker
            style="width: 320px; margin-left: 150px; margin-right: 20px"
            v-model="dateRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            :range-separator="translate('FormDataSummary.dateRangeSeparator')"
            :start-placeholder="translate('FormDataSummary.startPlaceholder')"
            :end-placeholder="translate('FormDataSummary.endPlaceholder')"
            @change="refreshChartData"
        />
        <el-button type="success" style="margin-top: 0;" @click="exportToPdf">{{ translate('FormDataSummary.generatePdf') }}</el-button>
        <el-button type="primary" @click="openQcRecordsDialog" style="margin-top: 0">{{ translate('FormDataSummary.viewRecords') }}</el-button>
      </div>

      <el-skeleton v-if="loadingCharts" :rows="6" animated />

      <template v-else>
        <div v-for="widget in lineChartWidgets" :key="widget.name" class="chart-card hover-effect">
          <LineChart
              ref="lineChartRefs"
              :chartTitle="widget.label"
              :chartData="widget.chartData"
              :xaxisData="widget.xaxisData"
          />
        </div>

        <div v-for="widget in pieChartWidgets" :key="widget.name" class="chart-card hover-effect">
          <PieChart
              ref="pieChartRefs"
              :chartTitle="widget.label"
              :chartData="widget.chartData"
          />
        </div>
      </template>
    </el-main>

    <!-- Full-Screen Dialog for QC Records Table -->
    <el-dialog v-model="qcRecordsDialogVisible" :title="`${this.selectedForm?.label} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`" fullscreen>

      <!-- Search and Date Picker Container -->
      <div class="toolbar">
        <el-input
            v-model="searchQuery"
            :placeholder="translate('FormDataSummary.recordTable.searchPlaceholder')"
            clearable
            style="width: 300px; margin-right: 500px"
        />

        <el-button type="success" style="margin-top: 0; margin-right: 20px" @click="exportToExcel">{{ translate('FormDataSummary.recordTable.exportExcel') }}</el-button>

        <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            :range-separator="translate('FormDataSummary.dateRangeSeparator')"
            :start-placeholder="translate('FormDataSummary.startPlaceholder')"
            :end-placeholder="translate('FormDataSummary.endPlaceholder')"
            @change="handleDateRangeChange"
        />
      </div>

      <el-table
          v-loading="loadingQcRecords"
          :data="paginatedQcRecords"
          :height="tableHeight"
          border
          style="width: 100%; white-space: nowrap;"
          :scroll-x="true"
      >
        <el-table-column :label="translate('FormDataSummary.recordTable.groupSystemInfo')" label-class-name="group-header" fixed>
          <el-table-column prop="created_by" :label="translate('FormDataSummary.recordTable.submitter')" fixed="left" width="150" sortable>
            <template #default="scope">
              <span>{{ scope.row['提交人'] }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="created_at" :label="translate('FormDataSummary.recordTable.submittedAt')" fixed="left" width="180" sortable>
            <template #default="scope">
              <span>{{ formatClientTime(scope.row['提交时间']) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="_id" :label="translate('FormDataSummary.recordTable.submissionId')" fixed="left" width="220" sortable>
            <template #default="scope">
              <span>{{ scope.row._id }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column :label="translate('FormDataSummary.recordTable.groupQcDetails')" label-class-name="group-header">
          <el-table-column
            v-for="(header, index) in displayedColumnHeaders"
            :key="index"
            :prop="header"
            :label="header"
            sortable
            :width="150"
          />
        </el-table-column>

        <!-- Fixed 操作 column on the right -->
        <el-table-column :label="translate('FormDataSummary.recordTable.actions')" fixed="right" width="120">
          <template #default="scope">
            <el-link type="primary" @click="viewDetails(scope.row)">{{ translate('FormDataSummary.recordTable.view') }}</el-link>
            <el-link type="danger" style="margin-left: 10px" @click="deleteRecord(scope.row)">{{ translate('FormDataSummary.recordTable.delete') }}</el-link>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          v-if="qcRecords.length > 0"
          v-model:currentPage="currentPage"
          :page-size="pageSize"
          layout="total, prev, pager, next"
          :total="filteredQcRecords.length"
          @current-change="handlePageChange"
      />

      <template #footer>
        <el-button type="primary" @click="closeQcRecordsDialog">{{ translate('FormDataSummary.recordTable.closeButton') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="`${this.selectedForm?.label} - ${translate('FormDataSummary.detailDialog.titleSuffix')}`" v-model="dialogVisible" width="50%" @close="closeDetailsDialog">
      <el-scrollbar max-height="500px">
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

        <!-- Display Basic Information -->
        <el-descriptions :title="translate('FormDataSummary.recordTable.groupBasicInfo')" border style="margin-top: 10px">
          <el-descriptions-item label="涉及产品">{{ basicInfo.涉及产品 || " - " }}</el-descriptions-item>
          <el-descriptions-item label="涉及批次">{{ basicInfo.涉及批次 || " - " }}</el-descriptions-item>
          <el-descriptions-item label="质检人员">{{ basicInfo.质检人员 || " - " }}</el-descriptions-item>
          <el-descriptions-item label="所属班次">{{ basicInfo.所属班次 || " - " }}</el-descriptions-item>
        </el-descriptions>

        <!-- Display System Information -->
        <el-descriptions :title="translate('FormDataSummary.recordTable.groupSystemInfo')" border style="margin-top: 10px">
          <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submitter')">{{ systemInfo.提交人 || " - " }}</el-descriptions-item>
          <el-descriptions-item :label="translate('FormDataSummary.detailDialog.submittedAt')">{{ systemInfo.提交时间 || " - " }}</el-descriptions-item>
        </el-descriptions>

        <!-- Display E-signature if present -->
        <div v-if="eSignature && eSignature.startsWith('data:image')" style="margin-top: 20px;">
          <h3>{{ translate('FormDataSummary.detailDialog.signatureTitle') }}</h3>
          <img :src="eSignature" alt="e-signature" style="width: 300px; height: auto;" />
        </div>
      </el-scrollbar>

      <template #footer>
        <el-button type="info" @click="closeDetailsDialog">{{ translate('FormDataSummary.detailDialog.cancelButton') }}</el-button>
        <el-button type="primary" @click="exportSubmissionLogToPdf">{{ translate('FormDataSummary.detailDialog.exportButton') }}</el-button>
      </template>
    </el-dialog>


  </el-container>
</template>

<script>
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FormTree from '@/components/form-manager/FormTree.vue';
import PieChart from '@/components/charts/pie001.vue';
import LineChart from '@/components/charts/line001.vue';
import {extractWidgetDataWithCounts, fetchQcRecords, generateQcReport} from "@/services/qcReportingService";
import {deleteTaskSubmissionLog, exportDocumentToPDF, getMyDocument} from "@/services/qcTaskSubmissionLogsService";
import {getUserById} from "@/services/userService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";  // ✅ Import autoTable plugin explicitly
import callAddFont from "@/assets/simfang.js";
import callAddBoldFont from "@/assets/simfang-bold.js";
import {nextTick} from "vue";
import {translate, translateWithParams} from "@/utils/i18n";
import {parseFormDocument} from "@/utils/formUtils"; // 添加这行

export default {
  components: { FormTree, PieChart, LineChart },
  data() {
    return {
      tableHeight: window.innerHeight - 220,
      pdfLoading: false,
      isMainDisplayed: true,
      lineChartRefs: [],
      pieChartRefs: [],
      selectedDetails: {},
      dateRange: [this.getStartOfMonth(), this.getEndOfMonth()], // Default to current month
      loadingCharts: false,
      groupedDetails: {},
      systemInfo: {},
      basicInfo: {},
      eSignature: null,
      shortcuts: [
        {
          text: translate('FormDataSummary.shortcuts.thisWeek'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - start.getDay() + 1);
            return [start, end];
          },
        },
        {
          text: translate('FormDataSummary.shortcuts.thisMonth'),
          value: () => [this.getStartOfMonth(), this.getEndOfMonth()],
        },
        {
          text: translate('FormDataSummary.shortcuts.lastMonth'),
          value: () => {
            const start = new Date(this.getStartOfMonth());
            start.setMonth(start.getMonth() - 1);
            const end = new Date(this.getEndOfMonth());
            end.setMonth(end.getMonth() - 1);
            return [start, end];
          },
        },
        {
          text: translate('FormDataSummary.shortcuts.lastThreeMonths'),
          value: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 3);
            return [start, end];
          },
        },
      ],
      searchQuery: "",
      selectedForm: null,
      pieChartWidgets: [],
      lineChartWidgets: [],
      qcRecordsDialogVisible: false,
      dialogVisible: false,
      qcRecords: [], // ✅ Ensure this is always an array
      columnHeaders: [], // ✅ Also initialized as an empty array
      loadingQcRecords: true,
      reorderedColumnHeaders: [],
      currentPage: 1,
      pageSize: 15,
    };
  },
  mounted() {
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateTableHeight); // 添加这行
  },
  updateTableHeight() {
    this.tableHeight = window.innerHeight - 200;
  },
  computed: {
    filteredQcRecords() {
      if (!this.searchQuery) return this.qcRecords;
      return this.qcRecords.filter(record =>
          Object.values(record).some(value =>
              String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
          )
      );
    },
    displayedColumnHeaders() {
      return this.reorderedColumnHeaders.filter(header =>
          !["提交人", "提交时间", "_id", "e-signature"].includes(header)  // 提前过滤
      );
    },
    // 在 `computed: { reorderedColumnHeaders() }` 这个函数里，确保 `created_at` 和 `created_by` 排在最前
    reorderedColumnHeaders() {
      let headers = Object.keys(this.qcRecords[0] || {});
      headers = headers.filter(header => header !== "created_by" && header !== "created_at");
      headers.unteam("created_at", "created_by"); // 确保这两个字段在最前
      headers = headers.map(header => (header === "created_at" ? "提交时间" : header));
      return headers;
    },

    paginatedQcRecords() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredQcRecords.slice(start, end);
    },
    columns() {
      // Filter out _id to avoid displaying it
      const filteredEntries = Object.entries(this.selectedDetails)
          .filter(([key]) => key !== "_id" && key !== "created_at" && key !== "created_by");

      // Split into chunks of 10 fields per column
      const chunkSize = 10;
      const result = [];
      for (let i = 0; i < filteredEntries.length; i += chunkSize) {
        result.push(Object.fromEntries(filteredEntries.slice(i, i + chunkSize)));
      }
      return result;
    }
  },
  watch: {
    qcRecordsDialogVisible(newVal) {
      this.refreshChartData();
      // if (!newVal) {
      //   this.dateRange = [this.getStartOfMonth(), this.getEndOfMonth()];
      // }
    }
  },
  methods: {
    translate,
    formatClientTime(utcDateTime) {
      if (!utcDateTime) return "-";
      const utcDate = new Date(utcDateTime + "Z"); // 确保它被解析为 UTC
      return utcDate.toLocaleString("zh-CN", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).replace(/\//g, "-");
    },
    exportSubmissionLogToPdf() {
      const doc = new jsPDF();
      callAddBoldFont.apply(doc); // 添加字体
      doc.setFont("simfang", "bold");

      let y = 10; // 初始的垂直间距

      // 添加标题
      const title = `${this.selectedForm?.label}${translate('Export.titleSuffix')}`;
      doc.setFontSize(16);
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(title);
      const x = (pageWidth - textWidth) / 2;
      doc.text(title, x, y);
      y += 10;

      // 导出所有组内的字段和数据
      Object.entries(this.groupedDetails)
          .filter(([category]) => category !== 'uncategorized') // skip uncategorized
          .forEach(([category, fields]) => {
        doc.setFontSize(14);
        doc.text(category, 10, y);
        y += 6;

        const tableData = Object.entries(fields).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(", ") : value || " - ",
        ]);

        autoTable(doc, {
          startY: y,
          head: [translate('Export.tableHead')],
          body: tableData,
          theme: "grid",
          styles: { font: "simfang", fontSize: 10 },
          headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
        });

        y = doc.lastAutoTable.finalY + 10;
      });

      // 添加基础信息
      doc.setFontSize(14);
      doc.text('质检基础信息', 10, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [translate('Export.tableHead')],
        body: [
          ["涉及产品", this.basicInfo.涉及产品 || translate('Export.fallback')],
          ["涉及批次", this.basicInfo.涉及批次 || translate('Export.fallback')],
          ["质检人员", this.basicInfo.质检人员 || translate('Export.fallback')],
          ["所属班次", this.basicInfo.所属班次 || translate('Export.fallback')]
        ],
        theme: "grid",
        styles: { font: "simfang", fontSize: 10 },
        headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
      });

      y = doc.lastAutoTable.finalY + 10;

      // 添加系统信息
      doc.setFontSize(14);
      doc.text(translate('Export.groupTitle'), 10, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [translate('Export.tableHead')],
        body: [
          [translate('Export.systemInfo.submitter'), this.systemInfo.提交人 || translate('Export.fallback')],
          [translate('Export.systemInfo.submittedAt'), this.systemInfo.提交时间 || translate('Export.fallback')],
          [translate('Export.systemInfo.submissionId'), this.systemInfo.提交单号 || translate('Export.fallback')]
        ],
        theme: "grid",
        styles: { font: "simfang", fontSize: 10 },
        headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
      });

      y = doc.lastAutoTable.finalY + 10;

      // 添加电子签名，直接使用已经渲染的 <img> 元素
      const signatureImg = document.querySelector('img[alt="e-signature"]');
      if (signatureImg) {
        const imgWidth = 150;
        const aspectRatio = signatureImg.naturalWidth / signatureImg.naturalHeight;
        const imgHeight = imgWidth / aspectRatio;

        const pageHeight = doc.internal.pageSize.getHeight();
        // 检查是否需要分页
        if (y + imgHeight + 20 > pageHeight) { // 20 是为了确保有足够的底部空白
          doc.addPage();
          y = 10; // 重置Y位置
        }

        doc.setFontSize(14);
        doc.text(translate('Export.signatureTitle'), 10, y);
        y += 10;

        doc.addImage(signatureImg, 'PNG', 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }

      // 保存 PDF
      doc.save(`${this.selectedForm?.label}-submission_records.pdf`);
    },
    async exportToPdf() {
      if (!this.lineChartWidgets.length && !this.pieChartWidgets.length) {
        this.$message.warning(translate('FormDataSummary.messages.noChartData'));
        return;
      }

      this.pdfLoading = true;

      // 等待 Vue 渲染完成
      await this.$nextTick();

      // 获取所有 LineChart 的图片
      const lineChartImages = this.lineChartWidgets.map((widget, index) => ({
        name: widget.name,
        image: this.$refs.lineChartRefs?.[index]?.getChartImage() || "" // 逐个获取
      }));

      // 获取所有 PieChart 的图片
      const pieChartImages = this.pieChartWidgets.map((widget, index) => ({
        name: widget.name,
        image: this.$refs.pieChartRefs?.[index]?.getChartImage() || "" // 逐个获取
      }));

      console.log("🖼️ Line Chart Images:", lineChartImages);
      console.log("🖼️ Pie Chart Images:", pieChartImages);

      // 构造要发送给后端的报告数据
      const reportData = {
        qcFormName: this.selectedForm.label,
        startDateTime: this.formatDate(this.dateRange[0]),
        endDateTime: this.formatDate(this.dateRange[1]),
        charts: [
          // 绑定 LineChart 数据
          ...this.lineChartWidgets.map(widget => ({
            chartImage: lineChartImages.find(img => img.name === widget.name)?.image || "",
            chartType: "line",
            min: Math.min(...widget.chartData),
            max: Math.max(...widget.chartData),
            average: (widget.chartData.reduce((sum, val) => sum + val, 0) / widget.chartData.length).toFixed(2),
            total: widget.chartData.length
          })),
          // 绑定 PieChart 数据
          ...this.pieChartWidgets.map(widget => {
            const totalValue = widget.chartData.reduce((sum, val) => sum + val.value, 0); // 计算总值

            return {
              chartImage: pieChartImages.find(img => img.name === widget.name)?.image || "",
              chartType: "pie",
              info: widget.chartData.map(item => ({
                label: item.name,
                count: item.value,
                percentage: totalValue === 0 ? "0.00" : ((item.value / totalValue) * 100).toFixed(2) // 避免除以 0
              })),
              total: totalValue
            };
          })
        ]
      };

      console.log("🚀 发送给后端的报告数据:", reportData);

      // 调用后端 API 生成 PDF
      try {
        await generateQcReport(reportData);
        this.$message.success(translate('FormDataSummary.messages.exportSuccess'));
      } catch (err) {
        console.error("❌ 生成 PDF 失败:", err);
        this.$message.error(translate('FormDataSummary.messages.exportFailed'));
      } finally {
        this.pdfLoading = false;
      }
    },
    exportToExcel() {
      if (!this.qcRecords.length) {
        this.$message.warning(translate('FormDataSummary.messages.noExcelData'));
        return;
      }

      // Exclude `_id` and `created_by`
      const tableData = this.qcRecords.map(record => {
        const { _id, created_by, ...filteredRecord } = record;
        return {
          [translate('Export.systemInfo.submittedAt')]: record.created_at || "-",
          ...filteredRecord
        };
      });

      // Extract headers (excluding `_id` and `created_by`)
      const headers = Object.keys(tableData[0] || {}).map(header =>
          header === "created_at" ? translate('Export.systemInfo.submittedAt') : header
      );

      // Convert JSON to Excel format
      const worksheet = XLSX.utils.json_to_sheet(tableData, {
        header: headers,
        skipHeader: false
      });

      // Create and save workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, this.selectedForm.label + translate('Export.titleSuffix'));

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, this.selectedForm.label + translate('Export.titleSuffix') + ".xlsx");

      this.$message.success(translate('FormDataSummary.messages.exportExcelSuccess'));
    },
    formatDate(date) { // convert to the client local time also to the YYYY-MM-DD HH:MM:SS string in 24 hours
      if (!date) return "";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
    // Add this method inside the methods section
    async deleteRecord(row) {
      try {
        this.$confirm(
            translateWithParams('FormDataSummary.recordTable.deleteConfirmMessage', { id: row._id }),
            translate('FormDataSummary.recordTable.deleteConfirmTitle'),
            {
              confirmButtonText: translate('FormDataSummary.confirm'),
              cancelButtonText: translate('FormDataSummary.cancel'),
              type: "warning",
            }
        ).then(async () => {
          await deleteTaskSubmissionLog(row._id, this.selectedForm.qcFormTemplateId, row["提交时间"]);

          this.qcRecords = this.qcRecords.filter(record => record._id !== row._id);
          this.$message.success(translate('FormDataSummary.recordTable.deleteSuccess'));
        }).catch(() => {
          this.$message.info(translate('FormDataSummary.recordTable.deleteCanceled'));
        });
      } catch (error) {
        console.error("Error deleting record:", error);
        this.$message.error(translate('FormDataSummary.recordTable.deleteFailed'));
      }
    },
    async viewDetails(row) {
      try {
        // 1. Build MongoDB collection name
        const createdAt = new Date(this.formatClientTime(row['提交时间']));
        const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
        const inputCollectionName = `form_template_${this.selectedForm.qcFormTemplateId}_${yearMonth}`;

        // 2. Fetch form document
        const response = await getMyDocument(row._id, this.selectedForm.qcFormTemplateId, row.created_by, inputCollectionName);
        const rawData = response.data;

        // 3. Store meta info
        this.selectedDetails = { ...rawData, submissionId: row._id };

        // 4. Resolve system fields
        this.systemInfo = {
          提交单号: this.selectedDetails.submissionId,
          提交时间: new Date(this.selectedDetails.created_at).toLocaleString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false
          }),
          提交人: await getUserById(this.selectedDetails.created_by).then(res => res.data?.data?.name || "-")
        };

        // TODO: add a basicInfo field includes the 4 fields: 涉及产品，涉及批次，质检人员，所属班次
        this.basicInfo = {
          涉及产品: this.selectedDetails.uncategorized.related_products,
          涉及批次: this.selectedDetails.uncategorized.related_batches,
          质检人员: this.selectedDetails.uncategorized.related_inspectors,
          所属班次: this.selectedDetails.uncategorized.related_shifts
        };

        // // add dummy data first
        // this.basicInfo = {
        //   涉及产品: '土豆条, 红薯球',        // dummy product names
        //   涉及批次: 'BATCH20240401, BATCH20240402',   // dummy batch codes
        //   质检人员: '张三, 李四, 王五',              // dummy inspector names
        //   所属班次: 'A班, B班'                       // dummy shifts
        // };

        // 5. Parse document
        const { groupedDetails, eSignature } = parseFormDocument(this.selectedDetails);
        this.groupedDetails = groupedDetails;
        this.eSignature = eSignature;

        // 6. Open dialog
        this.dialogVisible = true;

      } catch (err) {
        console.error("Error fetching document details:", err);
      }
    },
    closeDetailsDialog() {
      this.dialogVisible = false;
      this.selectedDetails = null;
    },
    async refreshChartData() {
      if (!this.selectedForm || !this.dateRange || this.dateRange.length !== 2) return;

      const formTemplateId = this.selectedForm.qcFormTemplateId;
      const startDateTime = this.formatDate(this.dateRange[0]);
      const endDateTime = this.formatDate(this.dateRange[1]);
      // console log the dates here
      // log formTemplateId
      console.log("📋 Form Template ID:", formTemplateId)
      console.log("📅 Start Date:", startDateTime);
      console.log("📅 End Date:", endDateTime);

      // Reset the arrays before fetching new data
      this.pieChartWidgets = [];
      this.lineChartWidgets = [];

      await this.fetchChartData(formTemplateId, startDateTime, endDateTime);
    },
    getStartOfMonth() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    },
    getEndOfMonth() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    },
    async closeQcRecordsDialog() {
      this.qcRecordsDialogVisible = false;
    },
    updateDateRange() {
      this.openQcRecordsDialog(); // Refresh data when the date range changes
    },
    async selectForm(form) {
      this.selectedForm = form;

      this.isMainDisplayed = this.selectedForm.nodeType !== "folder";

      if (form.qcFormTemplateId) {
        await this.fetchChartData(this.selectedForm.qcFormTemplateId, this.formatDate(this.dateRange[0]), this.formatDate(this.dateRange[1]));
      }
    },
    // TODO: generate the pdf
    async generatePdf(selectedDetails) {
      if (!selectedDetails || !selectedDetails._id) {
        this.$message.error(translate('FormDataSummary.messages.selectRecordToExport'));
        return;
      }

      try {
        const createdAt = new Date(selectedDetails.created_at);
        const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");

        const inputCollectionName = `form_template_${this.selectedForm.qcFormTemplateId}_${yearMonth}`;

        const response = await exportDocumentToPDF(
            selectedDetails.submissionId,
            this.selectedForm.qcFormTemplateId,
            selectedDetails.created_by,
            inputCollectionName
        );

        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `task_submission_${selectedDetails.submissionId}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.$message.success("PDF 下载成功!");
      } catch (err) {
        console.error("Error generating PDF:", err);
        this.$message.error("PDF 下载失败，请重试!");
      }
    },
    async fetchChartData(formTemplateId, startDateTime, endDateTime) {
      this.loadingCharts = true; // Start loading indicator

      try {
        // Call extractWidgetDataWithCounts with formTemplateId
        const countResponse = await extractWidgetDataWithCounts(formTemplateId, startDateTime, endDateTime);

        // Function to convert UTC timestamp to client local time
        const convertToLocalTime = (utcDateTime) => {
          const utcDate = new Date(utcDateTime + "Z"); // Ensure it's treated as UTC
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          return utcDate.toLocaleString("zh-CN", { timeZone: userTimezone, hour12: false });
        };

        // Process PieChart widgets (for option-based items)
        this.pieChartWidgets = countResponse.data
            .filter(widget => widget.optionItems.length > 0) // Only include widgets with options
            .map(widget => ({
              name: widget.name,
              label: widget.label,
              chartData: widget.optionItems.map(option => ({
                name: option.label,
                value: option.count
              }))
            }));

        // Process LineChart widgets (for number-type items)
        this.lineChartWidgets = countResponse.data
            .filter(widget => widget.type === "number") // Filter out only number fields
            .map(widget => ({
              name: widget.name,
              label: widget.label,
              chartData: widget.chartData, // Directly use extracted numerical data
              xaxisData: widget.xaxisData.map(convertToLocalTime) // Convert x-axis timestamps to local time
            }));

      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        this.loadingCharts = false; // Stop loading indicator
      }
    },
    async fetchQcRecordsData(formTemplateId, startDateTime, endDateTime) {
      if (!formTemplateId) {
        console.error("No formTemplateId selected");
        return;
      }

      try {
        const response = await fetchQcRecords(formTemplateId, startDateTime, endDateTime);
        this.qcRecords = response.data;

        // Ensure column headers remain in sync
        if (Array.isArray(this.qcRecords) && this.qcRecords.length > 0) {
          let headers = Object.keys(this.qcRecords[0]);

          // Move `_id` to the last column and remove `created_by`
          headers = headers.filter(header => header !== "_id" && header !== "created_by");

          // Rename `created_at` to `提交时间`
          headers = headers.map(header => (header === "created_at" ? "提交时间" : header));

          headers.push("_id"); // Ensure `_id` is last
          this.reorderedColumnHeaders = headers;

          // Format `created_at` correctly
          this.qcRecords = this.qcRecords.map(record => {
            if (record.created_at) {
              const localDate = new Date(record.created_at);
              const formattedDate = localDate.toLocaleString("zh-CN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }).replace(/\//g, "-");

              record["提交时间"] = formattedDate;
              delete record.created_at;
            }
            return record;
          });
        }
      } catch (error) {
        console.error("Error fetching QC records:", error);
      } finally {
        this.loadingQcRecords = false;
      }
    },

    async handleDateRangeChange() {
      if (!this.dateRange || this.dateRange.length !== 2) return;

      const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;
      const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
      const startDateTime = formatDate(this.dateRange[0]);
      const endDateTime = formatDate(this.dateRange[1]);

      await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
    },

    // async openQcRecordsDialog() {
    //   this.qcRecordsDialogVisible = true;
    //
    //   const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;
    //   const now = new Date();
    //   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    //   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    //
    //   const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
    //   const startDateTime = formatDate(startOfMonth);
    //   const endDateTime = formatDate(endOfMonth);
    //
    //   await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
    // }

    async openQcRecordsDialog() {
      this.qcRecordsDialogVisible = true;
      this.loadingQcRecords = true;

      await nextTick(); // Wait until the DOM updates before rendering

      const observer = new MutationObserver((mutations, obs) => {
        const groupHeaders = document.querySelectorAll('.group-header .cell');
        if (groupHeaders.length > 0) {
          groupHeaders.forEach(header => {
            header.style.fontWeight = 'bold';
            header.style.fontSize = '16px';
            header.style.color = '#606266'
          });
          obs.disconnect(); // Stop observing once changes are applied
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      const formTemplateId = this.selectedForm ? this.selectedForm.qcFormTemplateId : null;

      // convert these two time to YYYY-MM-DD HH:SS:MM strings
      const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");
      let startDateTime = formatDate(this.dateRange[0]);
      let endDateTime = formatDate(this.dateRange[1]);

      await this.fetchQcRecordsData(formTemplateId, startDateTime, endDateTime);
      this.loadingQcRecords = false;
    }

  },
};
</script>

<style scoped>

  .form-header {
    display: flex;
    justify-content: space-between; /* Left and Right Alignment */
    align-items: center; /* Vertically Center */
  }

  .chart-card {
    margin: 20px 0;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .chart-card.hover-effect:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .el-table {
    overflow-x: auto;
    display: block;
    max-width: 100%;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .group-header .cell {
    font-weight: bold !important;
    font-size: 16px; /* Adjust the size as needed */
    text-align: center;
  }
</style>
