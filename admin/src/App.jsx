import { Navigate, Route, Routes } from "react-router";
import LoginPage from "./pages/LoginPage";
import { useAuth, useUser } from "@clerk/clerk-react";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";
import BannersPage from "./pages/BannersPage";
import OrdersPage from "./pages/OrdersPage";
import CustomersPage from "./pages/CustomersPage";
import ReviewsPage from "./pages/ReviewsPage";
import DashboardLayout from "./layouts/DashboardLayout";

import PageLoader from "./components/PageLoader";

function App() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isLoaded || !isUserLoaded) return <PageLoader />;

  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <Routes>
      <Route
        path="/login"
        element={isSignedIn && isAdmin ? <Navigate to={"/dashboard"} /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          isSignedIn && isAdmin ? (
            <DashboardLayout />
          ) : (
            <Navigate to={"/login"} replace />
          )
        }
      >
        <Route index element={<Navigate to={"dashboard"} />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
