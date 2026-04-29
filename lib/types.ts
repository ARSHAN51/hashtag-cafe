export type FoodType = "veg" | "non-veg";
export type OrderStatus = "pending" | "preparing" | "served";
export type WaiterRequestStatus = "pending" | "completed";

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image: string;
  type: FoodType;
  popular?: boolean;
  isAvailable?: boolean;
};

export type CartItem = MenuItem & {
  quantity: number;
};

export type OrderLineItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

export type OrderRecord = {
  id: string;
  tableNumber: string;
  items: OrderLineItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date | null;
};

export type WaiterRequest = {
  id: string;
  tableNumber: string;
  status: WaiterRequestStatus;
  createdAt: Date | null;
};

export type TableRecord = {
  id: string;
  tableNumber: string;
  menuUrl: string;
  createdAt: Date | null;
};

export type MenuFormValues = {
  name: string;
  description?: string;
  price: number;
  category: string;
  image: string;
  type: FoodType;
  popular?: boolean;
  isAvailable?: boolean;
};
