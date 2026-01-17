import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import { TrashIcon, MapPinIcon, XIcon } from "lucide-react";

function CustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: customerApi.getAll,
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomer(null);
    },
  });

  const handleDeleteCustomer = (customerId, customerName) => {
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε τον πελάτη "${customerName}";`)) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const customers = data?.customers || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Πελάτες</h1>
        <p className="text-base-content/70 mt-1">
          {customers.length} {customers.length === 1 ? "πελάτης" : "πελάτες"} εγγεγραμμένοι
        </p>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">Δεν υπάρχουν πελάτες ακόμη</p>
              <p className="text-sm">Οι πελάτες θα εμφανίζονται εδώ μόλις εγγραφούν</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Πελάτης</th>
                    <th>Email</th>
                    <th>Διευθύνσεις / Μαγαζί</th>
                    <th>Λίστα Επιθυμιών</th>
                    <th>Ημερομηνία Εγγραφής</th>
                    <th>Ενέργειες</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-12">
                            <img
                              src={customer.imageUrl}
                              alt={customer.name}
                              className="w-12 h-12 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="font-semibold">{customer.name}</div>
                      </td>

                      <td>{customer.email}</td>

                      <td>
                        {customer.addresses && customer.addresses.length > 0 ? (
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="btn btn-ghost btn-sm gap-2"
                          >
                            <MapPinIcon className="w-4 h-4" />
                            {customer.addresses.length} {customer.addresses.length === 1 ? 'διεύθυνση' : 'διευθύνσεις'}
                          </button>
                        ) : (
                          <span className="text-sm opacity-60">Δεν υπάρχουν διευθύνσεις</span>
                        )}
                      </td>

                      <td>
                        <div className="badge badge-ghost">
                          {customer.wishlist?.length || 0} {customer.wishlist?.length === 1 ? 'προϊόν' : 'προϊόντα'}
                        </div>
                      </td>

                      <td>
                        <span className="text-sm opacity-60">{formatDate(customer.createdAt)}</span>
                      </td>

                      <td>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id, customer.name)}
                          className="btn btn-error btn-sm btn-square"
                          disabled={deleteCustomerMutation.isPending}
                          title="Διαγραφή πελάτη"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADDRESSES MODAL */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={!!selectedCustomer}
        onChange={(e) => {
          if (!e.target.checked) setSelectedCustomer(null);
        }}
      />

      <div className="modal">
        <div className="modal-box max-w-2xl">
          {selectedCustomer && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-2xl flex items-center gap-2">
                    <MapPinIcon className="w-6 h-6" />
                    Διευθύνσεις & Μαγαζί
                  </h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    {selectedCustomer.name} - {selectedCustomer.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                <div className="space-y-4">
                  {selectedCustomer.addresses.map((address, index) => (
                    <div
                      key={index}
                      className="bg-base-200 rounded-xl p-4 border border-base-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-lg">{address.label}</h4>
                          {address.isDefault && (
                            <span className="badge badge-primary badge-sm">Προεπιλογή</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-base-content/60">Όνομα:</span>
                          <span className="ml-2 font-medium">{address.fullName}</span>
                        </div>
                        <div>
                          <span className="text-base-content/60">Διεύθυνση:</span>
                          <span className="ml-2 font-medium">{address.streetAddress}</span>
                        </div>
                        <div>
                          <span className="text-base-content/60">Πόλη:</span>
                          <span className="ml-2 font-medium">
                            {address.city}, {address.state} {address.zipCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-base-content/60">Τηλέφωνο:</span>
                          <span className="ml-2 font-medium">{address.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/60">
                  <p>Δεν υπάρχουν διευθύνσεις για αυτόν τον πελάτη</p>
                </div>
              )}

              <div className="modal-action">
                <button onClick={() => setSelectedCustomer(null)} className="btn">
                  Κλείσιμο
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default CustomersPage;
