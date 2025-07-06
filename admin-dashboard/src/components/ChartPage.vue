<template>
  <v-container class="request-list">
    <Sidebar /><br /><br />
    <h2>ภาพรวมสถิติ</h2>

    <br />

    <!-- ปุ่มสลับระหว่างสองโหมด -->
    <div style="margin-bottom: 20px">
      <v-btn
        @click="mode = 'popular'"
        :style="{
          backgroundColor: mode === 'popular' ? '#b8e2f8' : 'transparent',
        }"
        class="mr-2"
      >
        สถานที่ยอดนิยม
      </v-btn>
      <v-btn
        @click="mode = 'plan'"
        :style="{
          backgroundColor: mode === 'plan' ? '#b8e2f8' : 'transparent',
        }"
      >
        สถานที่ยอดนิยมในแพลน
      </v-btn>
    </div>
    <div
      v-if="loadingStats"
      style="
        position: fixed;
        top: 50%;
        left: 60%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 9999;
      "
    >
      <v-progress-circular
        indeterminate
        color="#b8e2f8"
        size="100"
        width="10"
      />
      <p style="margin-top: 20px; font-weight: bold; color: #555">
        กำลังโหลดข้อมูล...
      </p>
    </div>
    <div v-if="mode === 'popular' && !loadingStats" class="parent">
      <!-- กราฟแท่ง (สถานที่ยอดนิยม) -->
      <div class="div1">
        <p style="font-size: 1.2em">สถานที่ยอดนิยม</p>
        <br />
        <BarChart
          v-if="chartData"
          :chart-data="chartData"
          :chart-options="chartOptions"
          style="height: 500px"
        />
        <br />
        <br />
        <p style="font-size: 1em; font-weight: bold; margin-left: 10px">
          10 อันดับสถานที่ยอดนิยม
        </p>
        <br />
        <ul style="list-style: none; padding: 10px">
          <li v-for="(place, index) in topPlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>

      <!-- กราฟ Pie เพศชาย -->
      <div class="div2">
        <p style="font-size: 1.2em">สถานที่ที่เพศชายชอบ</p>
        <PieChart v-if="maleChartData" :chart-data="maleChartData" /><br />
        <ul>
          <li v-for="(place, index) in topMalePlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>

      <!-- กราฟ Pie เพศหญิง -->
      <div class="div3">
        <p style="font-size: 1.2em">สถานที่ที่เพศหญิงชอบ</p>
        <PieChart v-if="femaleChartData" :chart-data="femaleChartData" /><br />
        <ul>
          <li v-for="(place, index) in topFemalePlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>
    </div>

    <div v-else-if="mode === 'plan' && !loadingStats" class="parent">
      <!-- สถานที่ถูกเพิ่มในแพลนมากที่สุด -->
      <div class="div1">
        <p style="font-size: 1.2em">สถานที่ยอดนิยมในแพลน</p>
        <br />
        <BarChart
          v-if="planChartData"
          :chart-data="planChartData"
          :chart-options="chartOptions"
          style="height: 500px"
        /><br /><br />
        <p style="font-size: 1em; font-weight: bold; margin-left: 10px">
          10 อันดับ
        </p>
        <br />
        <ul>
          <li v-for="(place, index) in topPlanPlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>

      <!-- Pie เพศชาย -->
      <div class="div2">
        <p style="font-size: 1.2em">สถานที่ที่ชายเพิ่มในแพลนบ่อย</p>
        <PieChart
          v-if="malePlanChartData"
          :chart-data="malePlanChartData"
        /><br />
        <ul>
          <li v-for="(place, index) in topPlanMalePlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>

      <!-- Pie เพศหญิง -->
      <div class="div3">
        <p style="font-size: 1.2em">สถานที่ที่หญิงเพิ่มในแพลนบ่อย</p>
        <PieChart
          v-if="femalePlanChartData"
          :chart-data="femalePlanChartData"
        /><br />
        <ul>
          <li v-for="(place, index) in topPlanFemalePlaces" :key="index">
            {{ index + 1 }} : {{ place.place_name }}
          </li>
        </ul>
      </div>
    </div>
  </v-container>
</template>

<script>
import Sidebar from "./Sidebar.vue";
import { BarChart, PieChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";
import apiClient from "@/apiClient";
Chart.register(...registerables);

export default {
  components: { Sidebar, BarChart, PieChart },
  data() {
    return {
      loadingStats: true,
      mode: "popular",
      reviews: [],
      chartData: null,
      maleChartData: null,
      femaleChartData: null,
      topPlaces: [],
      topMalePlaces: [],
      topFemalePlaces: [],
      planChartData: null,
      topPlanPlaces: [],
      malePlanChartData: null,
      femalePlanChartData: null,
      topPlanPlacesMale: [],
      topPlanPlacesFemale: [],
      chartOptions: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const index = context.dataIndex;
                const fullLabels = context.chart.data.datasets[0].fullLabels;
                const fullLabel = fullLabels?.[index] || context.label;
                return `${fullLabel}: ${context.raw}`;
              },
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  },
  mounted() {
    this.fetchAllStats();
  },
  methods: {
    shortenName(name) {
      return name.length > 15 ? name.substring(0, 12) + "..." : name;
    },
    async fetchAllStats() {
      try {
        const [popularRes, planRes] = await Promise.all([
          apiClient.get("/stats/popular/"),
          apiClient.get("/stats/plan/"),
        ]);

        // ----------------- popular ------------------
        const { top_all, top_male, top_female } = popularRes.data;
        this.topPlaces = top_all;
        this.topMalePlaces = top_male;
        this.topFemalePlaces = top_female;

        this.chartData = {
          labels: top_all.map((p) => this.shortenName(p.place_name)),
          datasets: [
            {
              label: "คะแนนถ่วงน้ำหนัก",
              data: top_all.map((p) => p.weighted_score),
              backgroundColor: "#BBDEFB",
              fullLabels: top_all.map((p) => p.place_name),
            },
          ],
        };

        this.maleChartData = {
          labels: top_male.map((p) => p.place_name),
          datasets: [
            {
              data: top_male.map((p) => p.male_score),
              backgroundColor: ["#2196F3", "#64B5F6", "#BBDEFB"],
            },
          ],
        };

        this.femaleChartData = {
          labels: top_female.map((p) => p.place_name),
          datasets: [
            {
              data: top_female.map((p) => p.female_score),
              backgroundColor: ["#E91E63", "#F48FB1", "#FCE4EC"],
            },
          ],
        };

        // ----------------- plan ------------------
        const {
          top_all: planTopAll,
          top_male: planTopMale,
          top_female: planTopFemale,
        } = planRes.data;

        this.topPlanPlaces = planTopAll;
        this.topPlanMalePlaces = planTopMale;
        this.topPlanFemalePlaces = planTopFemale;

        this.planChartData = {
          labels: planTopAll.map((p) => this.shortenName(p.place_name)),
          datasets: [
            {
              label: "จำนวนถูกเพิ่มในแผน",
              data: planTopAll.map((p) => p.count),
              backgroundColor: "#C8E6C9",
              fullLabels: planTopAll.map((p) => p.place_name),
            },
          ],
        };

        this.malePlanChartData = {
          labels: planTopMale.map((p) => p.place_name),
          datasets: [
            {
              data: planTopMale.map((p) => p.count),
              backgroundColor: ["#81C784", "#A5D6A7", "#E8F5E9"],
            },
          ],
        };

        this.femalePlanChartData = {
          labels: planTopFemale.map((p) => p.place_name),
          datasets: [
            {
              data: planTopFemale.map((p) => p.count),
              backgroundColor: ["#FFB74D", "#FFE0B2", "#FFF3E0"],
            },
          ],
        };
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        this.loadingStats = false;
      }
    },
    /* eslint-disable */
    calculateWeightedScore(reviews, placesMap, userMap) {
      let placeScores = {};

      reviews.forEach((review) => {
        if (!placeScores[review.place_id]) {
          placeScores[review.place_id] = {
            total: 0,
            count: 0,
            place: placesMap[review.place_id],
          };
        }
        placeScores[review.place_id].total += review.review_rate;
        placeScores[review.place_id].count += 1;
      });

      let weightedScores = Object.values(placeScores)
        .map(({ total, count, place }) => ({
          place_name: place?.place_name || "ไม่ทราบชื่อ",
          weighted_score: (total / count) * Math.log10(count + 1),
        }))
        .sort((a, b) => b.weighted_score - a.weighted_score);

      return weightedScores;
    },
  },
};
</script>

<style scoped>
.request-list {
  padding: 20px;
  margin-left: 280px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.parent {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-grow: 1;
}

.div1,
.div2,
.div3 {
  border-radius: 15px;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.div1 {
  grid-column: span 2;
  grid-row: span 10;
}

.div2 {
  grid-column: span 2;
  grid-row: span 5;
}

.div3 {
  grid-column: span 2;
  grid-row: span 5;
}
.div1 ul,
.div2 ul,
.div3 ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.div1 li {
  font-size: 1em;
  color: #000;
  margin-bottom: 8px;
}
.div2 li,
.div3 li {
  font-size: 0.8em;
  color: #000;
  margin-bottom: 8px;
}

.div1 li:nth-child(odd),
.div2 li:nth-child(odd),
.div3 li:nth-child(odd) {
  background-color: #ebf8ff;
  padding: 8px;
  border-radius: 6px;
}

.div1 li:nth-child(even),
.div2 li:nth-child(even),
.div3 li:nth-child(even) {
  padding: 8px;
  border-radius: 6px;
}
</style>
