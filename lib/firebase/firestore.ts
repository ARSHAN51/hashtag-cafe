import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  FIRESTORE_WRITE_TIMEOUT_MS,
} from "@/lib/constants";
import { firestoreDb } from "@/lib/firebase/client";
import { STARTER_MENU_ITEMS } from "@/lib/starter-menu";
import type {
  MenuFormValues,
  MenuItem,
  OrderLineItem,
  OrderRecord,
  OrderStatus,
  TableRecord,
  WaiterRequest,
} from "@/lib/types";
import { sortMenuItems, sortOrders } from "@/lib/utils";

function getDatabase() {
  if (!firestoreDb) {
    throw new Error("Firebase Firestore is not configured.");
  }

  return firestoreDb;
}

function withWriteTimeout<T>(promise: Promise<T>, actionLabel: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(
          new Error(
            `${actionLabel} is taking too long. Check Firestore rules, database setup, and your internet connection, then try again.`,
          ),
        );
      }, FIRESTORE_WRITE_TIMEOUT_MS);
    }),
  ]);
}

function normalizeTableNumber(tableNumber: string) {
  const nextTableNumber = tableNumber.trim();

  if (!nextTableNumber) {
    throw new Error("A valid table number is required.");
  }

  return nextTableNumber;
}

function sanitizeMenuValues(values: MenuFormValues) {
  const category = values.category.trim();
  const image = values.image.trim();
  const name = values.name.trim();
  const description = (values.description ?? "").trim();
  const price = Number(values.price);

  if (!name) {
    throw new Error("Menu item name is required.");
  }

  if (!category) {
    throw new Error("Menu category is required.");
  }

  if (!image) {
    throw new Error("Menu image URL is required.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Menu price must be greater than zero.");
  }

  return {
    category,
    description,
    image,
    isAvailable: values.isAvailable !== false,
    name,
    popular: Boolean(values.popular),
    price,
    type: values.type,
  };
}

function toDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate() as Date;
  }

  return null;
}

function toTableRecord(snapshot: {
  data: () => Record<string, unknown>;
  id: string;
}): TableRecord {
  const data = snapshot.data();

  return {
    createdAt: toDate(data.createdAt),
    id: snapshot.id,
    menuUrl: String(data.menuUrl ?? ""),
    tableNumber: String(data.tableNumber ?? snapshot.id),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toMenuItem(snapshot: {
  data: () => Record<string, unknown>;
  id: string;
}): MenuItem {
  const data = snapshot.data();

  return {
    category: String(data.category ?? "Menu"),
    description: typeof data.description === "string" ? data.description : undefined,
    id: snapshot.id,
    image: String(data.image ?? ""),
    // Defaults to TRUE when the field is missing on the Firestore doc — only
    // an explicit `false` hides the item. This matters because legacy/seeded
    // docs may not have the `isAvailable` field at all.
    isAvailable: data.isAvailable !== false,
    name: String(data.name ?? ""),
    popular: Boolean(data.popular),
    price: Number(data.price ?? 0),
    type: data.type === "non-veg" ? "non-veg" : "veg",
  };
}

function toOrderRecord(snapshot: {
  data: () => Record<string, unknown>;
  id: string;
}): OrderRecord {
  const data = snapshot.data();
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return {
    createdAt: toDate(data.createdAt),
    id: snapshot.id,
    items: rawItems.map((item, index) => {
      const nextItem =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};

      return {
        id: String(nextItem.id ?? `${snapshot.id}-${index}`),
        image: typeof nextItem.image === "string" ? nextItem.image : undefined,
        name: String(nextItem.name ?? "Item"),
        price: Number(nextItem.price ?? 0),
        quantity: Number(nextItem.quantity ?? 1),
      };
    }),
    status:
      data.status === "preparing" || data.status === "served"
        ? data.status
        : "pending",
    tableNumber: String(data.tableNumber ?? ""),
    totalAmount: Number(data.totalAmount ?? 0),
  };
}

function toWaiterRequest(snapshot: {
  data: () => Record<string, unknown>;
  id: string;
}): WaiterRequest {
  const data = snapshot.data();

  return {
    createdAt: toDate(data.createdAt),
    id: snapshot.id,
    status: data.status === "completed" ? "completed" : "pending",
    tableNumber: String(data.tableNumber ?? ""),
  };
}

const NOT_CONFIGURED_MESSAGE =
  "Firebase not configured. Check .env.local";

// Wraps a Firestore listener error so the UI gets a friendly message and
// the underlying error is logged in dev for fast diagnosis.
function handleSubscriptionError(label: string, onError?: (error: Error) => void) {
  return (err: Error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[firestore] ${label} subscription error:`, err);
    }
    onError?.(err);
  };
}

export function subscribeToMenuItems(
  onData: (menuItems: MenuItem[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firestoreDb) {
    onError?.(new Error(NOT_CONFIGURED_MESSAGE));
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(firestoreDb, "menu"),
    (snapshot) => {
      onData(sortMenuItems(snapshot.docs.map(toMenuItem)));
    },
    handleSubscriptionError("menu", onError),
  );
}

export function subscribeToOrders(
  onData: (orders: OrderRecord[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firestoreDb) {
    onError?.(new Error(NOT_CONFIGURED_MESSAGE));
    onData([]);
    return () => undefined;
  }

  // Today-only window: filters orders created since 00:00 local time and
  // limits to the most recent 200. Requires a composite index on `createdAt`
  // (Firebase will auto-prompt to create it on first query).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const ordersQuery = query(
    collection(firestoreDb, "orders"),
    where("createdAt", ">=", startOfToday),
    orderBy("createdAt", "desc"),
    limit(200),
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      onData(sortOrders(snapshot.docs.map(toOrderRecord)));
    },
    handleSubscriptionError("orders", onError),
  );
}

export function subscribeToWaiterRequests(
  onData: (requests: WaiterRequest[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firestoreDb) {
    onError?.(new Error(NOT_CONFIGURED_MESSAGE));
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(firestoreDb, "waiterRequests"),
    (snapshot) => {
      const requests = snapshot.docs
        .map(toWaiterRequest)
        .sort(
          (left, right) =>
            (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0),
        );

      onData(requests);
    },
    handleSubscriptionError("waiterRequests", onError),
  );
}

export function subscribeToTables(
  onData: (tables: TableRecord[]) => void,
  onError?: (error: Error) => void,
) {
  if (!firestoreDb) {
    onError?.(new Error(NOT_CONFIGURED_MESSAGE));
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(firestoreDb, "tables"),
    (snapshot) => {
      const tables = snapshot.docs
        .map(toTableRecord)
        .sort(
          (left, right) =>
            Number(left.tableNumber) - Number(right.tableNumber),
        );

      onData(tables);
    },
    handleSubscriptionError("tables", onError),
  );
}

export function subscribeToOrder(
  orderId: string,
  onData: (order: OrderRecord | null) => void,
  onError?: (error: Error) => void,
) {
  if (!firestoreDb) {
    onError?.(new Error(NOT_CONFIGURED_MESSAGE));
    onData(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(firestoreDb, "orders", orderId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(toOrderRecord(snapshot));
    },
    handleSubscriptionError("order", onError),
  );
}

// ─── "Fetch first" helpers (getDocs) ────────────────────────────────────────
// These power the "fetch-first, then subscribe" architecture that makes data
// load reliably on mobile where onSnapshot alone can silently never fire.

export async function fetchMenuItems(): Promise<MenuItem[]> {
  if (!firestoreDb) throw new Error("Firebase is not configured.");
  const snap = await getDocs(collection(firestoreDb, "menu"));
  return sortMenuItems(snap.docs.map(toMenuItem));
}

export async function fetchOrders(): Promise<OrderRecord[]> {
  if (!firestoreDb) throw new Error("Firebase is not configured.");
  const snap = await getDocs(collection(firestoreDb, "orders"));
  return sortOrders(snap.docs.map(toOrderRecord));
}

export async function fetchWaiterRequests(): Promise<WaiterRequest[]> {
  if (!firestoreDb) throw new Error("Firebase is not configured.");
  const snap = await getDocs(collection(firestoreDb, "waiterRequests"));
  return snap.docs
    .map(toWaiterRequest)
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function placeOrder({
  items,
  tableNumber,
  totalAmount,
}: {
  items: OrderLineItem[];
  tableNumber: string;
  totalAmount: number;
}): Promise<string> {
  const database = getDatabase();
  const nextTableNumber = normalizeTableNumber(tableNumber);

  if (items.length === 0) {
    throw new Error("Add at least one item before placing an order.");
  }

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Order total must be greater than zero.");
  }

  const docRef = await withWriteTimeout(
    addDoc(collection(database, "orders"), {
      createdAt: serverTimestamp(),
      items: items.map((item) => ({
        id: item.id,
        image: item.image ?? "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      status: "pending",
      tableNumber: nextTableNumber,
      totalAmount,
    }),
    "Placing the order",
  );

  return docRef.id;
}

export async function createWaiterRequest(tableNumber: string) {
  const database = getDatabase();
  const nextTableNumber = normalizeTableNumber(tableNumber);

  await withWriteTimeout(
    setDoc(doc(database, "waiterRequests", nextTableNumber), {
      createdAt: serverTimestamp(),
      status: "pending",
      tableNumber: nextTableNumber,
    }),
    "Sending the waiter request",
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const database = getDatabase();
  await withWriteTimeout(
    updateDoc(doc(database, "orders", orderId), { status }),
    "Updating the order status",
  );
}

export async function deleteOrder(orderId: string) {
  const database = getDatabase();
  await withWriteTimeout(
    deleteDoc(doc(database, "orders", orderId)),
    "Deleting the order",
  );
}

export async function updateWaiterRequestStatus(
  requestId: string,
  status: WaiterRequest["status"],
) {
  const database = getDatabase();
  await withWriteTimeout(
    updateDoc(doc(database, "waiterRequests", requestId), { status }),
    "Updating the waiter request",
  );
}

export async function createMenuItem(values: MenuFormValues) {
  const database = getDatabase();
  const sanitizedValues = sanitizeMenuValues(values);

  await withWriteTimeout(
    addDoc(collection(database, "menu"), {
      ...sanitizedValues,
    }),
    "Saving the menu item",
  );
}

export async function updateMenuItem(
  menuItemId: string,
  values: MenuFormValues,
) {
  const database = getDatabase();
  const sanitizedValues = sanitizeMenuValues(values);

  await withWriteTimeout(
    updateDoc(doc(database, "menu", menuItemId), {
      ...sanitizedValues,
    }),
    "Updating the menu item",
  );
}

export async function deleteMenuItem(menuItemId: string) {
  const database = getDatabase();
  await withWriteTimeout(
    deleteDoc(doc(database, "menu", menuItemId)),
    "Deleting the menu item",
  );
}

export async function seedStarterMenu() {
  const database = getDatabase();
  const batch = writeBatch(database);

  STARTER_MENU_ITEMS.forEach((item) => {
    const menuId = slugify(`${item.category}-${item.name}`);

    batch.set(doc(database, "menu", menuId), sanitizeMenuValues(item));
  });

  await withWriteTimeout(batch.commit(), "Loading the starter menu");
}

export async function createTables(totalTables: number, baseUrl: string) {
  const database = getDatabase();
  const sanitizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const normalizedTotalTables = Math.floor(totalTables);

  if (!sanitizedBaseUrl) {
    throw new Error("A valid site URL is required to generate table QR codes.");
  }

  if (!Number.isFinite(normalizedTotalTables) || normalizedTotalTables <= 0) {
    throw new Error("Enter a table count greater than zero.");
  }

  const batch = writeBatch(database);

  for (let table = 1; table <= normalizedTotalTables; table += 1) {
    const tableNumber = String(table);
    const menuUrl = `${sanitizedBaseUrl}/menu?table=${tableNumber}`;

    batch.set(doc(database, "tables", tableNumber), {
      createdAt: serverTimestamp(),
      menuUrl,
      tableNumber,
    });
  }

  await withWriteTimeout(batch.commit(), "Generating the table QR set");
}

export async function deleteTable(tableId: string) {
  const database = getDatabase();

  await withWriteTimeout(
    deleteDoc(doc(database, "tables", tableId)),
    "Deleting the table QR",
  );
}
