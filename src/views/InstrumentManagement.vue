<template>
  <div style="display: flex; flex-direction: column; max-width: 100%;">
    <!-- Top Section -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <!-- Title, Search Box -->
      <div style="display: flex; align-items: center;">
        <h2>{{ translate('instrumentManagement.title') }}</h2>
        <!-- Search Bar -->
        <el-input
            v-model="searchQuery"
            :placeholder="translate('common.searchPlaceholder')"
            clearable
            style="width: 300px; margin-left: 20px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <!-- Refresh, Add Button -->
      <div style="display: flex; gap: 10px;">
        <el-tooltip
            :content="translate('orderManagement.refreshList')"
            placement="top">
          <el-button
              class="refresh-button"
              type="primary"
              circle
              @click="handleRefreshButton"
          >
            <el-icon
                style="color: #004085;">
              <RefreshRight />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-button
            type="primary"
            @click="openDialog()"
        >
          {{ translate('common.addButton') }}
        </el-button>
      </div>
    </div>

    <!-- Instrument List -->
    <InstrumentList
        :instruments="instruments"
        @edit-instrument="openDialog"
        @delete-instrument="confirmDelete"
        :search-input="searchQuery"
        :user-map="userMap"
    />

    <!-- Dialog for Create / Edit -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEditMode ? translate('instrumentManagement.editInstrument') : translate('instrumentManagement.addInstrument')"
        :close-on-click-modal="false"
    >
      <InstrumentForm
          :instrument="instrumentForm"
          :is-edit-mode="isEditMode"
          @submit="submitForm"
          @cancel="dialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getAllInstruments, createInstrument, updateInstrument, deleteInstrument } from "@/services/instrumentService";
import {RefreshRight, Search} from "@element-plus/icons-vue";
import InstrumentList from "@/components/instrument/instrumentList.vue";
import InstrumentForm from "@/components/instrument/instrumentForm.vue";
import {translate, translateWithParams} from "@/utils/i18n";
import {fetchUsers} from "@/services/userService";

export default {
  components: { RefreshRight, Search, InstrumentList, InstrumentForm },
  data() {
    return {
      instruments: [],
      searchQuery: "",
      dialogVisible: false,
      isEditMode: false,
      instrumentForm: {
        id: null,
        name: "",
        type: "",
        manufacturer: "",
        modelNumber: "",
        description: "",
      },
      userMap: {},
    };
  },
  methods: {
    translate,
    async loadInstruments() {
      try {
        const response = await getAllInstruments();
        if (response.data && response.data.data) {
          this.instruments = response.data.data;  // Extract only the `data` array
        } else {
          this.instruments = []; // Ensure instruments is always an array
        }
      } catch (error) {
        console.error("Failed to load instruments:", error);
        this.instruments = []; // Fallback to an empty array in case of error
      }
    },
    async loadUserMap() {
      try {
        const response = await fetchUsers();
        const updatedUserMap = response.data.data.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {});

        if (JSON.stringify(this.userMap) !== JSON.stringify(updatedUserMap)) {
          this.userMap = updatedUserMap;
        }
      } catch (error) {
        this.$message.error(translate('orderManagement.messages.errorLoadingUsersData'));
      }
    },
  openDialog(instrument = null) {
      this.isEditMode = !!instrument;
      this.instrumentForm = instrument ? { ...instrument } : {
        name: "",
        type: "",
        manufacturer: "",
        modelNumber: "",
        description: "",
      };
      this.dialogVisible = true;
    },
    async submitForm(updatedInstrument) {
      try {
        console.log(updatedInstrument);
        if (this.isEditMode) {
          await updateInstrument(updatedInstrument.id, updatedInstrument);
        } else {
          await createInstrument(updatedInstrument);
        }
        this.dialogVisible = false;
        await this.loadInstruments();
      } catch (error) {
        console.error("Error saving instrument:", error);
      }
    },
    async confirmDelete(id) {
      try {
        await this.$confirm(translate('orderManagement.messages.deleteConfirmation'), translate('orderManagement.messages.messageTitle'), {
          confirmButtonText: translate('orderManagement.confirm'),
          cancelButtonText: translate('orderManagement.cancel'),
          type: "warning",
        });
        const currentUserId = this.$store.getters.getUser.id; // Get logged-in user ID
        await deleteInstrument(id, currentUserId);
        await this.loadInstruments();
      } catch (error) {
        console.error("Error deleting instrument:", error);
      }
    },
    async handleRefreshButton() {
      this.searchQuery = "";
      await this.loadInstruments()
      this.$notify({
        title: translate('orderManagement.messages.messageTitle'),
        message: translate('orderManagement.messages.listRefreshed'),
        type: "success",
      });
    },

  },
  mounted() {
    this.loadInstruments();
    this.loadUserMap();
  }
};
</script>

<style scoped>

.refresh-button {
  background-color: #80cfff; /* Slightly lighter shade of primary color */
  border-color: #80cfff; /* Match lighter background */
}

.refresh-button:hover {
  background-color: #66b5ff; /* Slightly darker hover effect */
  border-color: #66b5ff;
  transform: rotate(360deg); /* Rotate on hover */
  transition: transform 0.3s ease-in-out, background-color 0.2s ease; /* Smooth animation */
}

.refresh-button el-icon {
  color: #004085; /* Darker primary-like color for the refresh icon */
}
</style>
