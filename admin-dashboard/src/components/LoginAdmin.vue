<template>
  <div class="container">
    <div class="inner-box">
      <div class="form-container">
        <h1
          style="
            color: #3e8e41;
            text-align: center;
            font-size: 2.5rem;
            font-weight: bold;
          "
        >
          LOG IN
        </h1>
        <hr style="border: none; height: 1px; background-color: #22b37a" />
        <br />
        <form @submit.prevent="handleLogin">
          <div>
            <div class="input-container">
              <input
                type="text"
                v-model="user_email"
                placeholder="Email"
                required
              />
              <i class="fas fa-user icon"></i>
            </div>
          </div>
          <div>
            <div class="input-container">
              <input
                type="password"
                v-model="password"
                placeholder="Password"
              />
              <i class="fas fa-lock icon"></i>
            </div>
          </div>
          <div class="button-container">
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
      <div class="image-container">
        <img :src="require('@/assets/bg.jpg')" alt="Background" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

export default {
  name: "LoginAdmin",
  setup() {
    const user_email = ref("");
    const password = ref("");
    const router = useRouter();

    const handleLogin = async () => {
      try {
        const response = await axios.post("https://api-production-a5fb.up.railway.app/api/login/", {
          user_email: user_email.value,
          password: password.value,
        });

        if (response.data.access) {
          localStorage.setItem("access_token", response.data.access); // เก็บ Token
          localStorage.setItem("refresh_token", response.data.refresh);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.data.access}`; // ใช้ Token
          router.push({ name: "ManagePlace" });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถเข้าสู่ระบบได้",
          text: "กรุณากรอกใหม่อีกครั้ง",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#d33",
        });
        console.error("Login error:", error);
      }
    };

    return {
      user_email,
      password,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #b8e2f8;
}
.inner-box {
  display: flex;
  width: 90%;
  max-width: 1200px;
  height: 700px;
  border-radius: 32px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  margin: auto;
}
.form-container {
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 32px 0 0 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.1);
}
.image-container {
  flex: 1;
  overflow: hidden;
  border-radius: 0 32px 32px 0;
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.input-container {
  position: relative;
  margin-bottom: 1.5rem;
}
input {
  width: 100%;
  padding: 1rem 1rem 1rem 40px;
  border: 1px solid #ccc;
  border-radius: 48px;
  background-color: #f8f8f8;
  transition: all 0.3s ease;
}
input:focus {
  border-color: #22b37a;
  outline: none;
  background-color: #ffffff;
}
.icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #22b37a;
  pointer-events: none;
}
button {
  width: 100%;
  padding: 1rem 1rem 1rem 40px;
  background-color: #22b37a;
  color: #fff;
  border: none;
  border-radius: 48px;
  cursor: pointer;
  transition: all 0.3s ease;
}
button:hover {
  background-color: #3b473a;
}
.button-container {
  display: flex;
}
h1 {
  color: #3e8e41;
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
}
</style>
