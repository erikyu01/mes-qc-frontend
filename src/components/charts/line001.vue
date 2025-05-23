<template>
  <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "Chart",
  props: {
    chartTitle: {
      type: String,
      default: 'QC line'
    },
    xaxisData: {
      type: Array,
      required: true
    },
    chartData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      chart: null, // Store chart instance here
    };
  },
  mounted() {
    this.initChart();
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        if (this.chart) {
          this.chart.setOption({ series: [{ data: this.chartData }] });
        }
      }
    }
  },
  methods: {
    /**
     * Retrieve the chart as a Base64 image
     */
    getChartImage() {
      return this.chart ? this.chart.getDataURL({type: "png", pixelRatio: 2}) : "";
    },

    /**
     * Initialize the chart and store the instance
     */
    initChart() {
      const chartDom = this.$refs.chartContainer;
      this.chart = echarts.init(chartDom); // Store instance in `this.chart`

      const option = {
        title: {
          text: this.chartTitle,
          left: "center",
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          bottom: 10,
        },
        toolbox: {
          show: true,
          feature: {
            dataZoom: {
              yAxisIndex: "none",
            },
            dataView: {readOnly: false},
            magicType: {
              show: true,
              type: ["line", "bar"]
            },
            restore: {},
            saveAsImage: {},
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: true,
          data: this.xaxisData,
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: "{value}",
          },
        },
        series: [
          {
            name: "",
            type: "line",
            data: this.chartData,
            markPoint: {
              data: [
                {type: "max", name: "Max"},
                {type: "min", name: "Min"},
              ],
            },
            markLine: {
              data: [{type: "average", name: "Avg"}],
            },
          },
        ],
      };

      this.chart.setOption(option);
    },
  },
};
</script>

<style scoped>
/* Styling adjustments if needed */
</style>
