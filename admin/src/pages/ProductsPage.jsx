import { useState, useMemo } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, ImageIcon, SearchIcon, FilterIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, categoryApi } from "../lib/api";
import { getStockStatusBadge } from "../lib/utils";

function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    unitType: "pieces",
    unitOptions: [],
    showPrice: true,
  });
  const [unitOptionInput, setUnitOptionInput] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const queryClient = useQueryClient();

  // fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getAll,
  });

  // fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  });

  // creating, update, deleting
  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: productApi.update,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const closeModal = () => {
    // reset the state
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
      unitType: "pieces",
      unitOptions: [],
      showPrice: true,
    });
    setUnitOptionInput("");
    setImages([]);
    setImagePreviews([]);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price ? product.price.toString() : "",
      stock: product.stock.toString(),
      description: product.description,
      unitType: product.unitType || "pieces",
      unitOptions: product.unitOptions || [],
      showPrice: product.showPrice !== undefined ? product.showPrice : true,
    });
    setImagePreviews(product.images);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) return alert("Maximum 3 images allowed");

    // revoke previous blob URLs to free memory
    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // for new products, require images
    if (!editingProduct && imagePreviews.length === 0) {
      return alert("Please upload at least one image");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    if (formData.price) {
      formDataToSend.append("price", formData.price);
    }
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("unitType", formData.unitType);
    formDataToSend.append("unitOptions", JSON.stringify(formData.unitOptions));
    formDataToSend.append("showPrice", formData.showPrice.toString());

    // only append new images if they were selected
    if (images.length > 0) images.forEach((image) => formDataToSend.append("images", image));

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, formData: formDataToSend });
    } else {
      createProductMutation.mutate(formDataToSend);
    }
  };

  // Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search query (search in name, description, and category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Προϊόντα</h1>
          <p className="text-base-content/70 mt-1">Διαχείριση αποθέματος προϊόντων</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
          <PlusIcon className="w-5 h-5" />
          Προσθήκη Προϊόντος
        </button>
      </div>

      {/* FILTERS AND SEARCH */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <SearchIcon className="w-4 h-4" />
                  Αναζήτηση Προϊόντων
                </span>
              </label>
              <input
                type="text"
                placeholder="Αναζήτηση με όνομα, περιγραφή ή κατηγορία..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="form-control md:w-64">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FilterIcon className="w-4 h-4" />
                  Φίλτρο Κατηγορίας
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Όλες οι Κατηγορίες</option>
                {categories
                  .filter((cat) => cat.isActive)
                  .map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.icon && `${category.icon} `}
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-base-content/70 mt-2">
            Εμφάνιση {filteredProducts.length} από {products.length} προϊόντα
            {selectedCategory && ` στην κατηγορία "${selectedCategory}"`}
            {searchQuery && ` με αναζήτηση "${searchQuery}"`}
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center py-12">
            <p className="text-xl font-semibold mb-2">Δεν βρέθηκαν προϊόντα</p>
            <p className="text-base-content/70">
              {searchQuery || selectedCategory
                ? "Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης"
                : "Προσθέστε το πρώτο σας προϊόν"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => {
            const status = getStockStatusBadge(product.stock);

            return (
              <div key={product._id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-6">
                    <div className="avatar">
                      <div className="w-20 rounded-xl">
                        <img src={product.images[0]} alt={product.name} />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="card-title">{product.name}</h3>
                          <p className="text-base-content/70 text-sm">{product.category}</p>
                        </div>
                        <div className={`badge ${status.class}`}>{status.text}</div>
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        {product.price && (
                          <div>
                            <p className="text-xs text-base-content/70">Τιμή</p>
                            <p className="font-bold text-lg">${product.price}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-base-content/70">Απόθεμα</p>
                          <p className="font-bold text-lg">{product.stock} τεμάχια</p>
                        </div>
                        {product.showPrice !== undefined && (
                          <div>
                            <p className="text-xs text-base-content/70">Εμφάνιση Τιμής</p>
                            <p className="font-bold text-sm">{product.showPrice ? "✓ Ναι" : "✗ Όχι"}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn btn-square btn-ghost"
                        onClick={() => handleEdit(product)}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        className="btn btn-square btn-ghost text-error"
                        onClick={() => deleteProductMutation.mutate(product._id)}
                      >
                        {deleteProductMutation.isPending ? (
                          <span className="loading loading-spinner"></span>
                        ) : (
                          <Trash2Icon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}

      <input
        type="checkbox"
        className="modal-toggle"
        checked={showModal}
        onChange={(e) => setShowModal(e.target.checked)}
      />

      <div className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-2xl">
              {editingProduct ? "Επεξεργασία Προϊόντος" : "Προσθήκη Νέου Προϊόντος"}
            </h3>

            <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span>Product Name</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter product name"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((cat) => cat.isActive)
                    .map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.icon && `${category.icon} `}
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span>Price ($)</span>
                  <span className="label-text-alt text-base-content/70">Optional</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="input input-bordered"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Stock</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.showPrice}
                  onChange={(e) => setFormData({ ...formData, showPrice: e.target.checked })}
                />
                <span className="label-text">Εμφάνιση Τιμής στο Mobile</span>
              </label>
              <label className="label">
                <span className="label-text-alt text-base-content/70">
                  Αν ενεργοποιηθεί, η τιμή θα εμφανίζεται στο mobile app
                </span>
              </label>
            </div>

            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span>Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span>Unit Type</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value, unitOptions: [] })}
                required
              >
                <option value="pieces">Τεμάχια</option>
                <option value="kg">Κιλά</option>
                <option value="liters">Λίτρα</option>
              </select>
            </div>

            {formData.unitType !== "pieces" && (
              <div className="form-control">
                <label className="label">
                  <span>Unit Options (e.g., 1 λίτρο, 5 λίτρα, 25 λίτρα)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Προσθήκη επιλογής..."
                    className="input input-bordered flex-1"
                    value={unitOptionInput}
                    onChange={(e) => setUnitOptionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (unitOptionInput.trim() && !formData.unitOptions.includes(unitOptionInput.trim())) {
                          setFormData({
                            ...formData,
                            unitOptions: [...formData.unitOptions, unitOptionInput.trim()],
                          });
                          setUnitOptionInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (unitOptionInput.trim() && !formData.unitOptions.includes(unitOptionInput.trim())) {
                        setFormData({
                          ...formData,
                          unitOptions: [...formData.unitOptions, unitOptionInput.trim()],
                        });
                        setUnitOptionInput("");
                      }
                    }}
                  >
                    Προσθήκη
                  </button>
                </div>
                {formData.unitOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.unitOptions.map((option, index) => (
                      <div key={index} className="badge badge-primary badge-lg gap-2">
                        {option}
                        <button
                          type="button"
                          className="btn btn-xs btn-circle btn-ghost"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              unitOptions: formData.unitOptions.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Images
                </span>
                <span className="label-text-alt text-xs opacity-60">Max 3 images</span>
              </label>

              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-base-300 hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-primary w-full"
                  required={!editingProduct}
                />

                {editingProduct && (
                  <p className="text-xs text-base-content/60 mt-2 text-center">
                    Leave empty to keep current images
                  </p>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="avatar">
                      <div className="w-20 rounded-lg">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={closeModal}
                className="btn"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                Ακύρωση
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : editingProduct ? (
                  "Ενημέρωση Προϊόντος"
                ) : (
                  "Προσθήκη Προϊόντος"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
