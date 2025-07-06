<template>
  <v-container class="request-list">
    <Sidebar /><br /><br />
    <h2>จัดการผู้ใช้งาน</h2>
    <br />
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          label="ค้นหาผู้ใช้งาน"
          outlined
          append-icon="mdi-magnify"
        ></v-text-field>
      </v-col>
    </v-row>
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
    <v-data-table
      v-else
      :headers="headers"
      :items="filteredUsers"
      item-key="id"
      class="elevation-1"
    >
      <template v-slot:[`item.user_name`]="{ item }">{{
        item.user_name
      }}</template>
      <template v-slot:[`item.user_email`]="{ item }">{{
        item.user_email
      }}</template>
      <template v-slot:[`item.user_gender`]="{ item }">{{
        item.user_gender
      }}</template>
      <template v-slot:[`item.user_birthday`]="{ item }"
        >{{ calculateAge(item.user_birthday) }} ปี</template
      >
      <template v-slot:[`item.last_login`]="{ item }">
        {{ formatLastLogin(item.last_login) }}
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          @click="deleteUser(item)"
          color="red"
          outlined
          small
          class="action-btn"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import Sidebar from "./Sidebar.vue";
import apiClient from "@/apiClient";

export default {
  components: { Sidebar },
  data() {
    return {
      loading: true,
      users: [],
      searchQuery: "",
      headers: [
        { text: "ชื่อผู้ใช้งาน", align: "start", value: "user_name" },
        { text: "อีเมลผู้ใช้งาน", align: "start", value: "user_email" },
        { text: "เพศ", align: "start", value: "user_gender" },
        { text: "อายุ", align: "start", value: "user_birthday" },
        {
          text: "วันที่เข้าสู่ระบบล่าสุด",
          align: "start",
          value: "last_login",
        },
        { text: "Actions", value: "actions", align: "center" },
      ],
    };
  },
  computed: {
  filteredUsers() {
    return this.users
      .filter((user) => {
        const isActiveAndNotStaff = user.is_active && !user.is_staff;
        const matchesSearchQuery =
          user.user_name
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          user.user_email
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase());

        return isActiveAndNotStaff && matchesSearchQuery;
      })
      .sort((a, b) => new Date(a.last_login) - new Date(b.last_login)); // เรียงจากเก่าสุดไปใหม่สุด
  },
},
  async created() {
    try {
      const response = await apiClient.get("/users/");
      this.users = response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
    }finally {
      this.loading = false; 
    }
  },
  methods: {
    deleteUser(user) {
      if (confirm(`คุณต้องการลบผู้ใช้งาน "${user.user_name}" หรือไม่?`)) {
        apiClient
          .delete(`/users/${user.id}/`)
          .then(() => {
            this.users = this.users.filter((u) => u.id !== user.id);
          })
          .catch((error) => {
            console.error("Error deleting user:", error);
          });
      }
    },
    calculateAge(birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    },

    formatLastLogin(lastLogin) {
      const now = new Date();
      const lastLoginDate = new Date(lastLogin);
      const timeDiff = now - lastLoginDate;
      const diffInSeconds = Math.floor(timeDiff / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInMonths = Math.floor(diffInDays / 30);

      if (diffInSeconds < 60) {
        return "ใช้งานเมื่อไม่กี่วินาทีที่แล้ว";
      } else if (diffInMinutes < 60) {
        return `ใช้งานเมื่อ ${diffInMinutes} นาทีที่แล้ว`;
      } else if (diffInHours < 24) {
        return `ใช้งานเมื่อ ${diffInHours} ชั่วโมงที่แล้ว`;
      } else if (diffInDays < 30) {
        return `ใช้งานเมื่อ ${diffInDays} วันที่แล้ว`;
      } else {
        return `ใช้งานเมื่อ ${diffInMonths} เดือนที่แล้ว`;
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
.v-data-table {
  margin-top: 20px;
}
.v-btn:hover {
  transform: scale(1.05);
  transition: all 0.2s;
}
.action-btn {
  margin-right: 10px;
}
th,
td {
  padding: 16px 24px;
}
.v-btn {
  min-width: 100px;
}
</style>
