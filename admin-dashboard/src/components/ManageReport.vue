<template>
  <v-container class="request-list">
    <Sidebar />
    <br /><br />
    <h2>รายงานจากผู้ใช้</h2>
    <br />
    <div
      v-if="loading"
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
    <v-card class="content" v-else>
      <v-list>
        <!-- แสดงรายงานเพียง 1 รายการต่อหน้า -->
        <v-list-item
          v-for="report in reports.slice(page - 1, page)"
          :key="report.report_id"
        >
          <v-card
            style="
              border: 1px solid #b8e2f8;
              border-radius: 5px;
              margin-bottom: 20px;
              padding-bottom: 20px;
            "
            v-if="report.user && report.memo"
          >
            <v-icon
              style="
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 30px;
              "
              @click="openCloseDialog(report.report_id)"
              color="red"
              class="cursor-pointer"
            >
              mdi-close-circle
            </v-icon>
            <v-card-title>
              รายงานโพสต์จากคุณ : {{ report.user.user_name }}
            </v-card-title>
            <v-card class="MemoDetail">
              <!-- แสดงรูปภาพจาก URL -->
              <v-row align="center">
                <v-col cols="auto">
                  <!-- แสดงรูปโปรไฟล์ -->
                  <v-img
                    :src="report.user_img_url"
                    alt="User Image"
                    max-height="50px"
                    width="50px"
                  ></v-img>
                </v-col>

                <v-col cols="auto">
                  <!-- ชื่อผู้ใช้ -->
                  <v-row>
                    <p>{{ report.memo_user.user_name }}</p>
                    <p class="place-label">{{ report.place.place_name }}</p>
                  </v-row>
                </v-col>
              </v-row>

              <!-- รายละเอียด memo -->
              <p style="padding: 20px; margin-left: 50px">
                {{ report.memo.memo_detail }}
              </p>

              <!-- แสดงภาพใน Memo (หลายภาพ) -->
              <v-carousel
                style="margin-bottom: -20px"
                hide-delimiters
                v-if="report.memo.images.length > 0"
              >
                <v-carousel-item
                  v-for="(image, index) in report.memo.images"
                  :key="index"
                >
                  <v-img
                    :src="image.memo_img"
                    alt="Memo Image"
                    contain
                    height="400px"
                    width="500px"
                    class="memo-img"
                  ></v-img>
                </v-carousel-item>
              </v-carousel>
              <!-- รายละเอียดการรายงาน -->
            </v-card>
            <v-card-title> รายละเอียดการรายงาน </v-card-title>
            <v-card-text>
              <p class="detailcard">
                <strong>สาเหตุ</strong><br />
                {{ report.report_type }}
              </p>
              <p class="detailcard">
                <strong>ความคิดเห็นเพิ่มเติม</strong><br />
                {{ report.report_detail }}
              </p>
              <!-- ปุ่มสำหรับอัปเดตสถานะเป็น delete --> </v-card-text
            ><br />
            <v-btn
              color="red"
              @click="openDeleteDialog(report.report_id)"
              style="
                font-size: 16px;
                position: absolute;
                bottom: 10px;
                right: 15px;
              "
            >
              ลบ
            </v-btn>
          </v-card>
        </v-list-item>
      </v-list>

      <!-- ปุ่มสำหรับการเลื่อนหน้า -->
      <v-pagination
        v-model="page"
        :length="Math.ceil(reports.length / 1)"
        circle
      ></v-pagination>
    </v-card>

    <!-- Dialog ลบ -->
    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="headline">ยืนยันการลบ</v-card-title>
        <v-card-text>คุณต้องการลบใช่หรือไม่</v-card-text>
        <v-card-actions>
          <v-btn color="grey" @click="dialogDelete = false">ยกเลิก</v-btn>
          <v-btn color="red" @click="confirmDelete">ยืนยัน</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ปิด -->
    <v-dialog v-model="dialogClose" max-width="400px">
      <v-card>
        <v-card-title class="headline">ยืนยันการปิด</v-card-title>
        <v-card-text>คุณต้องการปิดรายงานนี้ใช่หรือไม่?</v-card-text>
        <v-card-actions>
          <v-btn color="grey" @click="dialogClose = false">ยกเลิก</v-btn>
          <v-btn color="blue" @click="confirmClose">ยืนยัน</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import Sidebar from "./Sidebar.vue";
import apiClient from "@/apiClient";

export default {
  components: { Sidebar },
  data() {
    return {
      reports: [],
      page: 1,
      dialogDelete: false,
      dialogClose: false,
      reportToDelete: null,
      reportToClose: null,
      placeName: "",
      loading: true,
    };
  },
  async created() {
    await this.fetchReports();
  },
  methods: {
    async fetchReports() {
      try {
        const baseURL = "https://api-4x16.onrender.com";
        const response = await apiClient.get("/report/with-details/");
        this.reports = response.data.map((report) => {
          if (
            report.user_img_url &&
            report.user_img_url.startsWith("/media/")
          ) {
            report.user_img_url = baseURL + report.user_img_url;
          }

          report.memo.images = report.memo.images.map((image) => {
            if (image.memo_img && image.memo_img.startsWith("/media/")) {
              return {
                memo_img: baseURL + image.memo_img,
              };
            }
            return image;
          });

          return report;
        });
      } catch (error) {
        console.error("Error fetching reports with details:", error);
      } finally {
        this.loading = false;
      }
    },

    openDeleteDialog(reportId) {
      this.reportToDelete = reportId;
      this.dialogDelete = true;
    },

    openCloseDialog(reportId) {
      this.reportToClose = reportId;
      this.dialogClose = true;
    },

    async confirmDelete() {
      try {
        const response = await apiClient.get(
          `/reports/${this.reportToDelete}/`
        );
        const reportData = response.data;

        const memoRes = await apiClient.get(
          `/travel_memos/${reportData.memo_id}/`
        );
        const memoData = memoRes.data;

        const placeRes = await apiClient.get(`/places/${memoData.place_id}/`);
        const placeName = placeRes.data.place_name;

        console.log("check place id:", placeName);
        console.log("check memo ที่จะลบ:", reportData.memo_id);
        console.log("check user ที่จะแจ้ง:", memoData.user_id);

        await apiClient.patch(`/reports/${this.reportToDelete}/`, {
          report_status: "delete",
        });

        // ลบ memo ที่เกี่ยวข้อง
        await apiClient.delete(`/travel_memos/${reportData.memo_id}/`);

        this.reports = this.reports.filter(
          (report) => report.report_id !== this.reportToDelete
        );

        // ส่ง Notification
        await apiClient.post("/notifications/", {
          user: memoData.user_id,
          message: `บันทึกการเดินทางของคุณที่เกี่ยวกับ ${placeName} ถูกลบเนื่องจากถูกรายงาน`,
          notification_type: "report_approved",
          related_id: this.reportToDelete,
        });

        this.dialogDelete = false;
        if (this.page > 1) {
          this.page = this.page - 1;
        }
      } catch (error) {
        console.error("Error updating report status:", error);
      }
    },

    async confirmClose() {
      try {
        await apiClient.patch(`/reports/${this.reportToClose}/`, {
          report_status: "checked",
        });

        this.reports = this.reports.filter(
          (report) => report.report_id !== this.reportToClose
        );

        this.dialogClose = false;
        if (this.page > 1) {
          this.page = this.page - 1;
        }
      } catch (error) {
        console.error("Error updating report status:", error);
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
.memo-img {
  display: block;
  margin: 0 auto;
}

.content {
  border-radius: 15px;
  min-height: 600px;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.report-card {
  margin-bottom: 10px;
  padding: 10px;
}

.cursor-pointer {
  cursor: pointer;
}

.detailcard {
  background-color: #f8f9fb;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.MemoDetail {
  margin: 20px;
  border-radius: 10px;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.v-carousel-item img {
  object-fit: contain;
  max-width: 100%;
  max-height: 400px;
  margin: 0 auto;
}
.place-label {
  border: 2px solid #b8e2f8;
  padding: 5px;
  margin-left: 10px;
  border-radius: 10px;
  margin-top: -5px;
  color: gray;
}
.place-label:hover {
  background-color: #b8e2f8;
  color: white;
}
</style>
