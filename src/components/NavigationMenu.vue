<template>
  <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      router
  >
    <div class="menu-container">
      <!-- 管理员和质检人员共享的菜单 -->
      <el-menu-item index="/">
        <el-icon><HomeFilled /></el-icon>
        <span>首页</span>
      </el-menu-item>

      <!-- 仅管理员可见的菜单 -->
      <template v-if="user.role === 1">
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/user-management">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="3">
          <template #title>
            <el-icon><List /></el-icon>
            <span>质量管理</span>
          </template>
          <el-menu-item index="/quality-form-management">
            <el-icon><Document /></el-icon>
            <span>表单管理</span>
          </el-menu-item>
          <el-menu-item index="/form-designer">
            <el-icon><Edit /></el-icon>
            <span>表单设计</span>
          </el-menu-item>
          <el-menu-item index="/task-assignment">
            <el-icon><Files /></el-icon>
            <span>任务派发</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="4">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>数据汇总</span>
          </template>
        </el-sub-menu>
      </template>

      <!-- 任务中心 (所有角色可见) -->
      <el-sub-menu index="5">
        <template #title>
          <el-icon><Collection /></el-icon>
          <span>任务中心</span>
        </template>
        <el-menu-item index="/my-tasks">
          <el-icon><Document /></el-icon>
          <span>我的任务</span>
        </el-menu-item>
      </el-sub-menu>
    </div>

    <!-- 用户信息显示在 Navbar 底部 -->
    <div class="user-info">
      <el-divider />
      <div class="user-details">
        <el-icon><User /></el-icon>
        <span class="username">{{ user.username }}</span>
      </div>
      <div class="user-role">{{ roleName }}</div>

      <!-- Logout Button with Tooltip and Hover Effect -->
      <el-tooltip content="登出" placement="top">
        <el-icon class="logout-icon" @click="handleLogout">
          <SwitchButton />
        </el-icon>
      </el-tooltip>
    </div>

  </el-menu>
</template>

<script>
import { HomeFilled, Setting, User, List, Document, Edit, Files, DataAnalysis, Collection, SwitchButton } from '@element-plus/icons-vue';
import { mapGetters, mapActions } from 'vuex';

export default {
  components: {
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
  },
  methods: {
    ...mapActions(['logoutUser']), // Map the logoutUser action from Vuex

    handleLogout() {
      this.logoutUser(); // Clear user information from Vuex
      this.$router.push('/LoginPage'); // Redirect to the login page
    },
  },
};
</script>

<style scoped>
.el-menu-vertical-demo {
  height: 100vh;
  width: 240px;
  display: flex;
  flex-direction: column;
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

</style>
