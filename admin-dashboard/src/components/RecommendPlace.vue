<template>
  <v-container class="request-list">
    <Sidebar /><br /><br />
    <h2>แนะนำสถานที่จากผู้ใช้</h2>
    <br />

    <v-tabs v-model="selectedTab">
      <v-tab value="wait">รออนุมัติ</v-tab>
      <!-- <v-tab value="denied">ถูกปฏิเสธ</v-tab> -->
    </v-tabs>
    <div
      v-if="loadpage"
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
    <v-window v-model="selectedTab" v-else>
      <!-- Tab "รออนุมัติ" -->
      <v-window-item value="wait">
        <PlaceTable
          :places="filteredPlaces('wait')"
          @approve="Approve"
          @deny="Denied"
          :loading="loading"
        />
      </v-window-item>

      <!-- Tab "ถูกปฏิเสธ" -->
      <!-- <v-window-item value="denied">
        <PlaceTable
          :places="filteredPlaces('denied')"
          :loading="loading"
          hide-actions
        />
      </v-window-item> -->
    </v-window>
  </v-container>
</template>

<script>
import Sidebar from "./Sidebar.vue";
import PlaceTable from "./PlaceTable.vue";
import apiClient from "@/apiClient";

export default {
  components: { Sidebar, PlaceTable },
  data() {
    return {
      places: [],
      loading: false,
      selectedTab: "wait",
      loadpage: true,

    };
  },
  computed: {
    filteredPlaces() {
      return (status) =>
        this.places.filter((place) => place.rec_status === status);
    },
  },
  async created() {
    await this.fetchPlaces();
  },
  methods: {
    async fetchPlaces() {
      try {
        const response = await apiClient.get("/placesrecommend/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        this.places = response.data;
      } catch (error) {
        console.error("Error fetching places:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }finally {
      this.loadpage = false; 
    }
    },

    async downloadImage(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("ดาวน์โหลดรูปไม่สำเร็จ");
        const blob = await response.blob();
        return new File([blob], "place_image.jpg", { type: blob.type });
      } catch (error) {
        console.error("Error downloading image:", error);
        alert("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ!");
        return null;
      }
    },
    async Approve(place) {
      if (!confirm(`คุณต้องการอนุมัติ "${place.rec_place_name}" หรือไม่?`))
        return;

      this.loading = true;
      try {
        await apiClient.patch(`/placesrecommend/${place.rec_place_id}/`, {
          rec_status: "approve",
        });

        // เตรียม FormData สำหรับเพิ่มสถานที่ใหม่
        const formData = new FormData();
        formData.append("id", place.rec_id);
        formData.append("lat", place.rec_lat);
        formData.append("lng", place.rec_lng);
        formData.append("openning_detail", place.rec_openning_detail);
        formData.append("place_name", place.rec_place_name);
        formData.append("location", place.rec_location);
        formData.append("place_type", place.rec_place_type);
        formData.append("description", place.rec_description);
        formData.append("phone_number", place.rec_phone_number);
        formData.append("website", place.rec_website);

        // ถ้ามีรูป ให้ดาวน์โหลดและแนบรูป
        if (place.rec_place_img) {
          const file = await this.downloadImage(place.rec_place_img);
          formData.append("place_img", file);
        }
        
        await apiClient.post("/places/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        await this.fetchPlaces();
        alert("อนุมัติสำเร็จ!");
      } catch (error) {
        console.error("Error approving place:", error);
        alert("เกิดข้อผิดพลาดในการอนุมัติ!");
      } finally {
        this.loading = false;
      }
    },

    async Denied(place) {
      if (!confirm(`คุณไม่อนุมัติ "${place.rec_place_name}" ใช่หรือไม่?`))
        return;

      this.loading = true;
      try {
        await apiClient.patch(`/placesrecommend/${place.rec_place_id}/`, {
          rec_status: "denied",
        });

        alert("ปฏิเสธสำเร็จ!");
        this.fetchPlaces();
      } catch (error) {
        console.error("Error denying place:", error);
        alert("เกิดข้อผิดพลาด");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.request-list {
  padding: 20px;
  margin-left: 280px;
}
</style>
