import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderApi, statsApi } from "../lib/api";
import { DollarSignIcon, PackageIcon, ShoppingBagIcon, UsersIcon, CalendarIcon } from "lucide-react";
import { capitalizeText, formatDate, getOrderStatusBadge } from "../lib/utils";

function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Generate month options
  const monthOptions = [
    { value: "01", label: "Ιανουάριος" },
    { value: "02", label: "Φεβρουάριος" },
    { value: "03", label: "Μάρτιος" },
    { value: "04", label: "Απρίλιος" },
    { value: "05", label: "Μάιος" },
    { value: "06", label: "Ιούνιος" },
    { value: "07", label: "Ιούλιος" },
    { value: "08", label: "Αύγουστος" },
    { value: "09", label: "Σεπτέμβριος" },
    { value: "10", label: "Οκτώβριος" },
    { value: "11", label: "Νοέμβριος" },
    { value: "12", label: "Δεκέμβριος" },
  ];

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
  });

  // Build query params for API
  const getQueryParams = () => {
    if (selectedPeriod === "custom" && selectedMonth && selectedYear) {
      return { period: "custom", month: selectedMonth, year: selectedYear };
    }
    return { period: selectedPeriod };
  };

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats", selectedPeriod, selectedMonth, selectedYear],
    queryFn: () => statsApi.getDashboard(getQueryParams()),
  });

  // it would be better to send the last 5 items from the api, instead of slicing it here
  // but we're just keeping it simple here...
  const recentOrders = ordersData?.orders?.slice(0, 5) || [];

  const statsCards = [
    {
      name: "Συνολικά Έσοδα",
      value: statsLoading ? "..." : `$${statsData?.totalRevenue?.toFixed(2) || 0}`,
      icon: <DollarSignIcon className="size-8" />,
    },
    {
      name: "Συνολικές Παραγγελίες",
      value: statsLoading ? "..." : statsData?.totalOrders || 0,
      icon: <ShoppingBagIcon className="size-8" />,
    },
    {
      name: "Συνολικοί Πελάτες",
      value: statsLoading ? "..." : statsData?.totalCustomers || 0,
      icon: <UsersIcon className="size-8" />,
    },
    {
      name: "Συνολικά Προϊόντα",
      value: statsLoading ? "..." : statsData?.totalProducts || 0,
      icon: <PackageIcon className="size-8" />,
    },
  ];

  const periodOptions = [
    { value: "all", label: "Όλος ο Χρόνος" },
    { value: "year", label: "Τελευταίος Χρόνος" },
    { value: "month", label: "Τελευταίος Μήνας" },
    { value: "week", label: "Τελευταία Εβδομάδα" },
    { value: "custom", label: "Συγκεκριμένος Μήνας" },
  ];

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (period !== "custom") {
      setSelectedMonth("");
    }
  };

  return (
    <div className="space-y-6">
      {/* PERIOD FILTER */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Στατιστικά Dashboard
              </h2>
              <p className="text-sm text-base-content/70 mt-1">
                Επιλέξτε την περίοδο για τα στατιστικά
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodChange(option.value)}
                    className={`btn btn-sm ${
                      selectedPeriod === option.value
                        ? "btn-primary"
                        : "btn-outline"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Custom Month/Year Selector */}
              {selectedPeriod === "custom" && (
                <div className="flex gap-3 items-end">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Μήνας</span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="">Επιλέξτε μήνα</option>
                      {monthOptions.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm">Χρόνος</span>
                    </label>
                    <select
                      className="select select-bordered select-sm"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
        {statsCards.map((stat) => (
          <div key={stat.name} className="stat">
            <div className="stat-figure text-primary">{stat.icon}</div>
            <div className="stat-title">{stat.name}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* RECENT ORDERS */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Πρόσφατες Παραγγελίες</h2>

          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">Δεν υπάρχουν παραγγελίες ακόμη</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Κωδικός Παραγγελίας</th>
                    <th>Πελάτης</th>
                    <th>Προϊόντα</th>
                    <th>Ποσό</th>
                    <th>Κατάσταση</th>
                    <th>Ημερομηνία</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                      </td>

                      <td>
                        <div>
                          <div className="font-medium">{order.shippingAddress.fullName}</div>
                          <div className="text-sm opacity-60">
                            {order.orderItems.length} item(s)
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="text-sm">
                          {order.orderItems[0]?.name}
                          {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                        </div>
                      </td>

                      <td>
                        <span className="font-semibold">${order.totalPrice.toFixed(2)}</span>
                      </td>

                      <td>
                        <div className={`badge ${getOrderStatusBadge(order.status)}`}>
                          {capitalizeText(order.status)}
                        </div>
                      </td>

                      <td>
                        <span className="text-sm opacity-60">{formatDate(order.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
