import { useState, useMemo } from "react";
import { orderApi } from "../lib/api";
import { formatDate } from "../lib/utils";
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
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-base-content/70">Manage customer orders</p>
        </div>

        {/* DATE FILTER & PRINT */}
        <div className="flex items-end gap-3">
          <div className="form-control">
            <label className="label">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="label-text text-sm">Filter by Date</span>
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
                  title="Show all dates"
                >
                  All
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
            Print
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
            <div className="print-header">
              <h2 style={{ fontSize: "18pt", fontWeight: "bold", marginBottom: "0.3cm" }}>
                Orders Report
              </h2>
              <p style={{ fontSize: "10pt", color: "#666", marginBottom: "0.2cm" }}>
                Date: {selectedDate ? formatDate(selectedDate) : "All Dates"}
              </p>
              <p style={{ fontSize: "10pt", color: "#666" }}>
                Total Orders: {orders.length}
              </p>
            </div>
            <div style={{ marginTop: "0.8cm" }}>
              {orders.map((order, index) => {
                const orderItemsText = order.orderItems
                  .map((item) => `${item.name} (x${item.quantity})`)
                  .join(", ");
                
                return (
                  <div key={order._id} className="print-order-line">
                    <span style={{ fontWeight: "bold", color: "#000000" }}>
                      {order.shippingAddress.fullName}
                    </span>
                    {" | "}
                    <span style={{ fontWeight: "bold", color: "#000000" }}>
                      {orderItemsText}
                    </span>
                  </div>
                );
              })}
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
                {selectedDate ? "No orders for selected date" : "No orders yet"}
              </p>
              <p className="text-sm">
                {selectedDate
                  ? "Try selecting a different date"
                  : "Orders will appear here once customers make purchases"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-base-content/70 print:hidden">
                Showing {orders.length} order{orders.length !== 1 ? "s" : ""} for{" "}
                {selectedDate ? formatDate(selectedDate) : "all dates"}
              </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
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
                              <div className="font-medium">{totalQuantity} items</div>
                              <div className="text-sm opacity-60">
                                {order.orderItems[0]?.name}
                                {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-ghost btn-xs btn-square"
                              title="View order details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        <td>
                          <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
                        </td>

                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="select select-sm"
                            disabled={updateStatusMutation.isPending}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        <td>
                          <span className="text-sm opacity-60">{formatDate(order.createdAt)}</span>
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
                    Order Details
                  </h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    Order #{selectedOrder._id.slice(-8).toUpperCase()}
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
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-base-content/60">Name:</span>
                    <span className="ml-2 font-medium">{selectedOrder.shippingAddress.fullName}</span>
                  </div>
                  <div>
                    <span className="text-base-content/60">Phone:</span>
                    <span className="ml-2 font-medium">{selectedOrder.shippingAddress.phoneNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-base-content/60">Address:</span>
                    <span className="ml-2 font-medium">
                      {selectedOrder.shippingAddress.streetAddress}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* ORDER ITEMS */}
              <div className="mb-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
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
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: ${item.price.toFixed(2)}</span>
                          <span className="font-semibold text-base-content">
                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
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
                  <span className="text-base-content/70">Subtotal:</span>
                  <span className="font-medium">
                    ${(selectedOrder.totalPrice * 0.95).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base-content/70">Tax (5%):</span>
                  <span className="font-medium">
                    ${(selectedOrder.totalPrice * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-base-300">
                  <span>Total:</span>
                  <span>${selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* ORDER STATUS & DATE */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <span className="text-base-content/70">Status:</span>
                  <span className={`ml-2 badge ${
                    selectedOrder.status === "delivered" ? "badge-success" :
                    selectedOrder.status === "shipped" ? "badge-info" :
                    "badge-warning"
                  }`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-base-content/70">Order Date:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              <div className="modal-action">
                <button onClick={() => setSelectedOrder(null)} className="btn">
                  Close
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
