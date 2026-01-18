import axiosInstance from "./axios";

export const productApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/products");
    return data;
  },

  create: async (formData) => {
    const { data } = await axiosInstance.post("/admin/products", formData);
    return data;
  },

  update: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/admin/products/${id}`, formData);
    return data;
  },

  delete: async (productId) => {
    const { data } = await axiosInstance.delete(`/admin/products/${productId}`);
    return data;
  },
};

export const orderApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/orders");
    return data;
  },

  updateStatus: async ({ orderId, status }) => {
    const { data } = await axiosInstance.patch(`/admin/orders/${orderId}/status`, { status });
    return data;
  },

  updateDeliveryDate: async ({ orderId, deliveryDate }) => {
    const { data } = await axiosInstance.patch(`/admin/orders/${orderId}/delivery-date`, { deliveryDate });
    return data;
  },
};

export const inviteApi = {
  inviteCustomer: async ({ email, customerId }) => {
    const { data } = await axiosInstance.post("/admin/invite", { email, customerId });
    return data;
  },
};

export const statsApi = {
  getDashboard: async (params = { period: "all" }) => {
    const { data } = await axiosInstance.get("/admin/stats", {
      params,
    });
    return data;
  },
};

export const customerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/customers");
    return data;
  },
  delete: async (customerId) => {
    const { data } = await axiosInstance.delete(`/admin/customers/${customerId}`);
    return data;
  },
};

export const categoryApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/categories");
    return data;
  },

  create: async (categoryData) => {
    const { data } = await axiosInstance.post("/admin/categories", categoryData);
    return data;
  },

  update: async ({ id, categoryData }) => {
    const { data } = await axiosInstance.put(`/admin/categories/${id}`, categoryData);
    return data;
  },

  delete: async (categoryId) => {
    const { data } = await axiosInstance.delete(`/admin/categories/${categoryId}`);
    return data;
  },
};

export const reviewApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/reviews");
    return data;
  },
};

export const bannerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/banners");
    return data;
  },

  create: async (formData) => {
    const { data } = await axiosInstance.post("/admin/banners", formData);
    return data;
  },

  update: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/admin/banners/${id}`, formData);
    return data;
  },

  delete: async (bannerId) => {
    const { data } = await axiosInstance.delete(`/admin/banners/${bannerId}`);
    return data;
  },
};