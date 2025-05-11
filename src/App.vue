<template>
  <div class="container">

    <div
        v-if="leftHoverDotPoint"
        class="dot"
        :style="{
            top: `${leftHoverDotPoint.y}px`,
            left: `${leftHoverDotPoint.x}px`
         }"
    />

    <div
        v-if="rightHoverDotPoint"
        class="dot"
        :style="{
            top: `${rightHoverDotPoint.y}px`,
            left: `${rightHoverDotPoint.x}px`
          }"
    />

    <div v-if="leftHoverDotPoint && rightHoverDotPoint" class="connector-line" :style="connectorLineStyle"></div>

    <!-- 灰色遮罩层 -->
    <div class="recipe-mask" v-show="windowMaskVisible"></div>

    <!-- Conditionally render the navigation menu -->
    <NavigationMenu v-if="showNavBar" class="nav-menu" />
    <div :class="['content', { 'full-width': !showNavBar, 'content-hidden': isFormDataSummary }]">
      <router-view></router-view>
    </div>
    <div class="floating-language-switch">
      <LanguageSwitch />
    </div>
  </div>
</template>

<script>
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import LanguageSwitch from "@/components/lang/LanguageSwitch.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ref } from 'vue'
import { windowMaskVisible } from '@/globals/mask'
import {connectorLineStyle, leftHoverDotPoint, rightHoverDotPoint} from '@/globals/line'
import { watch } from 'vue'

export default {
  name: 'App',
  computed: {
    connectorLineStyle() {
      return connectorLineStyle
    }
  },
  methods: {leftHoverDotPoint},
  components: {
    LanguageSwitch,
    NavigationMenu,
  },
  setup() {
    const route = useRoute();

    // Determine if the navigation bar should be shown
    const showNavBar = computed(() => route.name !== 'LoginPage');

    // Check if the current route is FormDataSummary.vue
    const isFormDataSummary = computed(() => route.name === "FormDataSummary" || route.name === "QualityFormManagement");

    watch(leftHoverDotPoint, (val) => {
      if (val) {
        console.log('[App.vue] 🔵 dotPoint updated:', val)
      }
    })

    return { showNavBar, isFormDataSummary, windowMaskVisible, leftHoverDotPoint, rightHoverDotPoint, connectorLineStyle };
  }
};
</script>

<style lang="scss">
.container {
  display: flex;
  height: 100vh; /* Make the container take full height */
}

.nav-menu {
  width: 240px;       /* Set a fixed width for the navigation bar */
  background-color: #545c64;
}

.content {
  flex: 1;            /* Allow the content to take the remaining width */
  padding: 10px 20px;
  overflow-y: auto;   /* Default scrolling behavior */
}

/* Make content full width when the navigation bar is hidden */
.full-width {
  width: 100%;
  padding: 0;
}

/* Disable scrolling only for FormDataSummary.vue */
.content-hidden {
  overflow: hidden !important;
  padding-right: 0;
}

.floating-language-switch {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.recipe-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
  z-index: 999;
  pointer-events: none;
}

.dot {
  position: fixed;
  width: 3px;
  height: 3px;
  background-color: var(--el-color-danger);
  border-radius: 50%;
  z-index: 9999;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
}

#recipe_setting > header {
  margin-bottom: 0 !important;
}

#recipe_setting > header > span {
  font-size: 20px !important;
}

</style>
