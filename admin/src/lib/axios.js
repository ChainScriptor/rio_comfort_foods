import axios from "axios";

// Production API: set VITE_API_URL in admin/.env (e.g. https://riocomfortfoodsapi-yelm3.sevalla.app/api)
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://riocomfortfoodsapi-yelm3.sevalla.app/api" : "http://localhost:3000/api");

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default axiosInstance;
