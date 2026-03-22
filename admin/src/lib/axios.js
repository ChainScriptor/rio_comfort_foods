import axios from "axios";

// Πάντα /api: αν same-origin χρησιμοποιείται '/api', αλλιώς όρισε VITE_API_URL (π.χ. https://www.comfortfoods.store/api ή ξεχωριστό API host)
const baseURL = import.meta.env.VITE_API_URL || "/api";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  // Μην ορίζεις global "Content-Type": έτσι ο browser/axios
  // επιλέγει μόνος του: application/json για JSON,
  // multipart/form-data για FormData (π.χ. uploads banner image).
  headers: {
    Accept: "application/json",
  },
});

export default axiosInstance;
