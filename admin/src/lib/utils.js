export const capitalizeText = (text) => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getOrderStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "badge-success";
    case "shipped":
      return "badge-info";
    case "pending":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
};

export const getStockStatusBadge = (stock) => {
  if (stock === 0) return { text: "Out of Stock", class: "badge-error" };
  if (stock < 20) return { text: "Low Stock", class: "badge-warning" };
  return { text: "In Stock", class: "badge-success" };
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};