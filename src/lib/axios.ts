// dependency imports
import axios from "axios";

// file imports
import config from "@/config/env";

const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true,
    timeout: 10000
});

// Optional: Global error handling + auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("error is ", error);
    if (false && (error.response?.status === 401 && error?.response?.data.message !== "Invalid email or password")) {
      // Auto redirect to login on token expiry
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;