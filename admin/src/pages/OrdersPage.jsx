import { useState, useMemo } from "react";
import { orderApi } from "../lib/api";
import { formatDate, formatTime, formatDateTime, formatDateWithDayName } from "../lib/utils";
import { PrinterIcon, CalendarIcon, EyeIcon, XIcon, PackageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
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

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const allOrders = ordersData?.orders || [];

  // Filter orders by selected date
  const orders = useMemo(() => {
    if (!selectedDate) return allOrders;

    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const nextDay = new Date(selected);
    nextDay.setDate(nextDay.getDate() + 1);

    return allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= selected && orderDate < nextDay;
    });
  }, [allOrders, selectedDate]);

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
                // Group orders by date (day starts at 7:00 AM)
                const ordersByDate = {};
                orders.forEach((order) => {
                  const orderDate = new Date(order.createdAt);
                  // Shift time by 7 hours to make day start at 7:00 AM
                  const shiftedDate = new Date(orderDate);
                  shiftedDate.setHours(shiftedDate.getHours() - 7);
                  // Set to start of day (which is now 7:00 AM of the original day)
                  shiftedDate.setHours(0, 0, 0, 0);
                  const dateKey = shiftedDate.toISOString().split('T')[0];

                  if (!ordersByDate[dateKey]) {
                    ordersByDate[dateKey] = [];
                  }
                  ordersByDate[dateKey].push(order);
                });

                const dateKeys = Object.keys(ordersByDate).sort();

                return dateKeys.map((dateKey, dateIndex) => {
                  const dateOrders = ordersByDate[dateKey];

                  // Calculate the display date (shifted date + 7 hours = actual date for display)
                  const displayDate = new Date(dateKey);
                  displayDate.setHours(7, 0, 0, 0);

                  // Count orders per customer for this date
                  const customerOrderCount = {};
                  dateOrders.forEach((order) => {
                    const customerName = order.shippingAddress.fullName;
                    if (!customerOrderCount[customerName]) {
                      customerOrderCount[customerName] = 0;
                    }
                    customerOrderCount[customerName]++;
                  });

                  // Track current count per customer
                  const customerCurrentCount = {};

                  return (
                    <div key={dateKey} style={{ marginBottom: "1cm", pageBreakInside: "avoid" }}>
                      {/* Date - show only once per date group */}
                      <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#000000", backgroundColor: "#FFFF00", padding: "0.1cm 0.2cm", display: "inline-block", marginBottom: "0.5cm" }}>
                        Ημερομηνία {formatDateWithDayName(displayDate.toISOString())}
                      </div>

                      {/* All orders for this date */}
                      {dateOrders.map((order, orderIndex) => {
                        // Group order items by category (shop)
                        const itemsByCategory = {};
                        order.orderItems.forEach((item) => {
                          const category = item.category || item.product?.category || "Άλλη Κατηγορία";
                          if (!itemsByCategory[category]) {
                            itemsByCategory[category] = [];
                          }
                          itemsByCategory[category].push(item);
                        });

                        const categories = Object.keys(itemsByCategory);
                        const customerName = order.shippingAddress.fullName;

                        // Increment count for this customer
                        if (!customerCurrentCount[customerName]) {
                          customerCurrentCount[customerName] = 0;
                        }
                        customerCurrentCount[customerName]++;

                        // Determine if this is a supplementary order
                        const isSupplementary = customerOrderCount[customerName] > 1;
                        const supplementaryNumber = customerCurrentCount[customerName] - 1;
                        const displayName = isSupplementary
                          ? `${customerName} - συμπληρωματική ${supplementaryNumber}`
                          : customerName;

                        return (
                          <div key={order._id} style={{ marginBottom: "0.4cm" }}>
                            {/* Products grouped by category */}
                            {categories.map((category, catIndex) => {
                              const firstItem = itemsByCategory[category][0];
                              const remainingItems = itemsByCategory[category].slice(1);

                              // Helper function to get unit label
                              const getUnitLabel = (item) => {
                                const unitType = item.product?.unitType || "pieces";
                                if (unitType === "kg") return "kg";
                                if (unitType === "liters") return "συσκευασία";
                                return "τμχ"; // pieces
                              };

                              return (
                                <div key={category} style={{ marginBottom: "0.4cm" }}>
                                  {/* Customer Name with first product on same line */}
                                  <div style={{ fontSize: "12pt", fontWeight: "bold", color: "#000000", marginBottom: "0.1cm" }}>
                                    <span style={{ backgroundColor: "#FFFF00", padding: "0.1cm 0.2cm", display: "inline-block" }}>
                                      {displayName}
                                    </span>
                                    <span style={{ marginLeft: "0.3cm" }}>
                                      -  ({getUnitLabel(firstItem)}: {firstItem.quantity}) {firstItem.name}
                                    </span>
                                  </div>
                                  {/* Remaining products */}
                                  {remainingItems.map((item, itemIndex) => (
                                    <div
                                      key={itemIndex}
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
                                  {/* Separator line after each category */}
                                  {catIndex < categories.length - 1 && (
                                    <div style={{
                                      borderTop: "2px solid #000000",
                                      marginTop: "0.3cm",
                                      marginBottom: "0.3cm"
                                    }}></div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Separator line after each order (except last order of last date) */}
                            {!(dateIndex === dateKeys.length - 1 && orderIndex === dateOrders.length - 1) && (
                              <div style={{
                                borderTop: "2px solid #000000",
                                marginTop: "0.3cm",
                                marginBottom: "0.3cm"
                              }}></div>
                            )}
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
                  <span className={`ml-2 badge ${selectedOrder.status === "delivered" ? "badge-success" :
                    selectedOrder.status === "shipped" ? "badge-info" :
                      "badge-warning"
                    }`}>
                    {selectedOrder.status === "delivered" ? "Παραδόθηκε" :
                      selectedOrder.status === "shipped" ? "Στάλθηκε" :
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
