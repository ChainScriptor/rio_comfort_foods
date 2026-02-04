import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, ImageIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannerApi } from "../lib/api";

function BannersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    linkUrl: "",
    isActive: true,
    order: 0,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const queryClient = useQueryClient();

  // Fetch banners
  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: bannerApi.getAll,
  });

  const banners = bannersData?.banners || [];

  // Mutations
  const createBannerMutation = useMutation({
    mutationFn: bannerApi.create,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: bannerApi.update,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: bannerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      linkUrl: "",
      isActive: true,
      order: 0,
    });
    setImage(null);
    setImagePreview(null);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      linkUrl: banner.linkUrl || "",
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      order: banner.order || 0,
    });
    setImage(null);
    setImagePreview(banner.imageUrl || null);
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

    // For new banners, require image
    if (!editingBanner && !image) {
      return alert("Παρακαλώ ανεβάστε μια εικόνα");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("linkUrl", formData.linkUrl || "");
    formDataToSend.append("isActive", formData.isActive.toString());
    formDataToSend.append("order", formData.order.toString());

    // Only append image if it was selected
    if (image) {
      formDataToSend.append("image", image);
    }

    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner._id, formData: formDataToSend });
    } else {
      createBannerMutation.mutate(formDataToSend);
    }
  };

  const handleDelete = (bannerId) => {
    if (window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το banner;")) {
      deleteBannerMutation.mutate(bannerId);
    }
  };

  const handleToggleActive = (banner) => {
    const formDataToSend = new FormData();
    formDataToSend.append("linkUrl", banner.linkUrl || "");
    formDataToSend.append("isActive", (!banner.isActive).toString());
    formDataToSend.append("order", (banner.order || 0).toString());

    updateBannerMutation.mutate({ id: banner._id, formData: formDataToSend });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-base-content/70 mt-1">Διαχείριση banners για το mobile app</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
          <PlusIcon className="w-5 h-5" />
          Προσθήκη Banner
        </button>
      </div>

      {/* BANNERS TABLE */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">Δεν υπάρχουν banners ακόμη</p>
              <p className="text-sm">Προσθέστε ένα banner για να εμφανίζεται στο mobile app</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Εικόνα</th>
                    <th>Link URL</th>
                    <th>Σειρά</th>
                    <th>Κατάσταση</th>
                    <th>Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner) => (
                    <tr key={banner._id}>
                      <td>
                        <div className="w-24 h-16 rounded-lg overflow-hidden border border-base-300">
                          <img
                            src={banner.imageUrl}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td>
                        {banner.linkUrl ? (
                          <a
                            href={banner.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link link-primary text-sm truncate max-w-xs block"
                          >
                            {banner.linkUrl}
                          </a>
                        ) : (
                          <span className="text-sm opacity-60">-</span>
                        )}
                      </td>
                      <td>
                        <div className="badge badge-outline badge-sm">#{banner.order || 0}</div>
                      </td>
                      <td>
                        <div
                          className={`badge badge-sm gap-1 ${
                            banner.isActive ? "badge-success" : "badge-error"
                          }`}
                        >
                          {banner.isActive ? (
                            <>
                              <CheckCircle2Icon className="w-3 h-3" />
                              Ενεργό
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-3 h-3" />
                              Ανενεργό
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(banner)}
                            className={`btn btn-sm btn-square ${
                              banner.isActive ? "btn-warning" : "btn-success"
                            }`}
                            disabled={updateBannerMutation.isPending}
                            title={banner.isActive ? "Απενεργοποίηση" : "Ενεργοποίηση"}
                          >
                            {banner.isActive ? (
                              <XCircleIcon className="w-4 h-4" />
                            ) : (
                              <CheckCircle2Icon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(banner)}
                            className="btn btn-sm btn-square btn-ghost"
                            title="Επεξεργασία"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner._id)}
                            className="btn btn-sm btn-square btn-error"
                            disabled={deleteBannerMutation.isPending}
                            title="Διαγραφή"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={showModal}
        onChange={(e) => {
          if (!e.target.checked) closeModal();
        }}
      />

      <div className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-2xl">
              {editingBanner ? "Επεξεργασία Banner" : "Προσθήκη Banner"}
            </h3>
            <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Εικόνα Banner *</span>
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="w-48 h-32 rounded-lg overflow-hidden border border-base-300">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input file-input-bordered w-full"
                    required={!editingBanner}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      {editingBanner
                        ? "Αφήστε κενό για να διατηρήσετε την τρέχουσα εικόνα"
                        : "Απαιτείται εικόνα για νέο banner"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Link URL */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Link URL (Προαιρετικό)</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="input input-bordered"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  URL που θα ανοίγει όταν ο χρήστης πατήσει το banner
                </span>
              </label>
            </div>

            {/* Order */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Σειρά</span>
              </label>
              <input
                type="number"
                min="0"
                className="input input-bordered"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Χρησιμοποιείται για την σειρά εμφάνισης (μικρότερος αριθμός = πρώτα)
                </span>
              </label>
            </div>

            {/* Active Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Ενεργό</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </label>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Αν είναι ανενεργό, δεν θα εμφανίζεται στο mobile app
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="modal-action">
              <button type="button" onClick={closeModal} className="btn btn-ghost">
                Ακύρωση
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
              >
                {createBannerMutation.isPending || updateBannerMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : editingBanner ? (
                  "Αποθήκευση Αλλαγών"
                ) : (
                  "Προσθήκη Banner"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BannersPage;
