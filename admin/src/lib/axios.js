import axios from "axios";

// Πάντα /api: αν same-origin χρησιμοποιείται '/api', αλλιώς όρισε VITE_API_URL (π.χ. https://riocomfortfoodsapi-yelm3.sevalla.app/api)
const baseURL = import.meta.env.VITE_API_URL || "/api";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default axiosInstance;
