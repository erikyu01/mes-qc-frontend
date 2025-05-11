<template>
  <div class="chat-container">
    <div class="chat-window">
      <div v-for="(msg, index) in chatHistory" :key="index" :class="['chat-bubble', msg.role]">
        <span>{{ msg.content }}</span>
      </div>
    </div>
    <div class="chat-input">
      <el-input
          v-model="question"
          placeholder="Ask about QC products..."
          @keyup.enter="ask"
          clearable
      />
      <el-button type="primary" @click="ask">Send</el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      question: '',
      chatHistory: []
    }
  },
  methods: {
    async ask() {
      if (!this.question.trim()) return
      this.chatHistory.push({role: 'user', content: this.question})
      const res = await axios.post('http://localhost:5000/chat', {question: this.question})
      this.chatHistory.push({role: 'bot', content: res.data.reply})
      this.question = ''
      this.$nextTick(() => {
        const el = this.$el.querySelector('.chat-window')
        el.scrollTop = el.scrollHeight
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #ccc;
  border-radius: 12px;
  overflow: hidden;
  background: #f9f9f9;
}

.chat-window {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #ffffff;
}

.chat-bubble {
  max-width: 80%;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  line-height: 1.4;
  word-break: break-word;
}

.chat-bubble.user {
  background-color: #d1e9ff;
  align-self: flex-end;
  margin-left: auto;
  text-align: right;
}

.chat-bubble.bot {
  background-color: #f1f1f1;
  align-self: flex-start;
  margin-right: auto;
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #ddd;
  background: #fff;
}

.chat-input .el-input {
  flex: 1;
  margin-right: 8px;
}
</style>
