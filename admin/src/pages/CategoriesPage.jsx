import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, TagIcon, CheckCircle2Icon, XCircleIcon, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryApi } from "../lib/api";

function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: categoryApi.update,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      icon: "",
    });
    setImage(null);
    setImagePreview(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
    });
    setImage(null);
    setImagePreview(category.image || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous blob URL to free memory
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return alert("Category name is required");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("icon", formData.icon);

    // Only append image if a new one was selected
    if (image) {
      formDataToSend.append("image", image);
    }

    if (editingCategory) {
      formDataToSend.append("isActive", editingCategory.isActive);
      updateCategoryMutation.mutate({
        id: editingCategory._id,
        categoryData: formDataToSend,
      });
    } else {
      createCategoryMutation.mutate(formDataToSend);
    }
  };

  const handleDelete = (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteCategoryMutation.mutate(category._id);
    }
  };

  const handleToggleActive = (category) => {
    updateCategoryMutation.mutate({
      id: category._id,
      categoryData: {
        ...category,
        isActive: !category.isActive,
      },
    });
  };

  const activeCategories = categories.filter((cat) => cat.isActive).length;
  const inactiveCategories = categories.filter((cat) => !cat.isActive).length;

  // Sort categories by custom order (fallback to created order)
  const sortedCategories = [...categories].sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA === orderB) {
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    }
    return orderA - orderB;
  });

  const handleReorder = (category, direction) => {
    const currentIndex = sortedCategories.findIndex((cat) => cat._id === category._id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedCategories.length) return;

    // Create a new array with swapped positions
    const reordered = [...sortedCategories];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Persist new order to backend (sequential order values)
    reordered.forEach((cat, index) => {
      updateCategoryMutation.mutate({
        id: cat._id,
        categoryData: { order: index },
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TagIcon className="w-8 h-8 text-primary" />
            Categories
          </h1>
          <p className="text-base-content/70 mt-1">Manage and organize your product categories</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* STATS CARDS */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-200 rounded-xl shadow-md">
            <div className="stat-figure text-primary">
              <TagIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Categories</div>
            <div className="stat-value text-primary">{categories.length}</div>
          </div>
          <div className="stat bg-base-200 rounded-xl shadow-md">
            <div className="stat-figure text-success">
              <CheckCircle2Icon className="w-8 h-8" />
            </div>
            <div className="stat-title">Active</div>
            <div className="stat-value text-success">{activeCategories}</div>
          </div>
          <div className="stat bg-base-200 rounded-xl shadow-md">
            <div className="stat-figure text-error">
              <XCircleIcon className="w-8 h-8" />
            </div>
            <div className="stat-title">Inactive</div>
            <div className="stat-value text-error">{inactiveCategories}</div>
          </div>
        </div>
      )}

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedCategories?.map((category, index) => (
          <div
            key={category._id}
            className={`card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
              category.isActive ? "border-primary/20" : "border-base-300 opacity-75"
            }`}
          >
            <div className="card-body p-5">
              {/* Image/Icon and Name Section */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {category.image ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-base-300">
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : category.icon ? (
                    <div className="text-4xl flex-shrink-0">{category.icon}</div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TagIcon className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="card-title text-lg font-bold truncate">{category.name}</h3>
                  </div>
                </div>
              </div>

              {/* Description */}
              {category.description && (
                <p className="text-base-content/60 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-base-300">
                <div className="flex items-center gap-2">
                  <div className="badge badge-outline badge-sm">
                    Θέση: {index + 1}
                  </div>
                  <div
                    className={`badge badge-lg gap-1.5 ${
                    category.isActive
                      ? "badge-success"
                      : "badge-error"
                  }`}
                  >
                    {category.isActive ? (
                      <CheckCircle2Icon className="w-3.5 h-3.5" />
                    ) : (
                      <XCircleIcon className="w-3.5 h-3.5" />
                    )}
                    {category.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {/* Reorder buttons */}
                  <button
                    className="btn btn-xs btn-square btn-ghost"
                    onClick={() => handleReorder(category, "up")}
                    title="Μετακίνηση επάνω"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-xs btn-square btn-ghost"
                    onClick={() => handleReorder(category, "down")}
                    title="Μετακίνηση κάτω"
                    disabled={index === sortedCategories.length - 1}
                  >
                    ↓
                  </button>

                  <button
                    className="btn btn-sm btn-square btn-ghost hover:btn-primary transition-colors"
                    onClick={() => handleEdit(category)}
                    title="Edit category"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-sm btn-square btn-ghost hover:btn-error transition-colors"
                    onClick={() => handleDelete(category)}
                    disabled={deleteCategoryMutation.isPending}
                    title="Delete category"
                  >
                    {deleteCategoryMutation.isPending ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <Trash2Icon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Toggle Button */}
              <button
                className={`btn btn-sm w-full mt-2 ${
                  category.isActive
                    ? "btn-outline btn-error"
                    : "btn-outline btn-success"
                }`}
                onClick={() => handleToggleActive(category)}
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : category.isActive ? (
                  <>
                    <XCircleIcon className="w-4 h-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="w-4 h-4" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-base-200 rounded-2xl">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <TagIcon className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No categories yet</h3>
          <p className="text-base-content/70 mb-6 text-center max-w-md">
            Get started by creating your first category. Categories help organize your products and make them easier to find.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
            <PlusIcon className="w-5 h-5" />
            Create Your First Category
          </button>
        </div>
      )}

      {/* ADD/EDIT CATEGORY MODAL */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={showModal}
        onChange={(e) => setShowModal(e.target.checked)}
      />

      <div className="modal backdrop-blur-sm">
        <div className="modal-box max-w-2xl shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {editingCategory ? (
                  <PencilIcon className="w-6 h-6 text-primary" />
                ) : (
                  <PlusIcon className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-2xl">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <p className="text-sm text-base-content/60">
                  {editingCategory
                    ? "Update category information"
                    : "Create a new category for your products"}
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="btn btn-sm btn-circle btn-ghost hover:btn-error transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Name */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Category Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Electronics, Fashion, Sports"
                  className="input input-bordered input-lg focus:input-primary transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Image Upload */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Category Image
                  </span>
                  <span className="label-text-alt text-primary">Optional</span>
                </label>
                <div className="flex flex-col gap-3">
                  {(imagePreview || (editingCategory && editingCategory.image)) && (
                    <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-base-300">
                      <img
                        src={imagePreview || editingCategory.image}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-base-300 hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input file-input-bordered file-input-primary w-full"
                    />
                    {editingCategory && !image && (
                      <p className="text-xs text-base-content/60 mt-2 text-center">
                        Leave empty to keep current image
                      </p>
                    )}
                  </div>
                </div>
                <label className="label">
                  <span className="label-text-alt">Upload an image or use emoji icon below</span>
                </label>
              </div>

              {/* Icon Preview and Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Icon (Emoji)</span>
                  <span className="label-text-alt text-primary">Optional</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-base-200 flex items-center justify-center text-3xl border-2 border-dashed border-base-300">
                    {formData.icon || "?"}
                  </div>
                  <input
                    type="text"
                    placeholder="📱 👕 ⚽ 📚"
                    className="input input-bordered flex-1"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                    disabled={!!imagePreview || (editingCategory && editingCategory.image)}
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt">
                    {imagePreview || (editingCategory && editingCategory.image)
                      ? "Image takes priority over emoji"
                      : "Add an emoji to make your category stand out"}
                  </span>
                </label>
              </div>

              {/* Active Status (only when editing) */}
              {editingCategory && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Status</span>
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-base-200 rounded-xl">
                    <label className="label cursor-pointer flex-1">
                      <span className="label-text">
                        {editingCategory.isActive ? "Active" : "Inactive"}
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-lg"
                        checked={editingCategory.isActive}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            isActive: e.target.checked,
                          })
                        }
                      />
                    </label>
                    <div
                      className={`badge badge-lg ${
                        editingCategory.isActive ? "badge-success" : "badge-error"
                      }`}
                    >
                      {editingCategory.isActive ? (
                        <CheckCircle2Icon className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 mr-1" />
                      )}
                      {editingCategory.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                  <span className="label-text-alt text-primary">Optional</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 focus:textarea-primary transition-colors"
                  placeholder="Enter a brief description of this category..."
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setFormData({ ...formData, description: e.target.value });
                    }
                  }}
                  maxLength={500}
                />
                <div className="label">
                  <span className={`label-text-alt ${
                    formData.description.length > 450 ? "text-warning" : ""
                  }`}>
                    {formData.description.length}/500 characters
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            {(formData.name || formData.icon || imagePreview || (editingCategory && editingCategory.image)) && (
              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-primary/30">
                <p className="text-sm font-semibold mb-3 text-base-content/70">Preview:</p>
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3">
                      {imagePreview || (editingCategory && editingCategory.image && !image) ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-base-300 flex-shrink-0">
                          <img
                            src={imagePreview || editingCategory.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : formData.icon ? (
                        <div className="text-3xl">{formData.icon}</div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <TagIcon className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">
                          {formData.name || "Category Name"}
                        </h4>
                        {formData.description && (
                          <p className="text-sm text-base-content/60 mt-1 line-clamp-2">
                            {formData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="modal-action pt-4 border-t border-base-300">
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-ghost"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary gap-2 shadow-lg"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    {editingCategory ? "Updating..." : "Creating..."}
                  </>
                ) : editingCategory ? (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    Update Category
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Category
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </div>
    </div>
  );
}

export default CategoriesPage;

