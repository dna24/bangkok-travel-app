<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <br />
      <div class="image-container" align="center">
        <img
          height="80px"
          width="80px"
          :src="require('@/assets/admin.png')"
          alt="Background"
        />
      </div>
      <h5 style="color: #000">ADMIN</h5>
      <br />
    </div>
    <div class="sidebar-content">
      <ul class="menu">
        <li>
          <router-link
            to="/ManagePlace"
            :class="{ active: $route.path === '/ManagePlace' }"
          >
            <v-icon left>mdi mdi-map-marker-plus-outline</v-icon>จัดการสถานที่
          </router-link>
        </li>
        <li>
          <router-link
            to="/ManageUser"
            :class="{ active: $route.path === '/ManageUser' }"
          >
            <v-icon left>mdi mdi-account-cog-outline</v-icon>จัดการผู้ใช้งาน
          </router-link>
        </li>
        <li>
          <router-link
            to="/ManageReport"
            :class="{ active: $route.path === '/ManageReport' }"
          >
            <v-icon left>mdi-clipboard-text-outline</v-icon>รายงานจากผู้ใช้
          </router-link>
        </li>
        <li>
          <router-link
            to="/RecommendPlace"
            :class="{ active: $route.path === '/RecommendPlace' }"
          >
            <v-icon left>mdi-message-text-outline</v-icon>แนะนำสถานที่จากผู้ใช้
          </router-link>
        </li>
        <li>
          <router-link
            to="/UserReview"
            :class="{ active: $route.path === '/UserReview' }"
          >
            <v-icon left>mdi-comment-multiple-outline</v-icon
            >จัดการรีวิวจากผู้ใช้
          </router-link>
        </li>
        <li>
          <router-link
            to="/ChartPage"
            :class="{ active: $route.path === '/ChartPage' }"
          >
            <v-icon left>mdi mdi-chart-bar</v-icon>ภาพรวมสถิติ
          </router-link>
        </li>
      </ul>
    </div>
    <v-btn @click="confirmLogout" class="logout-button">
      <v-icon left>mdi-logout</v-icon> ออกจากระบบ
    </v-btn>
  </div>
</template>

<script>
import axios from "axios";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

export default {
  name: "LogoutAdmin",
  setup() {
    const router = useRouter();

    const handleLogout = async () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      delete axios.defaults.headers.common["Authorization"];
      router.push({ name: "Login" });
    };

    const confirmLogout = () => {
      Swal.fire({
        title: "คุณแน่ใจหรือไม่?",
        text: "คุณต้องการออกจากระบบใช่หรือไม่",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "ใช่, ออกจากระบบ!",
        cancelButtonText: "ยกเลิก",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire(
            "ออกจากระบบแล้ว!",
            "คุณได้ออกจากระบบเรียบร้อย",
            "success"
          ).then(() => {
            handleLogout();
          });
        }
      });
    };

    return {
      confirmLogout,
    };
  },
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #b8e2f8;
  color: white;
  height: 100vh;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 0px;
  padding-right: 0px;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
}

.sidebar-header h5 {
  color: white;
  text-align: center;
  margin-bottom: 10px;
}

.sidebar-content {
  flex-grow: 1;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu a {
  color: black;
  text-decoration: none;
  display: block;
  padding: 25px 40px;
}

.menu a:hover {
  background-color: #f0f0f0;
}

.menu a.active {
  background-color: #ffffff;
}

.logout-button {
  color: #000;
  border: none;
  border-radius: 10px;
  padding: 30px 20px;
  cursor: pointer;
  width: 70%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto; /* ทำให้ปุ่มอยู่กลางในแนวนอน */
}
.logout-button:hover {
  color: #d33;
  background-color: #fff;
}
.v-icon {
  padding-right: 15px;
}
</style>
