/**
 * Optimizes Cloudinary image URLs by injecting f_auto,q_auto,w_500,c_scale after /upload/.
 * Returns the original URL unchanged if it is not from Cloudinary.
 */
export const getOptimizedUrl = (url: string | null | undefined): string | undefined => {
  if (url == null || typeof url !== "string" || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (!trimmed.includes("cloudinary.com") || !trimmed.includes("/upload/")) return trimmed;
  return trimmed.replace("/upload/", "/upload/f_auto,q_auto,w_500,c_scale/");
};

export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Κάνει το κείμενο πεζό και αφαιρεί τόνους/διακριτικά,
 * ώστε οι συγκρίσεις να είναι case-insensitive και accent-insensitive.
 */
export const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "#10B981";
    case "shipped":
      return "#3B82F6";
    case "pending":
      return "#F59E0B";
    default:
      return "#666";
  }
};
