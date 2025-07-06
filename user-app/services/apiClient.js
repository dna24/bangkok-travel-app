import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const baseURL = 'https://api-4x16.onrender.com/api/';

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1]; // ส่วน payload จะอยู่ระหว่าง `.` ที่สอง
    const decodedPayload = JSON.parse(atob(payload)); // Decode base64 และแปลงเป็น JSON
    return decodedPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

const getUserId = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      const decoded = decodeToken(token); // ใช้ฟังก์ชัน decodeToken ที่คุณสร้างไว้
      return decoded?.user_id || null; // ดึง user_id จาก payload ของ token
    }
    return null;
  } catch (error) {
    console.error('Failed to get user_id:', error);
    return null;
  }
};


const getToken = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  console.log('Access Token:', token);
  console.log('Refresh Token:', refreshToken);
  
  if (token) {
    const decoded = decodeToken(token);
    console.log('Decoded Access Token:', decoded);
  }

  return token;
};

const saveToken = async (accessToken, refreshToken) => {
  await AsyncStorage.setItem('access_token', accessToken);
  await AsyncStorage.setItem('refresh_token', refreshToken);
  console.log('Access Token and Refresh Token Saved:', accessToken, refreshToken);
};

const removeToken = async () => {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
  console.log('Tokens removed');
};

const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    console.log('Refresh Token Retrieved:', refreshToken);
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await axios.post(`${baseURL}token/refresh/`, {
      refresh: refreshToken,
    });

    const { access } = response.data;
    await saveToken(access, refreshToken);

    return access;
  } catch (error) {
    console.error('Refresh token failed:', error);
    await removeToken();
    throw error;
  }
};

const checkTokens = async () => {
  const accessToken = await AsyncStorage.getItem('access_token');
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);
};

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { getUserId,apiClient, saveToken, removeToken, decodeToken };
