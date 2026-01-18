export interface Product {
  _id: string;
  name: string;
  description: string;
  price?: number;
  stock: number;
  category: string;
  images: string[];
  averageRating: number;
  totalReviews: number;
  unitType?: "pieces" | "kg" | "liters";
  unitOptions?: string[];
  showPrice?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
}

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  imageUrl: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  storeLocation: "Θεσσαλονίκη" | "Χαλκιδική Πρώτο Πόδι" | "Χαλκιδική Δεύτερο Πόδι" | "Χαλκιδική Τρίτο Πόδι" | "Άλλο";
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

export interface Order {
  _id: string;
  user: string;
  clerkId: string;
  orderItems: OrderItem[];
  shippingAddress: {
    storeLocation: "Θεσσαλονίκη" | "Χαλκιδική Πρώτο Πόδι" | "Χαλκιδική Δεύτερο Πόδι" | "Χαλκιδική Τρίτο Πόδι" | "Άλλο";
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
  };
  paymentResult: {
    id: string;
    status: string;
  };
  totalPrice: number;
  status: "pending" | "shipped" | "delivered";
  deliveryDate?: string;
  comments?: string;
  hasReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedUnit?: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string | User;
  orderId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  selectedUnit?: string;
}

export interface Cart {
  _id: string;
  user: string;
  clerkId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
