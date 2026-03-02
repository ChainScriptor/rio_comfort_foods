import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, TagIcon, CheckCircle2Icon, XCircleIcon, ImageIcon, MoveIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryApi } from "../lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Category Row Component
function SortableCategoryRow({ category, index, onEdit, onDelete, onToggleActive, isDeleting, isUpdating }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-base-200/50 transition-colors ${
        !category.isActive ? "opacity-60" : ""
      } ${isDragging ? "z-50" : ""}`}
    >
      <td>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-base-300 transition-colors inline-flex"
          title="Σύρετε για να αλλάξετε τη σειρά"
        >
          <MoveIcon className="w-4 h-4 text-base-content/40" />
        </div>
      </td>
      
      <td>
        <div className="flex items-center gap-3">
          {/* Image/Icon */}
          <div className="flex-shrink-0">
            {category.image ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-base-300">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : category.icon ? (
              <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center text-xl border border-base-300">
                {category.icon}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <TagIcon className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <div className="font-semibold truncate">{category.name}</div>
            {category.description && (
              <div className="text-xs text-base-content/60 truncate max-w-xs">
                {category.description}
              </div>
            )}
          </div>
        </div>
      </td>

      <td>
        <div className="badge badge-outline badge-sm">#{index + 1}</div>
      </td>

      <td>
        <div
          className={`badge badge-sm gap-1 ${
            category.isActive
              ? "badge-success"
              : "badge-error"
          }`}
        >
          {category.isActive ? (
            <CheckCircle2Icon className="w-3 h-3" />
          ) : (
            <XCircleIcon className="w-3 h-3" />
          )}
          {category.isActive ? "Ενεργή" : "Ανενεργή"}
        </div>
      </td>

      <td>
        <div className="flex items-center gap-1">
          <button
            className={`btn btn-xs ${
              category.isActive
                ? "btn-outline btn-error"
                : "btn-outline btn-success"
            }`}
            onClick={() => onToggleActive(category)}
            disabled={isUpdating}
            title={category.isActive ? "Απενεργοποίηση" : "Ενεργοποίηση"}
          >
            {isUpdating ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : category.isActive ? (
              <XCircleIcon className="w-3 h-3" />
            ) : (
              <CheckCircle2Icon className="w-3 h-3" />
            )}
          </button>

          <button
            className="btn btn-xs btn-square btn-ghost hover:btn-primary"
            onClick={() => onEdit(category)}
            title="Επεξεργασία"
          >
            <PencilIcon className="w-3 h-3" />
          </button>
          
          <button
            className="btn btn-xs btn-square btn-ghost hover:btn-error"
            onClick={() => onDelete(category)}
            disabled={isDeleting}
            title="Διαγραφή"
          >
            {isDeleting ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <Trash2Icon className="w-3 h-3" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

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

  // Τοπική κατάσταση για την τρέχουσα σειρά κατηγοριών (ώστε το drag & drop να δουλεύει άμεσα).
  const [orderedCategories, setOrderedCategories] = useState([]);

  // Κάθε φορά που αλλάζουν οι κατηγορίες από το API, υπολόγισε τη σειρά με βάση το order/createdAt.
  useEffect(() => {
    const sorted = [...categories].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA === orderB) {
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      }
      return orderA - orderB;
    });
    setOrderedCategories(sorted);
  }, [categories]);

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
      return alert("Το όνομα κατηγορίας είναι υποχρεωτικό");
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
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε την "${category.name}";`)) {
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

  const activeCategories = orderedCategories.filter((cat) => cat.isActive).length;
  const inactiveCategories = orderedCategories.filter((cat) => !cat.isActive).length;

  // Drag and Drop Handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (active.id !== over.id) {
      const oldIndex = orderedCategories.findIndex((cat) => cat._id === active.id);
      const newIndex = orderedCategories.findIndex((cat) => cat._id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(orderedCategories, oldIndex, newIndex);

      // Ενημέρωσε άμεσα την τοπική κατάσταση για να δει ο χρήστης τη νέα σειρά.
      setOrderedCategories(reordered);

      // Persist new order to backend (sequential order values)
      reordered.forEach((cat, index) => {
        updateCategoryMutation.mutate({
          id: cat._id,
          categoryData: { order: index },
        });
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-primary" />
            Κατηγορίες
          </h1>
          <p className="text-sm text-base-content/70 mt-1">Σύρετε τις γραμμές για να αλλάξετε τη σειρά</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary btn-sm gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Προσθήκη Κατηγορίας
        </button>
      </div>

      {/* COMPACT STATS */}
      {categories.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <div className="badge badge-primary badge-lg gap-2">
            <TagIcon className="w-4 h-4" />
            {categories.length} {categories.length === 1 ? "Κατηγορία" : "Κατηγορίες"}
          </div>
          <div className="badge badge-success badge-lg gap-2">
            <CheckCircle2Icon className="w-4 h-4" />
            {activeCategories} Ενεργές
          </div>
          <div className="badge badge-error badge-lg gap-2">
            <XCircleIcon className="w-4 h-4" />
            {inactiveCategories} Ανενεργές
          </div>
        </div>
      )}

      {/* CATEGORIES TABLE WITH DRAG AND DROP */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-base-200 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <TagIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">Δεν υπάρχουν κατηγορίες ακόμη</h3>
          <p className="text-base-content/70 mb-4 text-center max-w-md text-sm">
            Ξεκινήστε δημιουργώντας την πρώτη σας κατηγορία.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm gap-2">
            <PlusIcon className="w-4 h-4" />
            Δημιουργία Κατηγορίας
          </button>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedCategories.map((cat) => cat._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th className="w-10"></th>
                        <th>Κατηγορία</th>
                        <th className="w-20">Θέση</th>
                        <th className="w-24">Κατάσταση</th>
                        <th className="w-32">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderedCategories.map((category, index) => (
                        <SortableCategoryRow
                          key={category._id}
                          category={category}
                          index={index}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={handleToggleActive}
                          isDeleting={deleteCategoryMutation.isPending}
                          isUpdating={updateCategoryMutation.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>
          </div>
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
                  {editingCategory ? "Επεξεργασία Κατηγορίας" : "Προσθήκη Νέας Κατηγορίας"}
                </h3>
                <p className="text-sm text-base-content/60">
                  {editingCategory
                    ? "Ενημέρωση πληροφοριών κατηγορίας"
                    : "Δημιουργία νέας κατηγορίας για τα προϊόντα σας"}
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
                  <span className="label-text font-semibold">Όνομα Κατηγορίας *</span>
                </label>
                <input
                  type="text"
                  placeholder="π.χ., Ηλεκτρονικά, Μόδα, Αθλητικά"
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
                    Εικόνα Κατηγορίας
                  </span>
                  <span className="label-text-alt text-primary">Προαιρετικό</span>
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
                        Αφήστε κενό για να διατηρήσετε την τρέχουσα εικόνα
                      </p>
                    )}
                  </div>
                </div>
                <label className="label">
                  <span className="label-text-alt">Ανεβάστε μια εικόνα ή χρησιμοποιήστε emoji εικονίδιο παρακάτω</span>
                </label>
              </div>

              {/* Icon Preview and Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Εικονίδιο (Emoji)</span>
                  <span className="label-text-alt text-primary">Προαιρετικό</span>
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
                      ? "Η εικόνα έχει προτεραιότητα έναντι του emoji"
                      : "Προσθέστε ένα emoji για να ξεχωρίσει η κατηγορία σας"}
                  </span>
                </label>
              </div>

              {/* Active Status (only when editing) */}
              {editingCategory && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Κατάσταση</span>
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-base-200 rounded-xl">
                    <label className="label cursor-pointer flex-1">
                      <span className="label-text">
                        {editingCategory.isActive ? "Ενεργή" : "Ανενεργή"}
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
                      {editingCategory.isActive ? "Ενεργή" : "Ανενεργή"}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-semibold">Περιγραφή</span>
                  <span className="label-text-alt text-primary">Προαιρετικό</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 focus:textarea-primary transition-colors"
                  placeholder="Εισάγετε μια σύντομη περιγραφή αυτής της κατηγορίας..."
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
                    {formData.description.length}/500 χαρακτήρες
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            {(formData.name || formData.icon || imagePreview || (editingCategory && editingCategory.image)) && (
              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-primary/30">
                <p className="text-sm font-semibold mb-3 text-base-content/70">Προεπισκόπηση:</p>
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
                          {formData.name || "Όνομα Κατηγορίας"}
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
                Ακύρωση
              </button>

              <button
                type="submit"
                className="btn btn-primary gap-2 shadow-lg"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    {editingCategory ? "Ενημέρωση..." : "Δημιουργία..."}
                  </>
                ) : editingCategory ? (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    Ενημέρωση Κατηγορίας
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Προσθήκη Κατηγορίας
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>κλείσιμο</button>
        </form>
      </div>
    </div>
  );
}

export default CategoriesPage;
