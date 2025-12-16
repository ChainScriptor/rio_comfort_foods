import { UserButton } from "@clerk/clerk-react";
import { useLocation } from "react-router";

import {
  ClipboardListIcon,
  HomeIcon,
  PanelLeftIcon,
  ShoppingBagIcon,
  UsersIcon,
  TagIcon,
  StarIcon,
} from "lucide-react";

export const NAVIGATION = [
  { name: "Πίνακας Ελέγχου", path: "/dashboard", icon: <HomeIcon className="size-5" /> },
  { name: "Προϊόντα", path: "/products", icon: <ShoppingBagIcon className="size-5" /> },
  { name: "Κατηγορίες", path: "/categories", icon: <TagIcon className="size-5" /> },
  { name: "Παραγγελίες", path: "/orders", icon: <ClipboardListIcon className="size-5" /> },
  { name: "Πελάτες", path: "/customers", icon: <UsersIcon className="size-5" /> },
  { name: "Αξιολογήσεις", path: "/reviews", icon: <StarIcon className="size-5" /> },
];

function Navbar() {
  const location = useLocation();

  return (
    <div className="navbar w-full bg-base-300">
      <label htmlFor="my-drawer" className="btn btn-square btn-ghost" aria-label="open sidebar">
        <PanelLeftIcon className="size-5" />
      </label>

      <div className="flex-1 px-4">
        <h1 className="text-xl font-bold">
          {NAVIGATION.find((item) => item.path === location.pathname)?.name || "Πίνακας Ελέγχου"}
        </h1>
      </div>

      <div className="mr-5">
        <UserButton />
      </div>
    </div>
  );
}

export default Navbar;
