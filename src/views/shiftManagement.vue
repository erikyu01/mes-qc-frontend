<template>
  <div style="display: flex; flex-direction: column; max-width: 100%;">
    <!-- Top Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <!-- Title, Search Box -->
      <div style="display: flex; align-items: center;">
        <h2>{{ translate('shiftManagement.title') }}</h2>
        <el-input
            v-model="searchQuery"
            :placeholder="translate('shiftManagement.searchPlaceholder')"
            clearable
            style="width: 300px; margin-left: 20px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- Refresh & Add Button -->
      <div style="display: flex; gap: 10px;">
        <el-tooltip :content="translate('shiftManagement.refreshTooltip')" placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="handleRefreshButton"
          >
            <el-icon style="color: #004085;">
              <RefreshRight />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-button type="primary" @click="openDialog()">
          {{ translate('shiftManagement.addShift') }}
        </el-button>
      </div>
    </div>

    <!-- Shift List -->
    <ShiftList
        :shifts="shifts"
        @edit-shift="openDialog"
        @delete-shift="confirmDelete"
        :search-input="searchQuery"
        :user-map="userMap"
    />

    <!-- Dialog for Create/Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? translate('shiftManagement.editShift') : translate('shiftManagement.addShift')"
        :close-on-click-modal="false"
    >
      <ShiftForm
          :shift="shiftForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import {createShift, deleteShift, getAllShifts, updateShift} from "@/services/shiftService";
import {fetchUsers} from "@/services/userService";
import ShiftList from "@/components/shift/ShiftList.vue";
import ShiftForm from "@/components/shift/ShiftForm.vue";
import {translate} from "@/utils/i18n";
import {RefreshRight, Search} from "@element-plus/icons-vue";
import dayjs from "dayjs";

export default {
  components: { RefreshRight, Search, ShiftList, ShiftForm },
  data() {
    return {
      shifts: [],
      searchQuery: "",
      dialogVisible: false,
      isEditMode: false,
      shiftForm: {
        id: null,
        name: "",
        description: "",
        start_time: "",
        end_time: "",
        grace_minute: 0,
      },
      userMap: {},
    };
  },
  methods: {
    translate,
    openDialog(shiftRow = null) {
      this.isEditMode = !!shiftRow;
      this.shiftForm = shiftRow
          ? { ...shiftRow} :
          {
            id: null,
            name: "",
            description: "",
            start_time: null,
            end_time: null,
            grace_minute: 0,
          };

      this.shiftForm.start_time = this.shiftForm.start_time ? new Date(`1970-01-01T${this.shiftForm.start_time}`) : null;
      this.shiftForm.end_time = this.shiftForm.end_time ? new Date(`1970-01-01T${this.shiftForm.end_time}`) : null;
      this.dialogVisible = true;
    },
    toOffsetTime(rawTime) {
      if (!rawTime) return null;

      try {
        const validOffsetTimePattern = /^\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
        const validRawTimePattern = /^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{2}:\d{2}:\d{2} GMT[+-]\d{4} \([\w\s]+\)$/;

        // If already in the desired format, return it directly
        if (validOffsetTimePattern.test(rawTime)) {
          return rawTime;
        }

        // If in raw valid format, parse and retain timezone
        if (validRawTimePattern.test(rawTime)) {
          const date = dayjs(rawTime).tz(dayjs.tz.guess()); // Parse with user's local timezone
          return date.format("HH:mm:ssZ");
        }

        // If ISO 8601 format, convert to desired offset time
        if (dayjs(rawTime, dayjs.ISO_8601, true).isValid()) {
          const date = dayjs(rawTime);
          return date.format("HH:mm:ssZ");
        }

        console.error(`Unsupported time format: ${rawTime}`);
        return null;
      } catch (error) {
        console.error(`Error formatting time: ${rawTime}`, error);
        return null;
      }
    },
    async loadShifts() {
      try {
        const response = await getAllShifts();
        this.shifts = response.data?.data || [];
      } catch (error) {
        console.error("Failed to load shifts:", error);
        this.shifts = [];
      }
    },
    async loadUserMap() {
      try {
        const response = await fetchUsers();
        this.userMap = response.data.data.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {});
      } catch (error) {
        this.$message.error(translate("orderManagement.messages.errorLoadingUsersData"));
      }
    },
    async submitForm(updatedShift) {
      try {
        const offsetTimeStartTime = this.toOffsetTime(updatedShift.start_time);
        const offsetTimeEndTime = this.toOffsetTime(updatedShift.end_time);
        updatedShift.start_time = offsetTimeStartTime;
        updatedShift.end_time = offsetTimeEndTime;

        // TODO: delete logging after testing
        console.log(updatedShift);

        if (this.isEditMode) {
          await updateShift(updatedShift.id, updatedShift);
        } else {
          await createShift(updatedShift);
        }
        this.dialogVisible = false;
        await this.loadShifts();
      } catch (error) {
        console.error("Error saving shift:", error);
      }
    },
    async confirmDelete(id) {
      try {
        await this.$confirm(
            translate("orderManagement.messages.deleteConfirmation"),
            translate("orderManagement.messages.messageTitle"),
            {
              confirmButtonText: translate("orderManagement.confirm"),
              cancelButtonText: translate("orderManagement.cancel"),
              type: "warning",
            }
        );
        const currentUserId = this.$store.getters.getUser.id; // Get logged-in user ID
        await deleteShift(id, currentUserId);
        await this.loadShifts();
      } catch (error) {
        console.error("Error deleting shift:", error);
      }
    },
    async handleRefreshButton() {
      this.searchQuery = "";
      await this.loadShifts();
      this.$notify({
        title: translate("orderManagement.messages.messageTitle"),
        message: translate("orderManagement.messages.listRefreshed"),
        type: "success",
      });
    },
  },
  mounted() {
    this.loadShifts();
    this.loadUserMap();
  },
};
</script>

<style scoped>
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
.refresh-button el-icon {
  color: #004085;
}
</style>

