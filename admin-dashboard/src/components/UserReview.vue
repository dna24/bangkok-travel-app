<template>
  <v-container class="request-list">
    <Sidebar />
    <br /><br />
    <h2>จัดการรีวิวจากผู้ใช้</h2>
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
          v-for="review in reviews.slice(page - 1, page)"
          :key="review.review_id"
        >
          <v-card
            style="
              border: 1px solid #b8e2f8;
              border-radius: 5px;
              margin-bottom: 20px;
              padding-bottom: 20px;
            "
            v-if="review.user && review.place"
          >
            <v-card-title>
              จัดการรีวิวของคุณ : {{ review.user.user_name }}
            </v-card-title>
            <v-card class="MemoDetail">
              <!-- แสดงรูปภาพจาก URL -->
              <v-row align="center">
                <v-col cols="auto">
                  <!-- แสดงรูปโปรไฟล์ -->
                  <v-img
                    :src="review.user.user_img"
                    alt="User Image"
                    max-height="50px"
                    width="50px"
                    style="margin-top: 20px"
                  ></v-img>
                </v-col>

                <v-col cols="auto">
                  <!-- ชื่อผู้ใช้ -->
                  <v-row>
                    <p>{{ review.user.user_name }}</p>
                    <p class="place-label">{{ review.place.place_name }}</p>
                  </v-row>
                </v-col>
              </v-row>
              <p>
                <v-rating
                  v-model="review.review_rate"
                  :max="5"
                  :readonly="true"
                  color="yellow"
                  background-color="grey lighten-1"
                  size="25"
                  style="margin-left: 55px; margin-top: -20px"
                ></v-rating>
              </p>
              <br />
              <hr color="#b8e2f8" />

              <!-- รายละเอียด -->
              <p style="padding: 20px; margin-left: 50px">
                {{ review.review_detail }}
              </p>

              <!-- แสดงภาพ-->
              <v-carousel
                style="margin-bottom: -20px"
                hide-delimiters
                v-if="review.images.length > 0"
              >
                <v-carousel-item
                  v-for="(image, index) in review.images"
                  :key="index"
                >
                  <v-img
                    :src="image.review_img"
                    alt="Memo Image"
                    contain
                    height="400px"
                    width="500px"
                    class="memo-img"
                  ></v-img>
                </v-carousel-item>
              </v-carousel>
            </v-card>

            <br />
            <v-btn
              color="green"
              @click="approveReview(review.review_id)"
              style="
                font-size: 16px;
                position: absolute;
                bottom: 10px;
                left: 15px;
              "
            >
              อนุมัติ
            </v-btn>

            <v-btn
              color="red"
              @click="openDeleteDialog(review.review_id)"
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
        :length="Math.ceil(reviews.length / 1)"
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
  </v-container>
</template>

<script>
import apiClient from "@/apiClient"; // นำเข้า apiClient
import Sidebar from "./Sidebar.vue";

export default {
  components: { Sidebar },
  data() {
    return {
      reviews: [],
      page: 1,
      dialogDelete: false,
      reviewToDelete: null,
      loading: true,
    };
  },
  mounted() {
    this.fetchReviews();
  },
  methods: {
    async fetchReviews() {
      try {
        const baseURL = "https://api-4x16.onrender.com";
        const res = await apiClient.get("/review-details/");
        this.reviews = res.data.map((review) => {
         
          if (
            review.user &&
            review.user.user_img &&
            review.user.user_img.startsWith("/media/")
          ) {
            review.user.user_img = baseURL + review.user.user_img;
          }

          review.images = review.images.map((image) => {
            if (image.review_img && image.review_img.startsWith("/media/")) {
              return {
                review_img: baseURL + image.review_img,
              };
            }
            return image;
          });

          return review;
        });
      } catch (error) {
        console.error("Error fetching review details:", error);
      } finally {
        this.loading = false;
      }
    },

    openDeleteDialog(reviewId) {
      this.reviewToDelete = reviewId;
      this.dialogDelete = true;
    },
    async approveReview(reviewId) {
      try {
        // อัปเดตสถานะรีวิว
        await apiClient.patch(`/reviews/${reviewId}/`, {
          review_status: "approved",
        });

        // หาข้อมูลรีวิวที่ถูกอนุมัติ
        const approvedReview = this.reviews.find(
          (review) => review.review_id === reviewId
        );

        if (approvedReview && approvedReview.user) {
          // ส่ง Notification
          await apiClient.post("/notifications/", {
            user: approvedReview.user.id, // ผู้ใช้ที่ได้รับแจ้งเตือน
            message: `รีวิวของคุณเกี่ยวกับ ${approvedReview.place.place_name} ได้รับการอนุมัติแล้ว!`,
            notification_type: "review_approved",
            related_id: reviewId,
          });
        }

        // ลบรีวิวออกจากรายการที่รออนุมัติ
        this.reviews = this.reviews.filter(
          (review) => review.review_id !== reviewId
        );
        alert("รีวิวได้รับการอนุมัติแล้ว");
      } catch (error) {
        console.error("Error approving review:", error);
      }
    },
    async confirmDelete() {
      try {
        await apiClient.patch(`/reviews/${this.reviewToDelete}/`, {
          review_status: "deleted",
        });
        this.reviews = this.reviews.filter(
          (review) => review.review_id !== this.reviewToDelete
        );
        this.dialogDelete = false;
      } catch (error) {
        console.error("Error deleting review:", error);
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

/* จัดรูปให้มีขนาดที่เหมาะสม */
.v-carousel-item img {
  object-fit: contain;
  max-width: 100%;
  max-height: 400px;
  margin: 0 auto;
}
.place-label {
  border: 2px solid #b8e2f8;
  padding: 5px;
  font-size: 12px;
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
