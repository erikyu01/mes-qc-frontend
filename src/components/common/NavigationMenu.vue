<template>
  <div :class="['sidebar', { 'collapsed': isCollapsed }]">
    <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
        router
        :collapse="isCollapsed"
    >
      <el-scrollbar>
        <div class="menu-container">
          <!-- 顶部菜单栏，添加可折叠按钮 -->
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <template v-if="!isCollapsed" #title>{{ translate('navigationMenu.home') }}</template>
            <el-tooltip
                :content="translate('navigationMenu.collapse')"
                placement="right"
                :hide-after="0"
            >
              <el-icon v-if="!isCollapsed" class="collapse-icon" @click="toggleCollapse($event)">
                <DArrowLeft />
              </el-icon>
            </el-tooltip>
          </el-menu-item>

          <!-- 仅管理员可见的菜单 -->
          <template v-if="[1, 4].includes(user.role.id)">
            <el-sub-menu index="2">
              <template #title>
                <el-icon><User /></el-icon>
                <span v-if="!isCollapsed">{{ translate('navigationMenu.systemManagement') }}</span>
              </template>
              <el-menu-item index="/user-management">
                <el-icon><User /></el-icon>
                <span>{{ translate('navigationMenu.userManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/team-management">
                <el-icon><User /></el-icon>
                <span>{{ translate('navigationMenu.teamManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/shift-management">
                <el-icon><User /></el-icon>
                <span>{{ translate('navigationMenu.shiftManagement') }}</span>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="3">
              <template #title>
                <el-icon><List /></el-icon>
                <span v-if="!isCollapsed">{{ translate('navigationMenu.qualityManagement') }}</span>
              </template>
              <el-menu-item index="/quality-form-management">
                <el-icon><Document /></el-icon>
                <span >{{ translate('navigationMenu.formManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/form-designer">
                <el-icon><Edit /></el-icon>
                <span>{{ translate('navigationMenu.formDesigner') }}</span>
              </el-menu-item>
              <el-menu-item index="/form-access-calendar">
                <el-icon><Calendar /></el-icon>
                <span>{{ translate('navigationMenu.formAccessCalendar') }}</span>
              </el-menu-item>
              <el-menu-item index="/task-assignment">
                <el-icon><Files /></el-icon>
                <span>{{ translate('navigationMenu.dispatchManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/instrument-management">
                <el-icon><TakeawayBox /></el-icon>
                <span>{{ translate('navigationMenu.instrumentManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/test-subject-management">
                <el-icon><Collection /></el-icon>
                <span>{{ translate('navigationMenu.testSubjectManagement') }}</span>
              </el-menu-item>
              <el-menu-item index="/sampling-location-management">
                <el-icon><Location /></el-icon>
                <span>{{ translate('navigationMenu.samplingLocationManagement') }}</span>
              </el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="4">
              <template #title>
                <el-icon><DataAnalysis /></el-icon>
                <span v-if="!isCollapsed">{{ translate('navigationMenu.dataSummary') }}</span>
              </template>
              <el-menu-item index="/form-data-summary">
                <el-icon><Document /></el-icon>
                <span>{{ translate('navigationMenu.formDataSummary') }}</span>
              </el-menu-item>
              <el-menu-item index="/alarm-records">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ translate('navigationMenu.alarmRecords') }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>

          <!-- 任务中心 (所有角色可见) -->
          <el-sub-menu index="5">
            <template #title>
              <el-icon><Collection /></el-icon>
              <span v-if="!isCollapsed">{{ translate('navigationMenu.taskCenter') }}</span>
            </template>
            <el-menu-item index="/task-center-dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>{{ translate('navigationMenu.taskDashboard') }}</span>
            </el-menu-item>
            <el-menu-item index="/form-access-calendar" v-if="[2, 3].includes(user.role.id)">
              <el-icon><Calendar /></el-icon>
              <span>{{ translate('navigationMenu.formAccessCalendar') }}</span>
            </el-menu-item>
            <el-menu-item index="/pending-tasks">
              <el-icon><Document /></el-icon>
              <span>{{ translate('navigationMenu.pendingTasks') }}</span>
            </el-menu-item>
            <el-menu-item index="/current-tasks">
              <el-icon><Document /></el-icon>
              <span>{{ translate('navigationMenu.todayTasks') }}</span>
            </el-menu-item>
            <el-menu-item index="/future-tasks">
              <el-icon><List /></el-icon>
              <span>{{ translate('navigationMenu.futureTasks') }}</span>
            </el-menu-item>
            <el-menu-item index="/history-tasks">
              <el-icon><Files /></el-icon>
              <span>{{ translate('navigationMenu.historyTasks') }}</span>
            </el-menu-item>
            <el-menu-item index="/overdue-tasks">
              <el-icon><Warning /></el-icon>
              <span>{{ translate('navigationMenu.overdueTasks') }}</span>
            </el-menu-item>
    <!--        <el-menu-item index="/task-calendar">-->
    <!--          <el-icon><Calendar /></el-icon>-->
    <!--          <span>{{ translate('navigationMenu.taskCalendar') }}</span>-->
    <!--        </el-menu-item>-->
          </el-sub-menu>
        </div>
      </el-scrollbar>

      <!-- 用户信息显示在 Navbar 底部 -->
      <div v-if="!isCollapsed" class="user-info">
        <el-divider />
        <div class="user-details">
<!--          <el-tooltip content="Edit User" placement="top">-->
<!--            <el-icon class="edit-icon-wrapper" @click="openEditDialog" :size="20">-->
<!--              <Edit />-->
<!--            </el-icon>-->
<!--          </el-tooltip>-->
          <el-icon size="20px"><User /></el-icon>
          <span class="username">{{ user.name }}</span>
        </div>
        <div class="user-role">{{ roleName }}</div>

        <!-- Logout Button with Tooltip and Hover Effect -->
        <el-tooltip :content="translate('navigationMenu.logout')" placement="top">
          <el-icon class="logout-icon" @click="handleLogout">
            <SwitchButton />
          </el-icon>
        </el-tooltip>
      </div>

    </el-menu>

    <el-tooltip
      :content="translate('navigationMenu.expand')"
      placement="right"
      :hide-after="0"
      :disabled="!showExpandButton"
    >
      <el-button
          class="expand-button"
          v-if="showExpandButton"
          @click="toggleCollapse"
      >
        <el-icon><DArrowRight /></el-icon>
      </el-button>
    </el-tooltip>

  </div>

  <!-- 编辑用户信息弹窗 -->
  <el-dialog :title="translate('userManagement.editDialog.title')" v-model="editDialogVisible" width="50%">
    <div class="popup-container">
      <el-form ref="editUserForm" :model="editUser" :rules="rules" label-width="140px">
        <el-form-item :label="translate('userManagement.editDialog.name')" prop="name">
          <el-input v-model="editUser.name" />
        </el-form-item>

        <el-form-item v-if = "[1, 4].includes(user.role.id)" :label="translate('userManagement.editDialog.role')" prop="role">
          <el-select v-model="editUser.role.id">
            <el-option :label="translate('userManagement.role.admin')" :value="translate('userManagement.role.admin')" />
            <el-option :label="translate('userManagement.role.qcWorker')" :value="translate('userManagement.role.qcWorker')" />
          </el-select>
        </el-form-item>

        <el-form-item :label="translate('userManagement.editDialog.wecomId')" prop="wecomId">
          <el-input v-model="editUser.wecomId" />
        </el-form-item>

        <el-form-item :label="translate('userManagement.editDialog.username')" prop="username">
          <el-input v-model="editUser.username" />
        </el-form-item>

        <el-form-item :label="translate('userManagement.editDialog.email')" prop="email">
          <el-input v-model="editUser.email" />
        </el-form-item>

        <el-form-item :label="translate('userManagement.editDialog.phoneNumber')" prop="phone_number">
          <el-input v-model="editUser.phone_number" />
        </el-form-item>

        <!-- ✅ Hide Status Selection if the user is not 管理员 -->
        <el-form-item v-if="user.role.id !== 2" :label="translate('userManagement.editDialog.status')" prop="status">
          <el-select v-model="editUser.status">
            <el-option :label="translate('userManagement.status.active')" :value="1" />
            <el-option :label="translate('userManagement.status.inactive')" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="changePassword">{{ translate('userManagement.editDialog.changePassword') }}</el-checkbox>
        </el-form-item>

        <el-form-item v-if="changePassword" :label="translate('userManagement.editDialog.newPassword')" prop="newPassword">
          <el-input v-model="newPassword" type="password" show-password />
        </el-form-item>

        <el-form-item v-if="changePassword" :label="translate('userManagement.editDialog.confirmPassword')" prop="confirmPassword">
          <el-input v-model="confirmPassword" type="password" show-password />
        </el-form-item>

      </el-form>
    </div>

    <template #footer>
      <div class="popup-container">
        <el-button @click="editDialogVisible = false">{{ translate('userManagement.editDialog.cancelButton') }}</el-button>
        <el-button type="primary" @click="handleEditConfirm">{{ translate('userManagement.editDialog.confirmButton') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import {
  HomeFilled,
  Setting,
  User,
  List,
  Document,
  Edit,
  Files,
  DataAnalysis,
  Collection,
  SwitchButton,
  Calendar, Warning, Location, TakeawayBox, DArrowLeft, DArrowRight, WarningFilled
} from '@element-plus/icons-vue';
import { mapGetters, mapActions } from 'vuex';
import { translate } from "@/utils/i18n";
import { getUserById, updateUser } from '@/services/userService.js';

export default {
  components: {
    WarningFilled,
    DArrowRight,
    DArrowLeft,
    TakeawayBox,
    Location,
    Warning,
    Calendar,
    HomeFilled,
    Setting,
    User,
    List,
    Document,
    Edit,
    Files,
    DataAnalysis,
    Collection,
    SwitchButton
  },
  computed: {
    ...mapGetters(['getUser', 'getRoleName']),
    user() {
      return this.getUser;
    },
    roleName() {
      return this.getRoleName;
    },
    activeMenu() {
      return this.$route.path; // highlight the current path
    }
  },
  watch: {
    isCollapsed(newVal) {
      if (newVal) {
        setTimeout(() => {
          document.querySelectorAll('.el-sub-menu .el-sub-menu__icon-arrow').forEach(el => {
            el.style.display = 'none';
          });
        }, 500);
      }
    }
  },
  methods: {
    ...mapActions(['logoutUser', 'updateUserState']), // Map the logoutUser action from Vuex
    toggleCollapse(event) {
      event.stopPropagation();
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        // 折叠时，1s 后才显示展开按钮
        setTimeout(() => {
          this.showExpandButton = true;
        }, 500);
      } else {
        // 展开时立即隐藏展开按钮
        this.showExpandButton = false;
      }
    },

    async handleEditConfirm() {
      this.$refs.editUserForm.validate(async (valid) => {
        if (valid) {
          try {
            const originalRole = this.user.role; // Store original role
            const roleId = this.editUser.role === '管理员' ? 1 : 2;

            // logic for status deactivation
            if (this.editUser.status === 0) {
              try {
                await this.$confirm(
                    "你已选择将账号设为未激活状态，登出后将无法再次登录，除非其他管理员重新激活你的账号。确认继续吗？",
                    "确认未激活状态",
                    {
                      confirmButtonText: "确认",
                      cancelButtonText: "取消",
                      type: "warning",
                    }
                );
              } catch {
                this.$message.info("操作已取消");
                return; // Stop the operation if canceled
              }
            }

            const payload = {
              name: this.editUser.name,
              role_id: roleId,
              wecom_id: this.editUser.wecomId,
              username: this.editUser.username,
              email: this.editUser.email,
              phone_number: this.editUser.phone_number,
              status: this.editUser.status,
            };

            if (this.changePassword) {
              if (!this.newPassword || this.newPassword !== this.confirmPassword) {
                this.$message.error('密码不一致!');
                return;
              }
              payload.password = btoa(this.newPassword);
            }

            await updateUser(this.editUser.id, payload);
            this.$message.success("用户更新成功！");

            if (originalRole === 1 && roleId === 2) {
              this.$confirm(
                  "你已经更改了权限，确认或关闭此窗口后都将自动登出。",
                  "权限更改确认",
                  {
                    confirmButtonText: "确认",
                    type: "warning",
                    showCancelButton: false,      // 不显示取消按钮
                    closeOnClickModal: false,     // 禁止点击遮罩层关闭窗口
                    closeOnPressEscape: false,    // 禁止按ESC键关闭窗口
                  }
              ).then(() => {
                this.logoutUser();
                this.$router.push("/LoginPage");
              }).catch(() => {
                this.logoutUser();
                this.$router.push("/LoginPage");
              });
            } else {
              // ✅ Update Vuex store user info
              this.updateUserState({
                name: this.editUser.name,
                username: this.editUser.username,
                role: this.editUser.role === '管理员' ? 1 : 2,
                email: this.editUser.email,
                phone_number: this.editUser.phone_number,
                wecomId: this.editUser.wecomId,
              });
            }

            // ✅ Reset password fields and close dialog
            this.changePassword = false;
            this.newPassword = '';
            this.confirmPassword = '';
            this.editDialogVisible = false;
          } catch (error) {
            console.error("Error updating user:", error);
            this.$message.error("用户更新失败");
          }
        } else {
          this.$message.error("请修复错误");
        }
      });
    },
    handleLogout() {
      this.$confirm(
          translate("navigationMenu.logoutConfirmationMessage"),
          translate("navigationMenu.logoutConfirmationTitle"),
          {
            confirmButtonText: translate("common.editDialog.confirmButton"),
            cancelButtonText: translate("common.editDialog.cancelButton"),
            type: "warning",
          }
      ).then(() => {
        this.logoutUser(); // Clear user information from Vuex
        this.$router.push('/LoginPage'); // Redirect to the login page
      }).catch(() => {
        this.$message.info(translate("common.operationCancelled"));
      });
    },
    translate(key) {
      return translate(key);
    }
  },
  data() {
    return {
      editDialogVisible: false,
      showExpandButton: false,
      editUser: {
        id: null,
        name: '',
        role: '',
        wecomId: '',
        username: '',
        email: '',
        phone_number: '',
        status: null,
      },
      isCollapsed: false,
      hideArrow: false,
      changePassword: false,
      newPassword: '',
      confirmPassword: '',
      rules: {
        name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
        role: [{ required: true, message: 'Role is required', trigger: 'change' }],
        username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
        email: [{ required: true, message: 'Email is required', trigger: 'blur' }],
      },
    };
  },
};
</script>

<style scoped>
.el-menu-vertical-demo {
  height: 100vh;
  width: 240px;
  display: flex;
  transition: width 0.2s ease-in-out, opacity 0.2s ease-in-out;
  flex-direction: column;
  overflow: hidden;
}

.menu-container {
  flex: 1;              /* Takes available space */
  flex-direction: column;
  align-items: flex-start;
}

.user-info {
  color: #fff;
  text-align: center;
  padding: 10px;
}

.user-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.username {
  font-weight: bold;
}

.user-role {
  font-size: 14px;
  color: #ffd04b;
}

.logout-icon {
  margin-top: 10px;
  cursor: pointer;
  font-size: 24px;
  color: #fff;
  transition: color 0.3s;
}

.logout-icon:hover {
  color: #ff4d4f; /* Red color on hover */
}

.edit-icon-wrapper {
  cursor: pointer;
  transition: color 0.1s;
}

.edit-icon-wrapper:hover {
  color: #ffd04b; /* or any preferred highlight color */
}

/* 调整 `el-menu` 折叠后的宽度 */
.sidebar.collapsed .el-menu-vertical-demo {
  width: 64px;
}

.sidebar.collapsed:hover .el-menu span {
  display: inline;
}

/* 在侧边栏折叠状态下，隐藏所有子菜单的小箭头 */
.sidebar.collapsed .el-sub-menu__icon-arrow {
  display: none !important;
}

/* 调整折叠图标的位置 */
.collapse-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

/* 右上角展开按钮 */
.expand-button {
  position: absolute;
  top: 5px;
  left: 70px;  /* 让它浮在侧边栏右侧 */
  width: 30px;
  height: 30px;
  background-color: #545c64;
  color: #fff;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: right 0.3s;
  opacity: 0.5;
  z-index: 999;
}

.expand-button:hover {
  background-color: #666;
  opacity: 1;
}

</style>
