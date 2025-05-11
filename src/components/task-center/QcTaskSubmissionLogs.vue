<template>
  <el-container>
    <el-header class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <!-- Left Section: Title and Refresh Button -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <h2 style="margin: 0;">{{ title }}</h2>
          <el-tooltip content="Refresh table" placement="top">
            <el-button
                class="refresh-button"
                type="primary"
                style="margin-top: 0"
                circle
                @click="refreshTable"
            >
              <el-icon style="color: #004085;"><RefreshRight /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- Right Section: Search Input -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- make this button vertically align center -->
<!--          <el-tooltip>-->
<!--            <el-button-->
<!--                type="success"-->
<!--                style="margin-top: 0"-->
<!--                @click="downloadExcel"-->
<!--            >-->
<!--              导出 Excel-->
<!--            </el-button>-->
<!--            <template #content>-->
<!--              <span>下载你的质检提交记录</span>-->
<!--            </template>-->
<!--          </el-tooltip>-->
          <el-input
              v-model="searchTerm"
              :placeholder="translate('qcTaskSubmissionLogs.searchPlaceholder')"
              clearable
              style="width: 300px;"
              @input="applyFilter"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
    </el-header>
    <el-main>
      <el-table
          :data="paginatedData"
          border
          style="width: 100%;"
      >
        <el-table-column
            v-for="key in columnList.filter(k => k !== 'created_by')"
            :key="key"
            :prop="key"
            :label="columnHeaders[key]"
            :width="columnWidths[key]"
        >
        </el-table-column>

        <!-- Operations -->
        <el-table-column fixed="right" :label="translate('common.table.actions')" width="120px">
          <template #default="scope">
            <el-button
                link
                type="primary"
                size="small"
                @click="viewDetails(scope.row)"
            >
              {{ translate('common.view') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
          style="margin-top: 10px"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 30, 40]"
          layout="total, sizes, prev, pager, next"
          :total="filteredData.length"
      />
    </el-main>
  </el-container>

  <el-dialog :title="this.title" v-model="dialogVisible" width="50%" @close="closeDetailsDialog">
    <el-scrollbar max-height="500px">
      <div v-for="(fields, category) in groupedDetails" :key="category">
        <el-descriptions :title="category" border style="margin-top: 10px; margin-bottom: 10px">
          <el-descriptions-item v-for="(value, key) in fields" :key="key" :label="key">
            {{ Array.isArray(value) ? value.join(', ') : (value || " - ") }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-descriptions :title="translate('qcTaskSubmissionLogs.systemInfoGroupTitle')" border style="margin-top: 10px">
        <el-descriptions-item :label="translate('qcTaskSubmissionLogs.submitter')">{{ systemInfo.提交人 || " - " }}</el-descriptions-item>
        <el-descriptions-item :label="translate('qcTaskSubmissionLogs.submittedAt')">{{ systemInfo.提交时间 || " - " }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="eSignature && eSignature.startsWith('data:image')" style="margin-top: 20px;">
        <h3>{{ translate('qcTaskSubmissionLogs.signatureTitle') }}</h3>
        <img :src="eSignature" alt="e-signature" style="width: 300px; height: auto;" />
      </div>
    </el-scrollbar>
    <template #footer>
      <el-button type="info" @click="closeDetailsDialog">{{ translate('qcTaskSubmissionLogs.cancelButton') }}</el-button>
      <el-button type="primary" @click="newExportToPdf">{{ translate('qcTaskSubmissionLogs.exportButton') }}</el-button>
    </template>
  </el-dialog>

</template>

<script>
import {Download, RefreshRight, Search} from "@element-plus/icons-vue";
import {
  exportDocumentsToExcel,
  exportDocumentToPDF,
  getAllTaskLogs,
  getMyDocument
} from "@/services/qcTaskSubmissionLogsService"; // Import the backend service
import { formatDate } from "@/utils/task-center/dateFormatUtils";
import TaskDetail from "@/components/task-center/TaskDetail.vue";
import { getUserById } from "@/services/userService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import callAddBoldFont from "@/assets/simfang-bold.js";
import {translate} from "@/utils/i18n";

export default {
  name: "QcTaskSubmissionLogs",
  components: {
    Download,
    TaskDetail,
    RefreshRight,
    Search,
  },
  props: {
    createdBy: {
      type: String,
      required: true,
    },
    dispatchedTaskId: {
      type: String,
      required: true,
    },
    taskName: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      title: this.taskName,
      selectedIds: {
        qc_form_template_id: null,
        submission_id: null,
        inputCollectionName: null
      },
      selectedForm: null, // 选中的表单
      systemInfo: {}, // 存储提交信息
      groupedDetails: {}, // 按类别整理的数据
      searchTerm: "",
      tableData: [], // Backend data
      filteredData: [],
      dialogVisible: false,
      eSignature: null,
      selectedDetails: null, // Stores the selected details for the dialog
      columnList: [
        "id",
        "submission_id",
        "created_at",
        "created_by",
        "dispatched_task_id",
        "qc_form_template_id",
        "comment",
        // "status",
      ],
      columnHeaders: {
        id: translate("qcTaskSubmissionLogs.tableHeaders.id"),
        submission_id: translate("qcTaskSubmissionLogs.tableHeaders.submission_id"),
        created_at: translate("qcTaskSubmissionLogs.tableHeaders.created_at"),
        created_by: translate("qcTaskSubmissionLogs.tableHeaders.created_by"),
        comment: translate("qcTaskSubmissionLogs.tableHeaders.comment"),
        dispatched_task_id: translate("qcTaskSubmissionLogs.tableHeaders.dispatched_task_id"),
        qc_form_template_id: translate("qcTaskSubmissionLogs.tableHeaders.qc_form_template_id"),
        status: translate("qcTaskSubmissionLogs.tableHeaders.status")
      },
      columnWidths: {
        id: "100px",
        submission_id: "300px",
        created_at: "200px",
        created_by: "150px",
        comment: "600px",
        dispatched_task_id: "200px",
        qc_form_template_id: "200px",
        status: "100px",
      },
      currentPage: 1,
      pageSize: 20,
      qc_form_template_id: null,
    };
  },
  computed: {
    filteredDetails() {
      return Object.fromEntries(
          Object.entries(this.selectedDetails).filter(([key]) => key !== '_id' && key !== 'created_at' && key !== 'created_by')
      );
    },
    columns() {
      // Split the details into arrays of 10 items each for each column
      const entries = Object.entries(this.filteredDetails); // Convert object to [key, value] pairs
      const result = [];
      for (let i = 0; i < entries.length; i += 10) {
        result.push(Object.fromEntries(entries.slice(i, i + 10))); // Create a new object for each column
      }
      return result;
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredData.slice(start, end);
    },
  },
  methods: {
    translate,
    async newExportToPdf() {
      try {
        const doc = new jsPDF();
        callAddBoldFont.apply(doc);
        doc.setFont("simfang", "bold");

        let y = 10;
        const title = this.title;
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(title);
        doc.text(title, (pageWidth - textWidth) / 2, y);
        y += 10;

        Object.entries(this.groupedDetails).forEach(([category, fields]) => {
          doc.setFontSize(14);
          doc.text(category, 10, y);
          y += 6;

          const tableData = Object.entries(fields).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(", ") : value || " - ",
          ]);

          autoTable(doc, {
            startY: y,
            head: [[translate("qcTaskSubmissionLogs.exportPdf.tableHead.0"), translate("qcTaskSubmissionLogs.exportPdf.tableHead.1")]],
            body: tableData,
            theme: "grid",
            styles: { font: "simfang", fontSize: 10 },
            headStyles: { font: "simfang", fontStyle: 'bold', fontSize: 12, fillColor: [0, 133, 164] },
          });

          y = doc.lastAutoTable.finalY + 10;
        });

        doc.setFontSize(14);
        doc.text(translate("qcTaskSubmissionLogs.exportPdf.groupTitle"), 10, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [[translate("qcTaskSubmissionLogs.exportPdf.tableHead.0"), translate("qcTaskSubmissionLogs.exportPdf.tableHead.1")]],
          body: [
            [translate("qcTaskSubmissionLogs.exportPdf.submitter"), this.systemInfo.提交人 || " - "],
            [translate("qcTaskSubmissionLogs.exportPdf.submittedAt"), this.systemInfo.提交时间 || " - "],
            [translate("qcTaskSubmissionLogs.exportPdf.submissionId"), this.systemInfo.提交单号 || " - "]
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
          doc.text(translate("qcTaskSubmissionLogs.exportPdf.signatureTitle"), 10, y);
          y += 10;

          doc.addImage(signatureImg, 'PNG', 10, y, imgWidth, imgHeight);
          y += imgHeight + 10;
        }

        doc.save(`${this.title}.pdf`);
        this.$message.success(translate("qcTaskSubmissionLogs.exportPdf.successMessage"));
      } catch (err) {
        console.error("PDF 生成失败:", err);
        this.$message.error(translate("qcTaskSubmissionLogs.exportPdf.failMessage"));
      }
    },
    async fetchTableData() {
      try {
        const response = await getAllTaskLogs(this.createdBy, this.dispatchedTaskId);
        // get the qc_form_template_id from the first row of the response
        this.qc_form_template_id = response.data[0].qc_form_template_id;
        // Map response to the fields used in the table
        this.tableData = response.data.map((log) => ({
          id: log.id,
          submission_id: log.submission_id || " - ",
          created_at: formatDate(log.created_at) || " - ",
          created_by: log.created_by || " - ",
          comment: log.comment || " - ",
          dispatched_task_id: log.dispatched_task_id || " - ",
          qc_form_template_id: log.qc_form_template_id || " - ",
          status: log.status,
        }));
        this.filteredData = [...this.tableData]; // Apply the fetched data to filteredData
        // console log the table data
        console.log("table data: ")
        console.log(this.tableData)
      } catch (err) {
        console.error("Error fetching task logs:", err);
      }
    },
    async downloadExcel() {
      // This will call the excel_documents_for_user endpoint by providing qcFormTemplateId and user id.
      this.isLoading = true; // Set loading indicator
      try {
        console.log("Downloading Excel...");
        console.log("qc_form_template_id: ", this.qc_form_template_id);
        console.log("user id: ", this.$store.getters.getUser.id);
        const response = await exportDocumentsToExcel(
            this.qc_form_template_id,
            this.$store.getters.getUser.id
        );

        const excelData = response.data;
        const blob = new Blob([excelData], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // change the name to task_logs_currentdatetime
        const currentDateTime = new Date().toISOString().replace(/[-:.]/g, '');
        const fileName = `task_logs_${currentDateTime}.xlsx`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // Clean up the DOM
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        this.$message.success("Excel downloaded successfully!");
      } catch (err) {
        console.error("Error downloading Excel:", err);
        // Show error message
        this.$message.error("Failed to download Excel. Please try again.");
      } finally {
        this.isLoading = false; // Reset loading indicator
      }
    },
    refreshTable() {
      console.log("Refreshing table...");
      this.fetchTableData(); // Fetch fresh data
    },
    applyFilter() {
      const term = this.searchTerm.trim().toLowerCase();
      this.filteredData = this.tableData.filter(
          (row) =>
              row.id.toString().includes(term) || row.submission_id.toLowerCase().includes(term)
      );
    },
    async viewDetails(row) {
      try {
        const createdAt = new Date(row['created_at']);
        const yearMonth = createdAt.getFullYear().toString() + (createdAt.getMonth() + 1).toString().padStart(2, "0");
        const inputCollectionName = `form_template_${row.qc_form_template_id}_${yearMonth}`;

        // **获取数据**
        const response = await getMyDocument(row.submission_id, row.qc_form_template_id, row.created_by, inputCollectionName);
        this.selectedDetails = { ...response.data, "submissionId": row.submission_id };

        // **提取基本信息**
        this.systemInfo = {
          提交单号: this.selectedDetails.submissionId,
          提交时间: new Date(this.selectedDetails.created_at).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          }),
          提交人: await getUserById(this.selectedDetails.created_by).then(response => response.data?.data?.name || '-')
        };

        // **整理数据**
        const grouped = {};
        let eSignatureFound = false;  // Track if e-signature was found
        Object.entries(this.selectedDetails).forEach(([key, value]) => {
          if (["_id", "created_at", "created_by", "submissionId"].includes(key)) return; // 忽略基础字段

          console.log("Key:", key, "Value:", value)
          if (value['e-signature']) {
            console.log("Found e-signature:", value['e-signature']);
            this.eSignature = value['e-signature'];  // Store the base64 image string for rendering
            eSignatureFound = true;
            return;
          }

          if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            grouped[key] = value; // 如果是对象，归类到单独分区
          } else {
            if (!grouped["uncategorized"]) {
              grouped["uncategorized"] = {};
            }
            grouped["uncategorized"][key] = value;
          }
        });

        // Clear e-signature if not found in this record
        if (!eSignatureFound) {
          this.eSignature = null;
        }

        this.groupedDetails = grouped;
        this.dialogVisible = true;
      } catch (err) {
        console.error("获取详情失败:", err);
      }
    },
    // async downloadPdf() {
    //   try {
    //     const response = await exportDocumentToPDF(
    //         this.selectedIds.submission_id,
    //         this.selectedIds.qc_form_template_id,
    //         this.$store.getters.getUser.id,
    //         this.selectedIds.inputCollectionName
    //     );
    //
    //     const pdfBlob = new Blob([response.data], { type: "application/pdf" });
    //     const url = window.URL.createObjectURL(pdfBlob);
    //     const link = document.createElement("a");
    //     link.href = url;
    //     link.setAttribute("download", `task_submission_${this.selectedDetails.submission_id}.pdf`);
    //     document.body.appendChild(link);
    //     link.click();
    //
    //     document.body.removeChild(link);
    //     window.URL.revokeObjectURL(url);
    //     this.$message.success("PDF 下载成功!");
    //   } catch (err) {
    //     console.error("Error downloading PDF:", err);
    //     this.$message.error("PDF 下载失败，请重试!");
    //   }
    // },
    async downloadPdf() {
      try {
        const doc = new jsPDF();
        callAddBoldFont.apply(doc); // 添加这行
        doc.setFont("simfang", "bold"); // 设置加粗字体

        let y = 10;

        // **Add Title (Centered, Bold)**
        const title = `${this.selectedDetails?.submission_id} 提交记录`;
        doc.setFontSize(16);
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(title);
        doc.text(title, (pageWidth - textWidth) / 2, y);
        y += 10;

        // **Loop through all grouped details and export them**
        Object.entries(this.filteredDetails).forEach(([category, fields]) => {
          doc.setFontSize(14);
          doc.text(category, 10, y); // **Section Title**
          y += 6;

          Object.entries(fields).forEach(([key, value]) => {
            doc.setFontSize(12);
            doc.text(`${key}:`, 10, y);
            doc.setFont("simfang", "normal"); // 设置普通字体
            doc.text(Array.isArray(value) ? value.join(", ") : value || " - ", 50, y);
            y += 6;
          });

          y += 4; // Extra spacing after section
        });

        // **Save PDF**
        doc.save(`${this.selectedDetails?.submission_id}-提交记录.pdf`);
        this.$message.success("PDF 下载成功!");
      } catch (err) {
        console.error("Error downloading PDF:", err);
        this.$message.error("PDF 下载失败，请重试!");
      }
    },
    // Close the details dialog
    closeDetailsDialog() {
      this.dialogVisible = false; // Close the dialog
      this.currentTask = null; // Reset currentTask
      this.selectedDetails = {};
    },
    handlePageSizeChange(newSize) {
      this.pageSize = newSize;
    },
    handlePageChange(newPage) {
      this.currentPage = newPage;
    },
  },
  mounted() {
    this.fetchTableData(); // Fetch data on mount
  },
};
</script>


<style scoped>
.header {
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdcdc;
}

.refresh-button {
  background-color: #80cfff;
  border-color: #80cfff;
}

.refresh-button:hover {
  background-color: #66b5ff;
  border-color: #66b5ff;
  transform: rotate(360deg);
  transition: transform 0.3s ease-in-out, background-color 0.2s ease;
}
</style>
