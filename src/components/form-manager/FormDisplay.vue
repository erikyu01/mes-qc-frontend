<template>
  <div>
    <v-form-render :form-json="formJson" :form-data="formData" :option-data="optionData" ref="vFormRef">
    </v-form-render>
    <el-button type="primary" @click="submitForm">Submit</el-button>
  </div>
</template>

<script setup>
import {ref, reactive} from 'vue'
import { ElMessage } from 'element-plus'
import VFormRender from '@/components/form-render/index' // the documentation was so silly I found this out
import testFormJsonData from '@/tests/form_json_data.json'; // Import the JSON data

/* 注意：formJson是指表单设计器导出的json，此处演示的formJson只是一个空白表单json！！ */
const formJson = reactive(testFormJsonData)
const formData = reactive({})
const optionData = reactive({})
const vFormRef = ref(null)

const submitForm = () => {
  vFormRef.value.getFormData().then(formData => {
    // Form Validation OK
    alert( JSON.stringify(formData, null, 2) )
  }).catch(error => {
    // Form Validation failed
    ElMessage.error(error)
  })
}
</script>
