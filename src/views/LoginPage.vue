<template>
  <div class="page-container">
    <div class="login-container">
      <div class="login-box">
        <h2 class="login-title">{{ translate('loginPage.loginTitle') }}</h2>
        <el-form :model="form" :rules="rules" ref="loginForm" class="login-form" @keydown.enter="handleLogin">
          <!-- Username Input -->
          <el-form-item prop="username">
            <el-input v-model="form.username" :placeholder="translate('loginPage.usernamePlaceholder')">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- Password Input -->
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" :placeholder="translate('loginPage.passwordPlaceholder')" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="userInputIdentifyCodes" class="captcha-container">
            <el-input
                v-model="form.userInputIdentifyCodes"
                type="text"
                :placeholder="translate('loginPage.captchaPlaceholder')"
            >
              <template #prefix>
                <el-icon><Checked /></el-icon>
              </template>
            </el-input>

            <el-tooltip :content="translate('loginPage.refreshCaptchaTooltip')" placement="bottom">
              <SIdentify
                  style="margin-top: 4px; cursor: pointer;"
                  :identifyCode="identifyCode"
                  @click.native="refreshIdentifyCode"
              />
            </el-tooltip>
          </el-form-item>

          <!-- Hidden div for test automation -->
          <div id="captcha-value" style="display: none;">{{ identifyCode }}</div>

          <!-- Remember Me Checkbox -->
          <el-form-item>
            <el-checkbox v-model="form.rememberMe">{{ translate('loginPage.rememberMe') }}</el-checkbox>
          </el-form-item>

          <!-- Login Button -->
          <el-form-item>
            <el-button type="primary" class="login-button" @click="handleLogin" :loading="loading">{{ translate('loginPage.loginButton') }}</el-button>
          </el-form-item>

          <!-- Error Message Display -->
          <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon />
        </el-form>
      </div>
    </div>
    <div class="copyright">
      © 2024-2025 FPS. Quality Control for MES. All rights reserved.
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import {User, Lock, Checked} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { mapActions } from 'vuex';
import { validateUser, fetchUserInfo } from '@/services/userService.js';
import api from '@/services/api.js';
import SIdentify from "@/components/user/SIdentify.vue";
import {translate} from "@/utils/i18n";

export default {
  name: 'LoginPage',
  components: {
    SIdentify,
    Checked,
    User,
    Lock,
  },
  data() {
    return {
      form: {
        username: '',
        password: '',
        userInputIdentifyCodes: '',
        rememberMe: false,
      },
      rules: {
        username: [{ required: true, message: translate('loginPage.usernameMessage'), trigger: 'blur' }],
        password: [{ required: true, message: translate('loginPage.passwordMessage'), trigger: 'blur' }],
        userInputIdentifyCodes: [{ required: true, message: translate('loginPage.captchaMessage'), trigger: 'blur' }]
      },
      errorMessage: '', // To store any error messages
      loading: false,   // To track loading state
      identifyCode: "", //密码登录图形验证码
      identifyCodes: "1234567890abcdefghizklmnopqrstuvwxyz", //生成图形验证码的依据
      userInput: "" // For storing the user's input's identify code
    };
  },
  mounted() {
    // 读取存储的用户名
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      this.form.username = savedUsername;
      this.form.rememberMe = true; // 自动勾选 "记住我"
    }

    // 初始化验证码
    this.identifyCode = "";
    this.makeIdentifyCode(4);
  },
  methods: {
    translate,
    ...mapActions(['loginUser']), // Map the loginUser action from Vuex

    // 刷新验证码
    refreshIdentifyCode() {
      this.identifyCode = "";
      this.makeIdentifyCode(4);
    },
    // 生成4位数的随机验证码
    makeIdentifyCode(l) {
      for (let i = 0; i < l; i++) {
        this.identifyCode +=
            this.identifyCodes[this.randomNum(0, this.identifyCodes.length)];
      }
    },
    // 生成单个验证码
    randomNum(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    },

    async handleLogin() {
      this.errorMessage = '';

      this.$refs.loginForm.validate(async (valid) => {
        if (!valid) return;

        if (this.form.userInputIdentifyCodes !== this.identifyCode) {
          this.errorMessage = translate('loginPage.errorCaptcha');
          return;
        }

        this.loading = true;
        try {
          const validateResponse = await validateUser(
              this.form.username,
              btoa(this.form.password)
          );

          if (validateResponse.data.status === '200') {
            const userInfoResponse = await fetchUserInfo(this.form.username);

            if (userInfoResponse.data.status === '200') {
              const userRole = userInfoResponse.data.data.role.id;

              // Allow login only for 管理员 (role_id: 1) and 班长 (role_id: 3), hardcoded currently, TODO: should include in the role settings
              if (userRole !== 2) {
                await this.loginUser({
                  id: userInfoResponse.data.data.id,
                  username: userInfoResponse.data.data.username,
                  role: userInfoResponse.data.data.role,
                  name: userInfoResponse.data.data.name
                });

                if (this.form.rememberMe) {
                  localStorage.setItem("rememberedUsername", this.form.username);
                } else {
                  localStorage.removeItem("rememberedUsername");
                }

                ElMessage.success(translate('loginPage.loginSuccess'));

                if (userRole === 4) {
                  this.$router.push('/user-management');
                } else if (userRole === 3 || userRole === 1) {
                  this.$router.push('/');
                }
              } else {
                this.errorMessage = translate('loginPage.errorNoPermission');  // Show error message in Chinese
              }
            } else {
              this.errorMessage = translate('loginPage.errorUserInfoFailed');
            }
          } else {
            this.errorMessage = translate('loginPage.errorInvalidCredentials');
          }
        } catch (error) {
          this.errorMessage = error.response?.data?.message ||  translate('loginPage.errorGeneric');
        } finally {
          this.loading = false;
        }
      });
    },
  },
};
</script>

<style scoped>
  .login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .login-box {
    width: 350px;
    padding: 30px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .login-title {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
  }

  .login-button {
    width: 100%;
    font-size: 18px;
  }

  .page-container {
    background: url('@/assets/FPS_background.jpg') no-repeat center center fixed;
    background-size: cover;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
  }

  .copyright {
    text-align: center;
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
  }

  .captcha-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .captcha-container .el-input {
    flex: 1; /* Allow the input to take available space */
    margin-right: 10px; /* Add spacing between the input and SIdentify */
  }
</style>
