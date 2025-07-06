import axios from "axios";

// URL API
const baseURL = "https://api-4x16.onrender.com/api/";

const getToken = () => localStorage.getItem("access_token");

const saveToken = (accessToken, refreshToken) => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

const removeToken = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// สร้าง instance ของ Axios
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  },
});

// Interceptor สำหรับใส่ Token ใน Request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token found");

    const response = await axios.post(`${baseURL}token/refresh/`, {
      refresh: refreshToken,
    });

    const { access } = response.data;
    saveToken(access, refreshToken);

    return access;
  } catch (error) {
    console.error("Refresh token failed:", error);
    removeToken();
    window.location.href = "/login"; 
    return null;
  }
};

// Interceptor จัดการ Error 401 (Token หมดอายุ)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ถ้าได้ Error 401 และยังไม่เคย retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        apiClient.defaults.headers["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
