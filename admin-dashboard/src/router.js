import { createRouter, createWebHistory } from "vue-router";
import LoginAdmin from "@/components/LoginAdmin.vue";
import ManagePlace from "@/components/ManagePlace.vue";
import ManageReport from "@/components/ManageReport.vue";
import RecommendPlace from "@/components/RecommendPlace.vue";
import UserReview from "@/components/UserReview.vue";
import ManageUser from "@/components/ManageUser.vue";
import ChartPage from "@/components/ChartPage.vue";

const routes = [
  {
    path: "/",
    name: "Login",
    component: LoginAdmin,
  },
  {
    path: "/ManagePlace",
    name: "ManagePlace",
    component: ManagePlace,
    meta: { requiresAuth: true }, // กำหนด meta: requiresAuth เพื่อบอกว่าหน้านี้ต้องการการเข้าสู่ระบบ
  },
  {
    path: "/ManageReport",
    name: "ManageReport",
    component: ManageReport,
    meta: { requiresAuth: true },
  },
  {
    path: "/RecommendPlace",
    name: "RecommendPlace",
    component: RecommendPlace,
    meta: { requiresAuth: true },
  },
  {
    path: "/UserReview",
    name: "UserReview",
    component: UserReview,
    meta: { requiresAuth: true },
  },
  {
    path: "/ManageUser",
    name: "ManageUser",
    component: ManageUser,
    meta: { requiresAuth: true },
  },
  {
    path: "/ChartPage",
    name: "ChartPage",
    component: ChartPage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// **เพิ่ม Navigation Guards**
router.beforeEach((to, from, next) => {
  // ตรวจสอบว่ามี access_token ใน localStorage หรือไม่
  const isAuthenticated = !!localStorage.getItem("access_token");

  // ถ้าหน้าต้องการ Auth แต่ยังไม่ได้เข้าสู่ระบบ
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "Login" }); // Redirect ไปหน้า Login
  } else {
    next(); // อนุญาตให้เข้าไปที่หน้า
  }
});

export default router;
