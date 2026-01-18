export const capitalizeText = (text) => {
  if (!text) return text;
  
  // Translate order statuses to Greek
  const statusTranslations = {
    pending: "Σε Αναμονή",
    shipped: "Στάλθηκε",
    delivered: "Παραδόθηκε",
    cancelled: "Ακυρώθηκε",
  };
  
  const lowerText = text.toLowerCase();
  if (statusTranslations[lowerText]) {
    return statusTranslations[lowerText];
  }
  
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
    case "cancelled":
      return "badge-error";
    default:
      return "badge-ghost";
  }
};

export const getStockStatusBadge = (stock) => {
  if (stock === 0) return { text: "Εκτός Αποθέματος", class: "badge-error" };
  if (stock < 20) return { text: "Χαμηλό Απόθεμα", class: "badge-warning" };
  return { text: "Σε Απόθεμα", class: "badge-success" };
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Date(dateString).toLocaleDateString("el-GR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Date(dateString).toLocaleTimeString("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

export const formatDateWithDayName = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear().toString().slice(-2);

  return `[${dayName} ${day}/${month}/${year}]`;
};