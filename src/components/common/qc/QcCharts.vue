<template>
  <div>
    <LineChart
        v-for="(widget, index) in lineChartWidgets"
        :key="`line-${index}`"
        :chart-title="widget.label"
        :xaxis-data="widget.xaxisData"
        :chart-data="widget.chartData"
        :ref="el => setLineChartRef(el, index)"
    />
    <PieChart
        v-for="(widget, index) in pieChartWidgets"
        :key="`pie-${index}`"
        :chart-title="widget.label"
        :chart-data="widget.chartData"
        :ref="el => setPieChartRef(el, index)"
    />
  </div>
</template>

<script setup>
import { inject } from 'vue';
import LineChart from '@/components/charts/line001.vue';
import PieChart from '@/components/charts/pie001.vue';

const props = defineProps(['lineChartWidgets', 'pieChartWidgets']);

// 接收来自 FormDataSummary.vue 的 refs
const lineChartRefs = inject('lineChartRefs');
const pieChartRefs = inject('pieChartRefs');

function setLineChartRef(el, index) {
  if (el) lineChartRefs[index] = el;
}
function setPieChartRef(el, index) {
  if (el) pieChartRefs[index] = el;
}
</script>

<style scoped>
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
</style>
