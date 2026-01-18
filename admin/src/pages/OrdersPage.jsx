import { useState, useMemo } from "react";
import { orderApi } from "../lib/api";
import { formatDate, formatTime, formatDateTime, formatDateWithDayName } from "../lib/utils";
import { PrinterIcon, CalendarIcon, EyeIcon, XIcon, PackageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const STORE_LOCATIONS = [
  "Θεσσαλονίκη",
  "Χαλκιδική Πρώτο Πόδι",
  "Χαλκιδική Δεύτερο Πόδι",
  "Χαλκιδική Τρίτο Πόδι",
  "Άλλο",
];

function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showPrintView, setShowPrintView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is in background
  });

  const updateStatusMutation = useMutation({
    mutationFn: orderApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const updateDeliveryDateMutation = useMutation({
    mutationFn: orderApi.updateDeliveryDate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      // Update selectedOrder to reflect the change
      if (selectedOrder && data.order) {
        setSelectedOrder(data.order);
      }
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const allOrders = ordersData?.orders || [];

  // Filter orders by selected date and location (use deliveryDate if available, otherwise createdAt)
  // Exclude cancelled orders from the list
  const orders = useMemo(() => {
    let filteredOrders = allOrders.filter((order) => order.status !== "cancelled");
    
    // Filter by location if selected
    if (selectedLocation) {
      filteredOrders = filteredOrders.filter(
        (order) => order.shippingAddress?.storeLocation === selectedLocation
      );
    }
    
    // Filter by date if selected
    if (selectedDate) {
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      const nextDay = new Date(selected);
      nextDay.setDate(nextDay.getDate() + 1);

      filteredOrders = filteredOrders.filter((order) => {
        // Use deliveryDate if available, otherwise fall back to createdAt
        const orderDate = new Date(order.deliveryDate || order.createdAt);
        return orderDate >= selected && orderDate < nextDay;
      });
    }

    return filteredOrders;
  }, [allOrders, selectedDate, selectedLocation]);

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Παραγγελίες</h1>
          <p className="text-base-content/70">Διαχείριση παραγγελιών πελατών</p>
        </div>

        {/* DATE FILTER & PRINT */}
        <div className="flex items-end gap-3">
          <div className="form-control">
            <label className="label">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="label-text text-sm">Φίλτρο κατά Ημερομηνία</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input input-bordered input-sm"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="btn btn-ghost btn-sm"
                  title="Εμφάνιση όλων των ημερομηνιών"
                >
                  Όλες
                </button>
              )}
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <PackageIcon className="w-4 h-4 mr-2" />
              <span className="label-text text-sm">Φίλτρο κατά Περιοχή</span>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="select select-bordered select-sm"
              >
                <option value="">Όλες οι περιοχές</option>
                {STORE_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              {selectedLocation && (
                <button
                  onClick={() => setSelectedLocation("")}
                  className="btn btn-ghost btn-sm"
                  title="Εμφάνιση όλων των περιοχών"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-sm gap-2"
            disabled={orders.length === 0}
          >
            <PrinterIcon className="w-4 h-4" />
            Εκτύπωση
          </button>
        </div>
      </div>

      {/* PRINT VIEW - Hidden until print */}
      {showPrintView && (
        <>
          <style>
            {`
              @media print {
                @page {
                  margin: 1.5cm;
                  size: A4;
                }
                * {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                body * {
                  visibility: hidden;
                }
                .print-only, .print-only * {
                  visibility: visible;
                }
                .print-only {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white;
                }
                .print-order-line {
                  page-break-inside: avoid;
                  break-inside: avoid;
                  margin-bottom: 0.4cm;
                  padding: 0.2cm 0;
                  font-size: 11pt;
                  line-height: 1.5;
                  border-bottom: 1px dotted #ccc;
                  color: #000000;
                }
                .print-order-line span {
                  font-weight: bold;
                  color: #000000;
                }
                .print-header {
                  margin-bottom: 1cm;
                  border-bottom: 2px solid #000;
                  padding-bottom: 0.5cm;
                  page-break-after: avoid;
                }
              }
              @media screen {
                .print-only {
                  display: none !important;
                }
              }
            `}
          </style>
          <div className="print-only">
            <div style={{ marginTop: "0.8cm" }}>
              {(() => {
                // Group orders by delivery date (use deliveryDate if available, otherwise createdAt)
                const ordersByDate = {};
                orders.forEach((order) => {
                  // Use deliveryDate if available, otherwise fall back to createdAt
                  const orderDate = new Date(order.deliveryDate || order.createdAt);
                  // Set to start of day for grouping
                  orderDate.setHours(0, 0, 0, 0);
                  const dateKey = orderDate.toISOString().split('T')[0];

                  if (!ordersByDate[dateKey]) {
                    ordersByDate[dateKey] = [];
                  }
                  ordersByDate[dateKey].push(order);
                });

                const dateKeys = Object.keys(ordersByDate).sort();

                return dateKeys.map((dateKey, dateIndex) => {
                  const dateOrders = ordersByDate[dateKey];

                  // Calculate the display date from the dateKey (which is already the correct date)
                  const displayDate = new Date(dateKey);
                  displayDate.setHours(0, 0, 0, 0);

                  // Helper function to create address key for grouping
                  const getAddressKey = (address) => {
                    return `${address.streetAddress}|${address.city}|${address.zipCode}|${address.state}`;
                  };

                  // Group orders by shipping address
                  const ordersByAddress = {};
                  dateOrders.forEach((order) => {
                    const addressKey = getAddressKey(order.shippingAddress);
                    if (!ordersByAddress[addressKey]) {
                      ordersByAddress[addressKey] = [];
                    }
                    ordersByAddress[addressKey].push(order);
                  });

                  // Sort orders by delivery date (or createdAt if no deliveryDate) within each address group
                  Object.keys(ordersByAddress).forEach((addressKey) => {
                    ordersByAddress[addressKey].sort((a, b) => {
                      const dateA = new Date(a.deliveryDate || a.createdAt);
                      const dateB = new Date(b.deliveryDate || b.createdAt);
                      return dateA - dateB;
                    });
                  });

                  // Flatten orders grouped by address, maintaining address grouping
                  const sortedOrdersByAddress = Object.keys(ordersByAddress)
                    .sort()
                    .flatMap((addressKey) => ordersByAddress[addressKey]);

                  return (
                    <div key={dateKey} style={{ marginBottom: "1cm", pageBreakInside: "avoid" }}>
                      {/* Date - show only once per date group */}
                      <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#000000", backgroundColor: "#FFFF00", padding: "0.1cm 0.2cm", display: "inline-block", marginBottom: "0.5cm" }}>
                        Ημερομηνία {formatDateWithDayName(displayDate.toISOString())}
                      </div>

                      {/* All orders for this date, grouped by address */}
                      {Object.keys(ordersByAddress).map((addressKey, addressGroupIndex) => {
                        const addressOrders = ordersByAddress[addressKey];
                        const firstOrder = addressOrders[0];
                        const customerName = firstOrder.shippingAddress.fullName;
                        
                        // Count orders for this address (for supplementary numbering)
                        const addressOrderCount = addressOrders.length;
                        
                        return (
                          <div key={addressKey} style={{ marginBottom: addressGroupIndex < Object.keys(ordersByAddress).length - 1 ? "0.6cm" : "0" }}>
                            {/* All orders for this address - display all products in sequence */}
                            {addressOrders.map((order, orderIndex) => {
                              // Determine if this is a supplementary order (multiple orders for same address on same day)
                              const isSupplementary = addressOrderCount > 1 && orderIndex > 0;
                              const supplementaryNumber = orderIndex;
                              const displayName = isSupplementary
                                ? `${customerName} - συμπληρωματική ${supplementaryNumber}`
                                : customerName;

                              // Collect all items from this order
                              const allOrderItems = order.orderItems;

                              // Helper function to get unit label
                              const getUnitLabel = (item) => {
                                if (item.selectedUnit) return item.selectedUnit;
                                const unitType = item.product?.unitType || "pieces";
                                if (unitType === "kg") return "kg";
                                if (unitType === "liters") return "συσκευασία";
                                return "τμχ"; // pieces
                              };

                              return (
                                <div key={order._id} style={{ marginBottom: orderIndex < addressOrders.length - 1 ? "0.2cm" : "0" }}>
                                  {/* Customer Name with first product on same line */}
                                  {allOrderItems.length > 0 && (
                                    <>
                                      <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#000000", marginBottom: "0.1cm" }}>
                                        <span style={{ backgroundColor: "#FFFF00", padding: "0.1cm 0.2cm", display: "inline-block" }}>
                                          {displayName}
                                        </span>
                                        <span style={{ marginLeft: "0.3cm" }}>
                                          -  ({getUnitLabel(allOrderItems[0])}: {allOrderItems[0].quantity}) {allOrderItems[0].name}
                                        </span>
                                        {/* Delivery Date */}
                                        {order.deliveryDate && (
                                          <span style={{ marginLeft: "0.3cm", fontSize: "10pt", color: "#666" }}>
                                            [Παραλαβή: {formatDate(order.deliveryDate)}]
                                          </span>
                                        )}
                                      </div>
                                      {/* Remaining products from this order */}
                                      {allOrderItems.slice(1).map((item, itemIndex) => (
                                        <div
                                          key={`${order._id}-${itemIndex}`}
                                          style={{
                                            fontSize: "11pt",
                                            fontWeight: "bold",
                                            color: "#000000",
                                            paddingLeft: "0.5cm",
                                            marginBottom: "0.1cm"
                                          }}
                                        >
                                          -  ({getUnitLabel(item)}: {item.quantity}) {item.name}
                                        </div>
                                      ))}
                                      {/* Comments */}
                                      {order.comments && (
                                        <div
                                          style={{
                                            fontSize: "10pt",
                                            fontStyle: "italic",
                                            color: "#666",
                                            paddingLeft: "0.5cm",
                                            marginTop: "0.1cm",
                                            marginBottom: "0.1cm"
                                          }}
                                        >
                                          💬 {order.comments}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      {/* ORDERS TABLE */}
      <div className="card bg-base-100 shadow-xl print:hidden">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">
                {selectedDate ? "Δεν υπάρχουν παραγγελίες για την επιλεγμένη ημερομηνία" : "Δεν υπάρχουν παραγγελίες ακόμη"}
              </p>
              <p className="text-sm">
                {selectedDate
                  ? "Δοκιμάστε να επιλέξετε διαφορετική ημερομηνία"
                  : "Οι παραγγελίες θα εμφανίζονται εδώ μόλις οι πελάτες κάνουν αγορές"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-base-content/70 print:hidden">
                Εμφάνιση {orders.length} {orders.length === 1 ? "παραγγελίας" : "παραγγελιών"} για{" "}
                {selectedDate ? formatDate(selectedDate) : "όλες τις ημερομηνίες"}
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Κωδικός Παραγγελίας</th>
                      <th>Πελάτης</th>
                      <th>Προϊόντα</th>
                      <th>Σύνολο</th>
                      <th>Κατάσταση</th>
                      <th>Ημερομηνία</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => {
                      const totalQuantity = order.orderItems.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      );

                      return (
                        <tr key={order._id}>
                          <td>
                            <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                          </td>

                          <td>
                            <div className="font-medium">{order.shippingAddress.fullName}</div>
                            <div className="text-sm opacity-60">
                              {order.shippingAddress.city}, {order.shippingAddress.state}
                            </div>
                            {order.comments && (
                              <div className="text-xs mt-1 italic font-semibold text-warning bg-warning/20 px-2 py-1 rounded">
                                💬 {order.comments}
                              </div>
                            )}
                          </td>

                          <td>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{totalQuantity} {totalQuantity === 1 ? 'προϊόν' : 'προϊόντα'}</div>
                                <div className="text-sm opacity-60">
                                  {order.orderItems[0]?.name}
                                  {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} ακόμη`}
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="btn btn-ghost btn-xs btn-square"
                                title="Προβολή λεπτομερειών παραγγελίας"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          <td>
                            <span className="font-semibold">-</span>
                          </td>

                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="select select-sm"
                              disabled={updateStatusMutation.isPending}
                            >
                              <option value="pending">Σε Αναμονή</option>
                              <option value="shipped">Στάλθηκε</option>
                              <option value="delivered">Παραδόθηκε</option>
                              <option value="cancelled">Ακυρώθηκε</option>
                            </select>
                          </td>

                          <td>
                            <div className="text-sm">
                              <div className="opacity-60">{formatDate(order.createdAt)}</div>
                              <div className="opacity-40 text-xs">{formatTime(order.createdAt)}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      <input
        type="checkbox"
        className="modal-toggle"
        checked={!!selectedOrder}
        onChange={(e) => {
          if (!e.target.checked) setSelectedOrder(null);
        }}
      />

      <div className="modal">
        <div className="modal-box max-w-3xl">
          {selectedOrder && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-2xl flex items-center gap-2">
                    <PackageIcon className="w-6 h-6" />
                    Λεπτομέρειες Παραγγελίας
                  </h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    Παραγγελία #{selectedOrder._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* CUSTOMER INFO */}
              <div className="bg-base-200 rounded-xl p-4 mb-4">
                <h4 className="font-semibold mb-3">Πληροφορίες Πελάτη</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-base-content/60">Όνομα:</span>
                    <span className="ml-2 font-medium">{selectedOrder.shippingAddress.fullName}</span>
                  </div>
                  <div>
                    <span className="text-base-content/60">Τηλέφωνο:</span>
                    <span className="ml-2 font-medium">{selectedOrder.shippingAddress.phoneNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-base-content/60">Διεύθυνση:</span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.shippingAddress.streetAddress}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base-content/60">Ημερομηνία Παραλαβής:</span>
                      <input
                        type="date"
                        value={selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const newDate = new Date(e.target.value);
                            updateDeliveryDateMutation.mutate({
                              orderId: selectedOrder._id,
                              deliveryDate: newDate.toISOString(),
                            });
                          }
                        }}
                        className="input input-bordered input-sm"
                        disabled={updateDeliveryDateMutation.isPending}
                      />
                      {updateDeliveryDateMutation.isPending && (
                        <span className="loading loading-spinner loading-sm"></span>
                      )}
                    </div>
                  </div>
                  {selectedOrder.comments && (
                    <div className="col-span-2">
                      <span className="text-base-content/60">Σχόλια:</span>
                      <div className="mt-1 text-sm font-semibold text-warning bg-warning/20 px-3 py-2 rounded italic">
                        💬 {selectedOrder.comments}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div className="mb-4">
                <h4 className="font-semibold mb-3">Προϊόντα Παραγγελίας</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-base-200 rounded-xl"
                    >
                      <div className="avatar">
                        <div className="w-16 rounded-lg">
                          <img src={item.image} alt={item.name} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold">{item.name}</h5>
                        <div className="flex items-center gap-4 mt-1 text-sm text-base-content/70">
                          <span>Ποσότητα: {item.quantity}</span>
                          <span>Τιμή: -</span>
                          <span className="font-semibold text-base-content">
                            Υποσύνολο: -
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="border-t border-base-300 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base-content/70">Υποσύνολο:</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base-content/70">Φόρος (5%):</span>
                  <span className="font-medium">-</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-base-300">
                  <span>Σύνολο:</span>
                  <span>-</span>
                </div>
              </div>

              {/* ORDER STATUS & DATE */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-base-content/70">Κατάσταση:</span>
                  <span className={`ml-2 badge ${
                    selectedOrder.status === "delivered" ? "badge-success" :
                    selectedOrder.status === "shipped" ? "badge-info" :
                    selectedOrder.status === "cancelled" ? "badge-error" :
                    "badge-warning"
                  }`}>
                    {selectedOrder.status === "delivered" ? "Παραδόθηκε" :
                      selectedOrder.status === "shipped" ? "Στάλθηκε" :
                      selectedOrder.status === "cancelled" ? "Ακυρώθηκε" :
                        "Σε Αναμονή"}
                  </span>
                </div>
                <div>
                  <span className="text-base-content/70">Ημερομηνία Παραγγελίας:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <div className="modal-action">
                <button onClick={() => setSelectedOrder(null)} className="btn">
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
export default OrdersPage;
